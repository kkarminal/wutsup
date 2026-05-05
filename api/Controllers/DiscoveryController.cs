using Microsoft.AspNetCore.Mvc;

using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Controllers;

[ApiController]
[Route("api/discovery")]
public class DiscoveryController : ControllerBase
{
    private readonly IDiscoveryService _discoveryService;

    public DiscoveryController(IDiscoveryService discoveryService)
    {
        _discoveryService = discoveryService;
    }

    /// <summary>
    /// Returns paginated discovery items for a given navigation node and all its descendants.
    /// GET /api/discovery/items?nodeId=6&amp;page=1&amp;pageSize=20
    /// </summary>
    [HttpGet("items")]
    public async Task<IActionResult> GetItems(
        [FromQuery] int nodeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (nodeId <= 0)
        {
            return BadRequest(new { message = "nodeId is required." });
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        try
        {
            var response = await _discoveryService.GetItemsAsync(nodeId, page, pageSize);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
