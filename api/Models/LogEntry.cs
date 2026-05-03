namespace Wutsup.Api.Models;

public class LogEntry
{
    public long Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public Guid? CorrelationId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
