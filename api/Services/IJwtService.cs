namespace Wutsup.Api.Services;

public interface IJwtService
{
    /// <summary>
    /// Generates a signed JWT for the given username and role.
    /// </summary>
    string GenerateToken(string username, string role);
}
