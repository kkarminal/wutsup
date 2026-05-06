using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public interface IRatingCacheStore
{
    Task<RatingCacheEntry?> GetAsync(int discoveryItemId, CancellationToken ct = default);
    Task SetAsync(int discoveryItemId, RatingData data, TimeSpan ttl, CancellationToken ct = default);
}
