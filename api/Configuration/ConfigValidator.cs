using Microsoft.Extensions.Configuration;

namespace Wutsup.Api.Configuration;

public class ConfigValidator : IConfigValidator
{
    private static readonly string[] RequiredKeys =
    [
        "ConnectionStrings:DefaultConnection",
        "App:Environment",
        "App:LogLevel",
        "GrowthBook:ApiHost",
        "GrowthBook:ClientKey",
        "Jwt:Secret",
        "Jwt:ExpiryMinutes"
    ];

    /// <inheritdoc />
    public IReadOnlyList<string> Validate(IConfiguration configuration, string environment)
    {
        var missingKeys = new List<string>();

        foreach (var key in RequiredKeys)
        {
            if (!configuration.GetSection(key).Exists())
            {
                missingKeys.Add(key);
            }
        }

        return missingKeys.AsReadOnly();
    }
}
