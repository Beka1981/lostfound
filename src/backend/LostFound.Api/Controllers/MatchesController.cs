using System.Security.Claims;
using System.Text.Json;
using Asp.Versioning;
using LostFound.Application.Abstractions;
using LostFound.Domain.Entities;
using LostFound.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LostFound.Api.Controllers;
[Authorize,ApiController,ApiVersion(1),Route("api/v{version:apiVersion}/matches")]
public sealed class MatchesController(LostFoundDbContext db,IItemMatchingService matcher):ControllerBase {
 Guid UserId=>Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
 [HttpGet] public async Task<ActionResult> List(Guid? itemId,MatchStatus? status,string sort="score",int page=1,int pageSize=20,CancellationToken ct=default){page=Math.Max(1,page);pageSize=Math.Clamp(pageSize,1,50);var q=Owned();if(itemId.HasValue)q=q.Where(x=>x.LostItemId==itemId||x.FoundItemId==itemId);if(status.HasValue)q=q.Where(x=>x.Status==status);q=sort=="newest"?q.OrderByDescending(x=>x.CreatedAtUtc):q.OrderByDescending(x=>x.MatchScore);var total=await q.CountAsync(ct);var rows=await q.Skip((page-1)*pageSize).Take(pageSize).Select(x=>new{x.Id,x.LostItemId,x.FoundItemId,x.MatchScore,x.Status,x.EngineVersion,x.CreatedAtUtc,x.UpdatedAtUtc,LostTitle=x.LostItem.Title,FoundTitle=x.FoundItem.Title}).ToListAsync(ct);return Ok(new{items=rows,page,pageSize,total});}
 [HttpGet("{id:guid}")] public async Task<ActionResult> Get(Guid id,CancellationToken ct){var x=await Owned().AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id,ct);if(x is null)return NotFound();return Ok(new{x.Id,x.LostItemId,x.FoundItemId,x.MatchScore,x.Status,x.EngineVersion,explanation=JsonSerializer.Deserialize<object>(x.ScoreBreakdownJson),x.CreatedAtUtc,x.UpdatedAtUtc});}
 [HttpPost("{id:guid}/view")] public Task<IActionResult> View(Guid id,CancellationToken ct)=>Transition(id,MatchStatus.Viewed,ct,MatchStatus.Suggested,MatchStatus.Candidate,MatchStatus.Viewed);
 [HttpPost("{id:guid}/dismiss")] public Task<IActionResult> Dismiss(Guid id,CancellationToken ct)=>Transition(id,MatchStatus.Dismissed,ct,MatchStatus.Candidate,MatchStatus.Suggested,MatchStatus.Viewed,MatchStatus.Dismissed);
 [HttpPost("{id:guid}/confirm")] public Task<IActionResult> Confirm(Guid id,CancellationToken ct)=>Transition(id,MatchStatus.Confirmed,ct,MatchStatus.Suggested,MatchStatus.Viewed,MatchStatus.Confirmed);
 [HttpPost("rescan/{itemId:guid}")] public async Task<ActionResult> Rescan(Guid itemId,CancellationToken ct){if(!User.IsInRole("Moderator")&&!User.IsInRole("Admin")&&!await db.Items.AnyAsync(x=>x.Id==itemId&&x.OwnerId==UserId,ct))return Forbid();var scores=await matcher.FindMatchesAsync(itemId,ct);await Notify(itemId,ct);return Accepted(new{candidates=scores.Count});}
 async Task<IActionResult> Transition(Guid id,MatchStatus next,CancellationToken ct,params MatchStatus[] allowed){var x=await Owned().SingleOrDefaultAsync(x=>x.Id==id,ct);if(x is null)return NotFound();if(!allowed.Contains(x.Status))return Conflict(new ProblemDetails{Status=409,Title="Invalid match transition"});x.Status=next;x.UpdatedAtUtc=DateTime.UtcNow;x.ConcurrencyToken=Guid.NewGuid();db.AuditEvents.Add(new(){ActorId=UserId,Action=$"match.{next.ToString().ToLowerInvariant()}",EntityType="ItemMatch",EntityId=x.Id});await db.SaveChangesAsync(ct);return NoContent();}
 IQueryable<ItemMatch> Owned()=>db.ItemMatches.Include(x=>x.LostItem).Include(x=>x.FoundItem).Where(x=>x.LostItem.OwnerId==UserId||x.FoundItem.OwnerId==UserId);
 async Task Notify(Guid itemId,CancellationToken ct){var matches=await db.ItemMatches.Include(x=>x.LostItem).Include(x=>x.FoundItem).Where(x=>(x.LostItemId==itemId||x.FoundItemId==itemId)&&x.Status==MatchStatus.Suggested&&x.NotifiedAtUtc==null).ToListAsync(ct);foreach(var x in matches){foreach(var uid in new[]{x.LostItem.OwnerId,x.FoundItem.OwnerId}.Distinct()){var enabled=await db.Users.AnyAsync(u=>u.Id==uid&&u.NotificationsEnabled&&u.InAppNotificationsEnabled,ct);if(enabled)db.Notifications.Add(new(){UserId=uid,Type="match.suggested",PayloadJson=JsonSerializer.Serialize(new{matchId=x.Id,score=x.MatchScore})});}x.NotifiedAtUtc=DateTime.UtcNow;x.NotificationVersion=x.EngineVersion;}await db.SaveChangesAsync(ct);}
}
