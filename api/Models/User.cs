namespace Wutsup.Api.Models;

public class User
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;   // email address
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
