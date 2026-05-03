namespace Wutsup.Api.Services;

public interface ILoggingService
{
    /// <summary>
    /// Logs a structured entry to the database. Falls back to console logging
    /// if the database is unreachable.
    /// </summary>
    /// <param name="level">The log level: "debug", "info", "warn", or "error".</param>
    /// <param name="message">The log message.</param>
    /// <param name="source">The source component or module name.</param>
    /// <param name="correlationId">An optional correlation identifier for tracing related entries.</param>
    Task LogAsync(string level, string message, string source, Guid? correlationId = null);
}
