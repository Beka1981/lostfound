using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Asp.Versioning;
using FluentValidation;
using LostFound.Application.Contracts;
using LostFound.Infrastructure.Identity;
using LostFound.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using LostFound.Domain.Entities;
namespace LostFound.Api.Controllers;

[ApiController, ApiVersion(1), Route("api/v{version:apiVersion}/auth")]
public sealed class AuthController(UserManager<ApplicationUser> users, LostFoundDbContext db, IConfiguration config, IValidator<RegisterRequest> registerValidator) : ControllerBase
{
    [HttpPost("register"), EnableRateLimiting("auth")] public async Task<ActionResult<AuthResponse>> Register(RegisterRequest r, CancellationToken ct) { r = r with { Email = r.Email?.Trim() ?? string.Empty, FirstName = r.FirstName?.Trim(), LastName = r.LastName?.Trim(), OrganizationName = r.OrganizationName?.Trim(), ResponsiblePerson = r.ResponsiblePerson?.Trim(), PhoneNumber = r.PhoneNumber?.Trim() }; var validation = await registerValidator.ValidateAsync(r, ct); if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary())); var email = r.Email; var u = new ApplicationUser { UserName = email, Email = email, AccountType = r.AccountType, FirstName = r.AccountType == AccountType.Person ? r.FirstName : null, LastName = r.AccountType == AccountType.Person ? r.LastName : null, OrganizationName = r.AccountType == AccountType.Organization ? r.OrganizationName : null, ResponsiblePerson = r.AccountType == AccountType.Organization ? r.ResponsiblePerson : null, PhoneNumber = r.PhoneNumber }; var result = await users.CreateAsync(u, r.Password); if (!result.Succeeded) { var duplicate = result.Errors.Any(x => x.Code is "DuplicateEmail" or "DuplicateUserName"); var key = duplicate ? "email" : "account"; var message = duplicate ? "Unable to register with this email." : "Registration could not be completed."; return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { { key, [message] } })); } return Ok(await Token(u, ct)); }
    [HttpPost("login"), EnableRateLimiting("auth")] public async Task<ActionResult<AuthResponse>> Login(LoginRequest r) { var u = await users.FindByEmailAsync(r.Email); if (u is null || u.IsSuspended || !await users.CheckPasswordAsync(u, r.Password)) return Unauthorized(new ProblemDetails { Title = "Invalid credentials", Status = 401 }); return Ok(await Token(u)); }
    [HttpPost("refresh"), EnableRateLimiting("auth")] public async Task<ActionResult<AuthResponse>> Refresh(RefreshAccessTokenRequest request, CancellationToken ct) { if (string.IsNullOrWhiteSpace(request.RefreshToken)) return Unauthorized(); var hash = Hash(request.RefreshToken); var existing = await db.RefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == hash, ct); if (existing is null || existing.RevokedAtUtc.HasValue || existing.ExpiresAtUtc <= DateTime.UtcNow) return Unauthorized(new ProblemDetails { Title = "Invalid refresh token", Status = 401 }); var user = await users.FindByIdAsync(existing.UserId.ToString()); if (user is null || user.IsSuspended || user.IsPermanentlyBlocked) return Forbid(); existing.RevokedAtUtc = DateTime.UtcNow; var response = await Token(user, ct); existing.ReplacedByTokenId = await db.RefreshTokens.Where(x => x.UserId == user.Id && x.TokenHash == Hash(response.RefreshToken)).Select(x => (Guid?)x.Id).SingleAsync(ct); await db.SaveChangesAsync(ct); return Ok(response); }
    private async Task<AuthResponse> Token(ApplicationUser u, CancellationToken ct = default) { var expires = DateTime.UtcNow.AddMinutes(config.GetValue("Jwt:AccessTokenMinutes", 15)); var key = config["Jwt:SigningKey"]!; var claims = new List<System.Security.Claims.Claim> { new(JwtRegisteredClaimNames.Sub, u.Id.ToString()), new(JwtRegisteredClaimNames.Email, u.Email ?? ""), new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) }; claims.AddRange((await users.GetRolesAsync(u)).Select(role => new System.Security.Claims.Claim(ClaimTypes.Role, role))); var jwt = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims, expires: expires, signingCredentials: new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256)); var plain = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)); db.RefreshTokens.Add(new() { UserId = u.Id, TokenHash = Hash(plain), ExpiresAtUtc = DateTime.UtcNow.AddDays(config.GetValue("Jwt:RefreshTokenDays", 30)) }); await db.SaveChangesAsync(ct); return new(new JwtSecurityTokenHandler().WriteToken(jwt), expires, plain); }
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
