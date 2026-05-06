using Microsoft.AspNetCore.Mvc;

using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Controllers;

[ApiController]
[Route("api/navigation")]
public class NavigationController : ControllerBase
{
    private readonly INavigationService _navigationService;

    public NavigationController(INavigationService navigationService)
    {
        _navigationService = navigationService;
    }

    /// <summary>
    /// Returns the full navigation tree as a nested JSON structure.
    /// GET /api/navigation/tree
    /// </summary>
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var tree = await _navigationService.GetTreeAsync();
        return Ok(tree);
    }

    /// <summary>
    /// Creates a new navigation node.
    /// POST /api/navigation/nodes
    /// </summary>
    [HttpPost("nodes")]
    public async Task<IActionResult> CreateNode([FromBody] CreateNavigationNodeRequest request)
    {
        try
        {
            var node = await _navigationService.CreateNodeAsync(request);
            return StatusCode(StatusCodes.Status201Created, node);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing navigation node.
    /// PUT /api/navigation/nodes/{id}
    /// </summary>
    [HttpPut("nodes/{id:int}")]
    public async Task<IActionResult> UpdateNode(int id, [FromBody] UpdateNavigationNodeRequest request)
    {
        try
        {
            var node = await _navigationService.UpdateNodeAsync(id, request);
            return Ok(node);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Deletes a navigation node and all of its descendants.
    /// DELETE /api/navigation/nodes/{id}
    /// </summary>
    [HttpDelete("nodes/{id:int}")]
    public async Task<IActionResult> DeleteNode(int id)
    {
        try
        {
            await _navigationService.DeleteNodeAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
