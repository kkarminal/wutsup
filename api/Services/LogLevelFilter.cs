namespace Wutsup.Api.Services;

public class LogLevelFilter : ILogLevelFilter
{
    private static readonly HashSet<string> ProductionAllowedLevels = new(StringComparer.OrdinalIgnoreCase)
    {
        "warn",
        "error"
    };

    /// <inheritdoc />
    public bool ShouldLog(string level, string environment, bool verboseLoggingEnabled)
    {
        // Non-production environments: all levels pass
        if (!IsProduction(environment))
        {
            return true;
        }

        // Production with verbose flag enabled: all levels pass
        if (verboseLoggingEnabled)
        {
            return true;
        }

        // Production with verbose flag disabled: only warn and error pass
        return ProductionAllowedLevels.Contains(level);
    }

    private static bool IsProduction(string environment)
    {
        return string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase);
    }
}
