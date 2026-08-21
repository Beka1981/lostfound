using Asp.Versioning;
using LostFound.Application.Contracts;
using LostFound.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LostFound.Api.Controllers;
[ApiController, ApiVersion(1), Route("api/v{version:apiVersion}/categories")]
public sealed class CategoriesController(LostFoundDbContext db) : ControllerBase
{
 [HttpGet, ProducesResponseType<IReadOnlyList<CategoryResponse>>(200)]
 public async Task<ActionResult<IReadOnlyList<CategoryResponse>>> Get(CancellationToken ct) => Ok(await db.Categories.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.SortOrder).Select(x=>new CategoryResponse(x.Id,x.Slug,x.NameKey,x.Subcategories.Where(s=>s.IsActive).OrderBy(s=>s.NameKey).Select(s=>new SubcategoryResponse(s.Id,s.Slug,s.NameKey)).ToList())).ToListAsync(ct));
}
