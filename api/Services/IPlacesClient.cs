using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public interface IPlacesClient
{
    /// <summary>
    /// Resolves a place ID and fetches rating data for a discovery item.
    /// Returns null if no matching place is found.
    /// </summary>
    Task<PlacesDetailResult?> GetRatingAsync(string name, double latitude, double longitude, CancellationToken ct = default);
}
