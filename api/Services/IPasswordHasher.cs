namespace Wutsup.Api.Services;

public interface IPasswordHasher
{
    /// <summary>
    /// Hashes a plaintext password using a secure adaptive algorithm.
    /// </summary>
    string Hash(string plaintext);

    /// <summary>
    /// Verifies a plaintext password against a stored hash.
    /// </summary>
    bool Verify(string plaintext, string hash);
}
