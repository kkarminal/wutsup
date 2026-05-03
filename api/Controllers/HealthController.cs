using Microsoft.AspNetCore.Mvc;

namespace Wutsup.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet("/health")]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "healthy" });
    }
}
