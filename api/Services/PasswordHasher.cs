namespace Wutsup.Api.Services;

public class PasswordHasher : IPasswordHasher
{
    /// <inheritdoc />
    public string Hash(string plaintext)
    {
        return BCrypt.Net.BCrypt.HashPassword(plaintext);
    }

    /// <inheritdoc />
    public bool Verify(string plaintext, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(plaintext, hash);
    }
}
