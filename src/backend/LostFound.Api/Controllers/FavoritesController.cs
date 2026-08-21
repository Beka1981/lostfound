using System.Security.Claims;
using Asp.Versioning;
using LostFound.Domain.Entities;
using LostFound.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace LostFound.Api.Controllers;
[Authorize,ApiController,ApiVersion(1),Route("api/v{version:apiVersion}/favorites")]
public sealed class FavoritesController(LostFoundDbContext db):ControllerBase { private Guid UserId=>Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!); [HttpPost("{itemId:guid}")] public async Task<IActionResult> Add(Guid itemId,CancellationToken ct){if(!await db.Items.AnyAsync(x=>x.Id==itemId,ct))return NotFound();if(!await db.Favorites.AnyAsync(x=>x.UserId==UserId&&x.ItemId==itemId,ct)){db.Favorites.Add(new Favorite{UserId=UserId,ItemId=itemId});await db.SaveChangesAsync(ct);}return NoContent();} [HttpDelete("{itemId:guid}")] public async Task<IActionResult> Remove(Guid itemId,CancellationToken ct){var row=await db.Favorites.FirstOrDefaultAsync(x=>x.UserId==UserId&&x.ItemId==itemId,ct);if(row is not null){db.Remove(row);await db.SaveChangesAsync(ct);}return NoContent();} [HttpGet] public async Task<ActionResult<IReadOnlyList<Guid>>> Get(CancellationToken ct)=>Ok(await db.Favorites.Where(x=>x.UserId==UserId).OrderByDescending(x=>x.CreatedAtUtc).Select(x=>x.ItemId).ToListAsync(ct)); }
