using System.ComponentModel.DataAnnotations;

namespace Wutsup.Api.Models;

public class CreateLogEntryRequest
{
    public string? Timestamp { get; set; }

    [Required(AllowEmptyStrings = false)]
    public string Level { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string Source { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string Message { get; set; } = string.Empty;
}
