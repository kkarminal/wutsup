using Microsoft.EntityFrameworkCore;

using Wutsup.Api.Data;
using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public class LoggingService : ILoggingService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogLevelFilter _logLevelFilter;
    private readonly string _environment;
    private readonly bool _verboseLoggingEnabled;

    public LoggingService(
        AppDbContext dbContext,
        ILogLevelFilter logLevelFilter,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _logLevelFilter = logLevelFilter;
        _environment = configuration["App:Environment"] ?? "Local";
        _verboseLoggingEnabled = configuration.GetValue<bool>("GrowthBook:VerboseLogging", false);
    }

    /// <inheritdoc />
    public async Task LogAsync(string level, string message, string source, Guid? correlationId = null)
    {
        if (!_logLevelFilter.ShouldLog(level, _environment, _verboseLoggingEnabled))
        {
            return;
        }

        var entry = new LogEntry
        {
            Timestamp = DateTimeOffset.UtcNow,
            Level = level,
            Message = message,
            Source = source,
            CorrelationId = correlationId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        try
        {
            _dbContext.Logs.Add(entry);
            await _dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync(
                $"[LoggingService] Failed to write log to database. Falling back to console. Error: {ex.Message}");
            await Console.Error.WriteLineAsync(
                $"[{entry.Timestamp:O}] [{entry.Level}] [{entry.Source}] {entry.Message} (CorrelationId: {entry.CorrelationId})");
        }
    }
}
