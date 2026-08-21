using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using LostFound.Application.Abstractions;
using LostFound.Domain.Entities;
using LostFound.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LostFound.Infrastructure.Matching;

public sealed class MatchingOptions { public decimal CandidateThreshold { get; set; }=45; public decimal StrongThreshold { get; set; }=65; public decimal HighConfidenceThreshold { get; set; }=82; public int DateWindowDays { get; set; }=60; public double RegionalDistanceKm { get; set; }=100; public string EngineVersion { get; set; }="deterministic-v1"; }
public sealed record MatchExplanation(string Key,decimal Score,decimal Weight,string? Detail=null);

public sealed class NoOpAiMatchingProvider : IAiMatchingProvider { public Task<IReadOnlyDictionary<Guid,decimal>> ScoreAsync(MatchingProviderRequest request,CancellationToken cancellationToken)=>Task.FromResult<IReadOnlyDictionary<Guid,decimal>>(new Dictionary<Guid,decimal>()); }
public sealed class LocalTextModerationService : ITextModerationService {
 static readonly string[] Blocked=["child sexual abuse","terrorist recruitment","credit card dump"];
 public Task<ModerationResult> CheckAsync(string text,CancellationToken ct){var n=Normalize(text);var reasons=Blocked.Where(n.Contains).Select(_=>"unsafe_content").Distinct().ToArray();ModerationResult result=reasons.Length==0?new(ModerationOutcome.Allowed,Array.Empty<string>(),"local-v1"):new(ModerationOutcome.Blocked,reasons,"local-v1");return Task.FromResult(result);}
 internal static string Normalize(string value)=>Regex.Replace(value.Normalize(NormalizationForm.FormKC).ToLowerInvariant(),@"\s+"," ").Trim();
}
public sealed class ManualReviewImageModerationService : IImageModerationService { public Task<ModerationResult> CheckAsync(Stream image,CancellationToken ct)=>Task.FromResult(new ModerationResult(ModerationOutcome.ReviewRequired,["provider_disabled"],"manual-v1")); }

public sealed class DeterministicMatchingService(LostFoundDbContext db,IOptions<MatchingOptions> options) : IItemMatchingService {
 readonly MatchingOptions policy=options.Value;
 public async Task<IReadOnlyList<ItemMatchScore>> FindMatchesAsync(Guid itemId,CancellationToken ct){
  var source=await db.Items.AsNoTracking().Include(x=>x.Attributes).SingleOrDefaultAsync(x=>x.Id==itemId,ct);
  if(source is null||!Eligible(source))return [];
  var opposite=source.Type==ItemType.Lost?ItemType.Found:ItemType.Lost;var min=source.OccurredAtUtc.AddDays(-policy.DateWindowDays);var max=source.OccurredAtUtc.AddDays(policy.DateWindowDays);
  var query=db.Items.AsNoTracking().Include(x=>x.Attributes).Where(x=>x.Id!=source.Id&&x.Type==opposite&&(x.Status==ItemStatus.Active||x.Status==ItemStatus.Matched)&&x.CategoryId==source.CategoryId&&x.OccurredAtUtc>=min&&x.OccurredAtUtc<=max);
  if(source.SubcategoryId.HasValue)query=query.Where(x=>x.SubcategoryId==source.SubcategoryId||x.SubcategoryId==null);
  if(Valid(source.Latitude,source.Longitude)){var d=policy.RegionalDistanceKm;var lat=d/111d;var lon=d/(111d*Math.Max(.2,Math.Cos(source.Latitude!.Value*Math.PI/180)));query=query.Where(x=>x.Latitude==null||(x.Latitude>=source.Latitude-lat&&x.Latitude<=source.Latitude+lat&&x.Longitude>=source.Longitude-lon&&x.Longitude<=source.Longitude+lon));}
  var candidates=await query.OrderByDescending(x=>x.CreatedAtUtc).Take(500).ToListAsync(ct);var output=new List<ItemMatchScore>();
  foreach(var candidate in candidates){var (score,parts)=Score(source,candidate);if(score<policy.CandidateThreshold)continue;var lost=source.Type==ItemType.Lost?source:candidate;var found=source.Type==ItemType.Found?source:candidate;var match=await db.ItemMatches.SingleOrDefaultAsync(x=>x.LostItemId==lost.Id&&x.FoundItemId==found.Id,ct);if(match is null){match=new(){LostItemId=lost.Id,FoundItemId=found.Id};db.ItemMatches.Add(match);}match.MatchScore=score;match.ScoreBreakdownJson=JsonSerializer.Serialize(parts);match.EngineVersion=policy.EngineVersion;match.Status=match.Status is MatchStatus.Dismissed or MatchStatus.Confirmed?match.Status:score>=policy.StrongThreshold?MatchStatus.Suggested:MatchStatus.Candidate;match.UpdatedAtUtc=DateTime.UtcNow;match.ConcurrencyToken=Guid.NewGuid();output.Add(new(candidate.Id,score));}
  await db.SaveChangesAsync(ct);
  var strong=await db.ItemMatches.Include(x=>x.LostItem).Include(x=>x.FoundItem).Where(x=>(x.LostItemId==itemId||x.FoundItemId==itemId)&&x.Status==MatchStatus.Suggested&&x.NotifiedAtUtc==null).ToListAsync(ct);
  foreach(var match in strong){foreach(var userId in new[]{match.LostItem.OwnerId,match.FoundItem.OwnerId}.Distinct()){if(await db.Users.AsNoTracking().AnyAsync(x=>x.Id==userId&&x.NotificationsEnabled&&x.InAppNotificationsEnabled,ct))db.Notifications.Add(new(){UserId=userId,Type="match.suggested",PayloadJson=JsonSerializer.Serialize(new{matchId=match.Id,score=match.MatchScore})});}match.NotifiedAtUtc=DateTime.UtcNow;match.NotificationVersion=match.EngineVersion;}
  await db.SaveChangesAsync(ct);return output.OrderByDescending(x=>x.Score).ToList();
 }
 static bool Eligible(Item x)=>!x.IsDeleted&&(x.Status==ItemStatus.Active||x.Status==ItemStatus.Matched);
 static bool Valid(double? lat,double? lon)=>lat is >=-90 and <=90&&lon is >=-180 and <=180;
 internal static (decimal Score,IReadOnlyList<MatchExplanation> Parts) Score(Item a,Item b){var parts=new List<MatchExplanation>();void Add(string k,decimal similarity,decimal weight,string? detail=null)=>parts.Add(new(k,Math.Round(similarity*weight,2),weight,detail));Add("category",a.CategoryId==b.CategoryId?1:0,25);Add("subcategory",a.SubcategoryId.HasValue&&a.SubcategoryId==b.SubcategoryId?1:0,10);Add("title",Tokens(a.Title,b.Title),15);Add("description",Tokens(a.Description,b.Description),8);Add("brand",Text(a.Brand,b.Brand),8);Add("color",Text(a.Color,b.Color),7);Add("locationName",Tokens(a.Location,b.Location),5);var days=Math.Abs((a.OccurredAtUtc-b.OccurredAtUtc).TotalDays);Add("date",(decimal)Math.Max(0,1-days/60),10,days.ToString("0",CultureInfo.InvariantCulture)+"d");if(Valid(a.Latitude,a.Longitude)&&Valid(b.Latitude,b.Longitude)){var km=Distance(a.Latitude!.Value,a.Longitude!.Value,b.Latitude!.Value,b.Longitude!.Value);Add("distance",(decimal)(km<=2?1:km<=10?.75:km<=50?.35:0),7,km.ToString("0.0",CultureInfo.InvariantCulture)+"km");}var aa=a.Attributes.ToDictionary(x=>LocalTextModerationService.Normalize(x.Key),x=>LocalTextModerationService.Normalize(x.Value));var common=b.Attributes.Where(x=>aa.ContainsKey(LocalTextModerationService.Normalize(x.Key))).ToList();if(common.Count>0)Add("attributes",(decimal)common.Count(x=>aa[LocalTextModerationService.Normalize(x.Key)]==LocalTextModerationService.Normalize(x.Value))/common.Count,5,string.Join(',',common.Where(x=>aa[LocalTextModerationService.Normalize(x.Key)]==LocalTextModerationService.Normalize(x.Value)).Select(x=>x.Key).Take(5)));var available=parts.Sum(x=>x.Weight);var raw=parts.Sum(x=>x.Score);var score=available<50?raw:raw/available*100;return(Math.Clamp(Math.Round(score,2),0,100),parts);}
 static decimal Text(string? a,string? b)=>string.IsNullOrWhiteSpace(a)||string.IsNullOrWhiteSpace(b)?0:LocalTextModerationService.Normalize(a)==LocalTextModerationService.Normalize(b)?1:0;
 static decimal Tokens(string? a,string? b){if(string.IsNullOrWhiteSpace(a)||string.IsNullOrWhiteSpace(b))return 0;var x=LocalTextModerationService.Normalize(a).Split(' ',StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.Ordinal);var y=LocalTextModerationService.Normalize(b).Split(' ',StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.Ordinal);return x.Union(y).Any()?(decimal)x.Intersect(y).Count()/x.Union(y).Count():0;}
 internal static double Distance(double lat1,double lon1,double lat2,double lon2){const double r=6371;var p1=lat1*Math.PI/180;var p2=lat2*Math.PI/180;var dp=(lat2-lat1)*Math.PI/180;var dl=(lon2-lon1)*Math.PI/180;var h=Math.Sin(dp/2)*Math.Sin(dp/2)+Math.Cos(p1)*Math.Cos(p2)*Math.Sin(dl/2)*Math.Sin(dl/2);return r*2*Math.Atan2(Math.Sqrt(Math.Clamp(h,0,1)),Math.Sqrt(Math.Clamp(1-h,0,1)));}
}
