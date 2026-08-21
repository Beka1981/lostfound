using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler { public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken) { logger.LogError(exception, "Unhandled request failure"); context.Response.StatusCode = 500; await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = 500, Title = "An unexpected error occurred", Type = "https://httpstatuses.com/500" }, cancellationToken); return true; } }
