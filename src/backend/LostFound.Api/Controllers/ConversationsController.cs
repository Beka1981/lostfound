using System.Security.Claims;
using Asp.Versioning;
using FluentValidation;
using LostFound.Api.Hubs;
using LostFound.Application.Abstractions;
using LostFound.Application.Contracts;
using LostFound.Domain.Entities;
using LostFound.Infrastructure.Identity;
using LostFound.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
namespace LostFound.Api.Controllers;

[Authorize, ApiController, ApiVersion(1), Route("api/v{version:apiVersion}/conversations")]
public sealed class ConversationsController(LostFoundDbContext db, IValidator<SendMessageRequest> validator, IHubContext<CommunicationHub> hub, ITextModerationService moderation) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!); private static string Name(ApplicationUser u) => u.AccountType == AccountType.Person ? $"{u.FirstName} {u.LastName}".Trim() : u.OrganizationName ?? "User";
    [HttpPost]
    public async Task<ActionResult<ConversationResponse>> Create(Guid itemId, CancellationToken ct)
    {
        var uid = UserId;
        var item = await db.Items.IgnoreQueryFilters().AsNoTracking().SingleOrDefaultAsync(x => x.Id == itemId, ct);
        if (item is null || item.IsDeleted) return NotFound();
        var recipientId = item.OwnerId;
        if (uid == recipientId) return BadRequest(new ProblemDetails { Title = "Cannot message yourself", Status = 400 });
        if (await DirectInteractionBlocked(uid, recipientId, itemId, ct)) return Conflict(new ProblemDetails { Title = "Direct interaction is unavailable", Status = 409 });
        if (!await db.Users.AnyAsync(x => x.Id == recipientId && !x.IsSuspended && !x.IsPermanentlyBlocked, ct)) return NotFound();
        var ids = new[] { uid, recipientId }.Order().ToArray();
        var key = $"{itemId:N}:{ids[0]:N}:{ids[1]:N}";
        var existing = await db.Conversations.SingleOrDefaultAsync(x => x.DirectKey == key, ct);
        if (existing is null)
        {
            existing = new Conversation { ItemId = itemId, DirectKey = key, Participants = [new() { UserId = uid }, new() { UserId = recipientId }] };
            db.Add(existing);
            await db.SaveChangesAsync(ct);
        }
        return Ok(await GetOne(existing.Id, ct));
    }
    [HttpGet] public async Task<ActionResult<IReadOnlyList<ConversationResponse>>> List(CancellationToken ct) { var ids = await db.ConversationParticipants.Where(x => x.UserId == UserId).Select(x => x.ConversationId).ToListAsync(ct); var result = new List<ConversationResponse>(); foreach (var id in ids) result.Add(await GetOne(id, ct)); return Ok(result.OrderByDescending(x => x.LastMessageAtUtc)); }
    [HttpGet("{id:guid}")] public async Task<ActionResult<ConversationResponse>> Get(Guid id, CancellationToken ct) { if (!await Member(id, ct)) return Forbid(); return Ok(await GetOne(id, ct)); }
    [HttpGet("{id:guid}/messages")] public async Task<ActionResult<PagedResponse<MessageResponse>>> Messages(Guid id, int page = 1, int pageSize = 50, CancellationToken ct = default) { if (!await Member(id, ct)) return Forbid(); page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100); var q = db.Messages.AsNoTracking().Where(x => x.ConversationId == id && !x.IsDeleted).OrderByDescending(x => x.CreatedAtUtc); var total = await q.CountAsync(ct); var rows = await q.Skip((page - 1) * pageSize).Take(pageSize).Join(db.Users, x => x.SenderId, u => u.Id, (x, u) => new MessageResponse(x.Id, x.ConversationId, x.SenderId, Name(u), x.Body, x.CreatedAtUtc)).ToListAsync(ct); return Ok(new PagedResponse<MessageResponse>(rows, page, pageSize, total)); }
    [HttpPost("{id:guid}/messages")] public async Task<ActionResult<MessageResponse>> Send(Guid id, SendMessageRequest r, CancellationToken ct) { if (!await Member(id, ct)) return Forbid(); var vr = await validator.ValidateAsync(r, ct); if (!vr.IsValid) return BadRequest(new ValidationProblemDetails(vr.ToDictionary())); var context = await db.Conversations.Where(x => x.Id == id).Select(x => new { x.ItemId, Recipients = x.Participants.Where(p => p.UserId != UserId).Select(p => p.UserId).ToList() }).SingleAsync(ct); if (context.Recipients.Any() && await DirectInteractionBlocked(UserId, context.Recipients[0], context.ItemId, ct)) return Conflict(new ProblemDetails { Title = "Direct interaction is unavailable", Status = 409 }); var check = await moderation.CheckAsync(r.Body, ct); if (!check.IsAllowed) return UnprocessableEntity(new ProblemDetails { Title = "Message cannot be sent", Status = 422 }); var sender = await db.Users.SingleAsync(x => x.Id == UserId, ct); var message = new Message { ConversationId = id, SenderId = UserId, Body = r.Body.Trim() }; db.Messages.Add(message); foreach (var recipient in context.Recipients) { var settings = await db.Users.AsNoTracking().SingleAsync(x => x.Id == recipient, ct); if (settings.NotificationsEnabled && settings.InAppNotificationsEnabled) db.Notifications.Add(new Notification { UserId = recipient, Type = "message.received", PayloadJson = $"{{\"conversationId\":\"{id}\"}}" }); } await db.SaveChangesAsync(ct); var dto = new MessageResponse(message.Id, id, UserId, Name(sender), message.Body, message.CreatedAtUtc); await hub.Clients.Group($"conversation:{id}").SendAsync("messageReceived", dto, ct); foreach (var recipient in context.Recipients) await hub.Clients.Group($"user:{recipient}").SendAsync("notificationReceived", new { type = "message.received" }, ct); return Ok(dto); }
    [HttpPost("{id:guid}/read")] public async Task<IActionResult> Read(Guid id, CancellationToken ct) { var p = await db.ConversationParticipants.SingleOrDefaultAsync(x => x.ConversationId == id && x.UserId == UserId, ct); if (p is null) return Forbid(); p.LastReadAtUtc = DateTime.UtcNow; await db.SaveChangesAsync(ct); return NoContent(); }
    private Task<bool> Member(Guid id, CancellationToken ct) => db.ConversationParticipants.AnyAsync(x => x.ConversationId == id && x.UserId == UserId, ct);
    private async Task<bool> DirectInteractionBlocked(Guid a, Guid b, Guid? itemId, CancellationToken ct) { if (!await db.UserBlocks.AnyAsync(x => (x.BlockerId == a && x.BlockedId == b) || (x.BlockerId == b && x.BlockedId == a), ct)) return false; if (!itemId.HasValue) return true; return !await db.Claims.IgnoreQueryFilters().AnyAsync(x => x.ItemId == itemId && (x.Status == ClaimStatus.Pending || x.Status == ClaimStatus.UnderReview || x.Status == ClaimStatus.Accepted) && (x.ClaimantId == a && x.Item.OwnerId == b || x.ClaimantId == b && x.Item.OwnerId == a), ct); }
    private async Task<ConversationResponse> GetOne(Guid id, CancellationToken ct) { var c = await db.Conversations.AsNoTracking().Include(x => x.Item).SingleAsync(x => x.Id == id, ct); var participants = await db.ConversationParticipants.Where(x => x.ConversationId == id).Join(db.Users, x => x.UserId, u => u.Id, (x, u) => new ParticipantResponse(u.Id, Name(u), u.ProfilePhotoKey == null ? null : $"/uploads/{u.ProfilePhotoKey}")).ToListAsync(ct); var last = await db.Messages.Where(x => x.ConversationId == id && !x.IsDeleted).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(ct); var read = await db.ConversationParticipants.Where(x => x.ConversationId == id && x.UserId == UserId).Select(x => x.LastReadAtUtc).SingleAsync(ct); var unread = await db.Messages.CountAsync(x => x.ConversationId == id && x.SenderId != UserId && (read == null || x.CreatedAtUtc > read), ct); return new(c.Id, c.ItemId, c.Item == null ? null : c.Item.Title, participants, last?.Body, last?.CreatedAtUtc, unread); }
}
