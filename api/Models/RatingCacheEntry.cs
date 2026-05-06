namespace Wutsup.Api.Models;

public class RatingCacheEntry
{
    public int Id { get; set; }
    public int DiscoveryItemId { get; set; }
    public string RatingDataJson { get; set; } = string.Empty;
    public DateTimeOffset CachedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}
