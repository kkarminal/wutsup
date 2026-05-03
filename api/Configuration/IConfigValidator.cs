using Microsoft.Extensions.Configuration;

namespace Wutsup.Api.Configuration;

public interface IConfigValidator
{
    /// <summary>
    /// Returns list of missing config key names. Empty list = valid.
    /// </summary>
    IReadOnlyList<string> Validate(IConfiguration configuration, string environment);
}
