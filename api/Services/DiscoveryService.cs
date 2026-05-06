using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using Wutsup.Api.Data;
using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public class DiscoveryService : IDiscoveryService
{
    private readonly AppDbContext _dbContext;
    private readonly IRatingService _ratingService;
    private readonly ILogger<DiscoveryService> _logger;

    public DiscoveryService(AppDbContext dbContext, IRatingService ratingService, ILogger<DiscoveryService> logger)
    {
        _dbContext = dbContext;
        _ratingService = ratingService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<DiscoveryPageResponse> GetItemsAsync(int nodeId, int page, int pageSize)
    {
        // 1. Verify node exists
        var nodeExists = await _dbContext.NavigationNodes.AnyAsync(n => n.Id == nodeId);
        if (!nodeExists)
        {
            throw new KeyNotFoundException($"Navigation node with id {nodeId} not found.");
        }

        // 2. Resolve all descendant node IDs (including the queried node itself) via recursive CTE
        var descendantIds = await GetDescendantNodeIdsAsync(nodeId);

        // 3. Build query for discovery items in those nodes
        var query = _dbContext.DiscoveryItems
            .Where(di => descendantIds.Contains(di.NavigationNodeId))
            .Join(
                _dbContext.NavigationNodes,
                di => di.NavigationNodeId,
                nn => nn.Id,
                (di, nn) => new { Item = di, CategoryLabel = nn.Label }
            )
            .OrderByDescending(x => x.Item.CreatedAt);

        // 4. Get total count for pagination
        var totalCount = await query.CountAsync();

        // 5. Apply OFFSET/LIMIT pagination
        var offset = (page - 1) * pageSize;
        var results = await query
            .Skip(offset)
            .Take(pageSize)
            .ToListAsync();

        // 6. Map to DTOs
        var items = results.Select(r => new DiscoveryItemDto(
            r.Item.Id,
            r.Item.Name,
            r.Item.Description,
            r.Item.Latitude,
            r.Item.Longitude,
            r.Item.City,
            r.Item.Address,
            r.Item.ImageUrl,
            r.Item.NavigationNodeId,
            r.CategoryLabel,
            DeserializeMetadata(r.Item.Metadata)
        )).ToList();

        // 7. Enrich items with rating data (graceful degradation on failure)
        List<EnrichedDiscoveryItemDto> enrichedItems;
        try
        {
            enrichedItems = await _ratingService.EnrichItemsAsync(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rating enrichment failed entirely. Returning items without rating data.");
            enrichedItems = items.Select(item => new EnrichedDiscoveryItemDto(
                item.Id,
                item.Name,
                item.Description,
                item.Latitude,
                item.Longitude,
                item.City,
                item.Address,
                item.ImageUrl,
                item.NavigationNodeId,
                item.CategoryLabel,
                item.Metadata,
                null,
                null,
                null
            )).ToList();
        }

        // 8. Return paginated response
        return new DiscoveryPageResponse(enrichedItems, totalCount, page, pageSize);
    }

    private async Task<List<int>> GetDescendantNodeIdsAsync(int nodeId)
    {
        var sql = @"
            WITH RECURSIVE descendants AS (
                SELECT id FROM navigation_nodes WHERE id = {0}
                UNION ALL
                SELECT n.id FROM navigation_nodes n
                INNER JOIN descendants d ON n.parent_id = d.id
            )
            SELECT id FROM descendants";

        return await _dbContext.Database
            .SqlQueryRaw<int>(sql, nodeId)
            .ToListAsync();
    }

    private static object? DeserializeMetadata(string? metadata)
    {
        if (string.IsNullOrEmpty(metadata))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(metadata);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
