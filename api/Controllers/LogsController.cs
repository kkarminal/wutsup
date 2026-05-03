using Microsoft.AspNetCore.Mvc;

using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private static readonly HashSet<string> ValidLogLevels = new(StringComparer.OrdinalIgnoreCase)
    {
        "debug",
        "info",
        "warn",
        "error"
    };

    private readonly ILoggingService _loggingService;

    public LogsController(ILoggingService loggingService)
    {
        _loggingService = loggingService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateLogEntry([FromBody] CreateLogEntryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Source) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Source and message must not be empty.");
        }

        if (!ValidLogLevels.Contains(request.Level))
        {
            return BadRequest($"Level must be one of: debug, info, warn, error. Received: '{request.Level}'.");
        }

        await _loggingService.LogAsync(
            request.Level.ToLowerInvariant(),
            request.Message,
            request.Source);

        return StatusCode(StatusCodes.Status201Created);
    }
}
