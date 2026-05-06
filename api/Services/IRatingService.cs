using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public interface IRatingService
{
    /// <summary>
    /// Returns rating data for a discovery item, using cache when available.
    /// Returns null if rating data cannot be obtained.
    /// </summary>
    Task<RatingData?> GetRatingForItemAsync(int discoveryItemId, string name, double latitude, double longitude, CancellationToken ct = default);

    /// <summary>
    /// Enriches a list of discovery item DTOs with rating data.
    /// Items that cannot be enriched retain null rating fields.
    /// </summary>
    Task<List<EnrichedDiscoveryItemDto>> EnrichItemsAsync(List<DiscoveryItemDto> items, CancellationToken ct = default);
}
