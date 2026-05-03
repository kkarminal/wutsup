using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Wutsup.Api.Data;
using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public UsersController(AppDbContext dbContext, IPasswordHasher passwordHasher, IJwtService jwtService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    /// <summary>
    /// Authenticates a user and returns a signed JWT on success.
    /// POST /api/users/login
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Return 400 if username or password is null/empty/whitespace
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        // Look up user by username (case-insensitive)
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower());

        // Return 401 with a generic message — do not distinguish between unknown user and wrong password
        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        var token = _jwtService.GenerateToken(user.Username, user.Role);
        return Ok(new LoginResponse { Token = token });
    }
}
