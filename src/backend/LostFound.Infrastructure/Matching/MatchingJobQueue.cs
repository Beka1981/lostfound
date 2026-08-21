using LostFound.Application.Abstractions;
using LostFound.Domain.Entities;
using LostFound.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LostFound.Infrastructure.Matching;

public sealed class MatchingJobOptions { public int PollSeconds { get; set; }=5; public int BatchSize { get; set; }=5; public int MaxAttempts { get; set; }=5; public int AbandonedAfterMinutes { get; set; }=10; }

public sealed class PostgresMatchingJobQueue(LostFoundDbContext db,IOptions<MatchingOptions> matching) : IMatchingJobQueue {
 public async Task EnqueueAsync(Guid itemId,CancellationToken ct){
  var job=await db.MatchingJobs.SingleOrDefaultAsync(x=>x.ItemId==itemId,ct);
  if(job is null)db.MatchingJobs.Add(new(){ItemId=itemId,EngineVersion=matching.Value.EngineVersion});
  else { job.Status=MatchingJobStatus.Pending;job.AttemptCount=0;job.NextAttemptAtUtc=DateTime.UtcNow;job.LockedAtUtc=null;job.LastErrorCode=null;job.EngineVersion=matching.Value.EngineVersion;job.UpdatedAtUtc=DateTime.UtcNow;job.ConcurrencyToken=Guid.NewGuid(); }
  await db.SaveChangesAsync(ct);
 }
}

public sealed class MatchingJobWorker(IServiceScopeFactory scopes,IOptions<MatchingJobOptions> options,ILogger<MatchingJobWorker> logger) : BackgroundService {
 readonly MatchingJobOptions policy=options.Value;
 protected override async Task ExecuteAsync(CancellationToken stoppingToken){
  logger.LogInformation("Matching worker started with batch size {BatchSize}",policy.BatchSize);
  while(!stoppingToken.IsCancellationRequested){var processed=0;for(var i=0;i<Math.Clamp(policy.BatchSize,1,25)&&!stoppingToken.IsCancellationRequested;i++){var job=await Claim(stoppingToken);if(job is null)break;processed++;await Process(job.Value.Id,job.Value.ItemId,stoppingToken);}if(processed==0)await Task.Delay(TimeSpan.FromSeconds(Math.Clamp(policy.PollSeconds,1,60)),stoppingToken);}
 }
 async Task<(Guid Id,Guid ItemId)?> Claim(CancellationToken ct){await using var scope=scopes.CreateAsyncScope();var db=scope.ServiceProvider.GetRequiredService<LostFoundDbContext>();await using var tx=await db.Database.BeginTransactionAsync(ct);var abandoned=DateTime.UtcNow.AddMinutes(-Math.Clamp(policy.AbandonedAfterMinutes,1,120));var job=await db.MatchingJobs.FromSqlInterpolated($"SELECT * FROM \"MatchingJobs\" WHERE (\"Status\" = {(int)MatchingJobStatus.Pending} AND \"NextAttemptAtUtc\" <= {DateTime.UtcNow}) OR (\"Status\" = {(int)MatchingJobStatus.Processing} AND \"LockedAtUtc\" < {abandoned}) ORDER BY \"NextAttemptAtUtc\" LIMIT 1 FOR UPDATE SKIP LOCKED").SingleOrDefaultAsync(ct);if(job is null){await tx.CommitAsync(ct);return null;}job.Status=MatchingJobStatus.Processing;job.LockedAtUtc=DateTime.UtcNow;job.AttemptCount++;job.UpdatedAtUtc=DateTime.UtcNow;job.ConcurrencyToken=Guid.NewGuid();await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return(job.Id,job.ItemId);}
 async Task Process(Guid jobId,Guid itemId,CancellationToken ct){try{await using var scope=scopes.CreateAsyncScope();var matcher=scope.ServiceProvider.GetRequiredService<IItemMatchingService>();await matcher.FindMatchesAsync(itemId,ct);var db=scope.ServiceProvider.GetRequiredService<LostFoundDbContext>();var job=await db.MatchingJobs.SingleAsync(x=>x.Id==jobId,ct);job.Status=MatchingJobStatus.Completed;job.LockedAtUtc=null;job.LastErrorCode=null;job.UpdatedAtUtc=DateTime.UtcNow;job.ConcurrencyToken=Guid.NewGuid();await db.SaveChangesAsync(ct);logger.LogInformation("Matching job {JobId} completed for Item {ItemId}",jobId,itemId);}catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}catch(Exception ex){await using var scope=scopes.CreateAsyncScope();var db=scope.ServiceProvider.GetRequiredService<LostFoundDbContext>();var job=await db.MatchingJobs.SingleOrDefaultAsync(x=>x.Id==jobId,CancellationToken.None);if(job is null)return;job.LockedAtUtc=null;job.LastErrorCode="matching_failed";job.Status=job.AttemptCount>=Math.Clamp(policy.MaxAttempts,1,20)?MatchingJobStatus.Failed:MatchingJobStatus.Pending;job.NextAttemptAtUtc=DateTime.UtcNow.AddSeconds(Math.Min(900,Math.Pow(2,job.AttemptCount)*5));job.UpdatedAtUtc=DateTime.UtcNow;job.ConcurrencyToken=Guid.NewGuid();await db.SaveChangesAsync(CancellationToken.None);logger.LogWarning(ex,"Matching job {JobId} failed on attempt {AttemptCount}",jobId,job.AttemptCount);}}
}
