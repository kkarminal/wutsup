namespace Wutsup.Api.Services;

public interface ILogLevelFilter
{
    /// <summary>
    /// Determines whether a log entry at the given level should be persisted
    /// based on the current environment and verbose logging flag state.
    /// </summary>
    /// <param name="level">The log level: "debug", "info", "warn", or "error".</param>
    /// <param name="environment">The current environment name (e.g., "Local", "QA", "Staging", "Production").</param>
    /// <param name="verboseLoggingEnabled">Whether the GrowthBook verbose logging flag is enabled.</param>
    /// <returns>True if the log entry should be persisted; false otherwise.</returns>
    bool ShouldLog(string level, string environment, bool verboseLoggingEnabled);
}
