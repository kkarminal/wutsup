using System.Text.Json;

using Microsoft.EntityFrameworkCore;

using Wutsup.Api.Data;
using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public class RatingCacheStore : IRatingCacheStore
{
    private readonly AppDbContext _dbContext;

    public RatingCacheStore(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RatingCacheEntry?> GetAsync(int discoveryItemId, CancellationToken ct = default)
    {
        var entry = await _dbContext.RatingCacheEntries
            .FirstOrDefaultAsync(e => e.DiscoveryItemId == discoveryItemId, ct);

        if (entry is null)
            return null;

        if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
            return null;

        return entry;
    }

    public async Task SetAsync(int discoveryItemId, RatingData data, TimeSpan ttl, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(data);
        var now = DateTimeOffset.UtcNow;

        var existing = await _dbContext.RatingCacheEntries
            .FirstOrDefaultAsync(e => e.DiscoveryItemId == discoveryItemId, ct);

        if (existing is not null)
        {
            existing.RatingDataJson = json;
            existing.CachedAt = now;
            existing.ExpiresAt = now.Add(ttl);
        }
        else
        {
            var entry = new RatingCacheEntry
            {
                DiscoveryItemId = discoveryItemId,
                RatingDataJson = json,
                CachedAt = now,
                ExpiresAt = now.Add(ttl)
            };
            _dbContext.RatingCacheEntries.Add(entry);
        }

        await _dbContext.SaveChangesAsync(ct);
    }
}
