using Microsoft.EntityFrameworkCore;

using Wutsup.Api.Data;
using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public class NavigationService : INavigationService
{
    private readonly AppDbContext _dbContext;

    public NavigationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<NavigationNodeDto> GetTreeAsync()
    {
        var allNodes = await _dbContext.NavigationNodes
            .OrderBy(n => n.SortOrder)
            .ToListAsync();

        // Build a lookup dictionary keyed by parent_id for O(n) tree assembly.
        var byParent = new Dictionary<int, List<NavigationNode>>();
        const int rootKey = -1; // sentinel for null parent_id

        foreach (var node in allNodes)
        {
            var key = node.ParentId ?? rootKey;
            if (!byParent.TryGetValue(key, out var siblings))
            {
                siblings = new List<NavigationNode>();
                byParent[key] = siblings;
            }

            siblings.Add(node);
        }

        // The root is the single node with no parent.
        var roots = byParent.GetValueOrDefault(rootKey) ?? new List<NavigationNode>();
        var root = roots.FirstOrDefault()
            ?? throw new InvalidOperationException("Navigation tree has no root node.");

        return BuildDto(root, byParent, rootKey);
    }

    /// <inheritdoc />
    public async Task<NavigationNodeDto> CreateNodeAsync(CreateNavigationNodeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Label))
        {
            throw new ArgumentException("Label is required.", nameof(request));
        }

        if (request.ParentId.HasValue)
        {
            var parentExists = await _dbContext.NavigationNodes
                .AnyAsync(n => n.Id == request.ParentId.Value);

            if (!parentExists)
            {
                throw new KeyNotFoundException($"Parent node with id {request.ParentId.Value} not found.");
            }
        }

        var node = new NavigationNode
        {
            Label = request.Label,
            Icon = request.Icon,
            ParentId = request.ParentId,
            SortOrder = request.SortOrder,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.NavigationNodes.Add(node);
        await _dbContext.SaveChangesAsync();

        return ToDto(node, new List<NavigationNodeDto>());
    }

    /// <inheritdoc />
    public async Task<NavigationNodeDto> UpdateNodeAsync(int id, UpdateNavigationNodeRequest request)
    {
        var node = await _dbContext.NavigationNodes.FindAsync(id)
            ?? throw new KeyNotFoundException($"Node with id {id} not found.");

        if (request.Label != null)
        {
            node.Label = request.Label;
        }

        if (request.Icon != null)
        {
            node.Icon = request.Icon;
        }

        if (request.SortOrder.HasValue)
        {
            node.SortOrder = request.SortOrder.Value;
        }

        node.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Return the DTO without children — callers can call GetTreeAsync for the full tree.
        return ToDto(node, new List<NavigationNodeDto>());
    }

    /// <inheritdoc />
    public async Task DeleteNodeAsync(int id)
    {
        var node = await _dbContext.NavigationNodes.FindAsync(id)
            ?? throw new KeyNotFoundException($"Node with id {id} not found.");

        _dbContext.NavigationNodes.Remove(node);
        await _dbContext.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static NavigationNodeDto BuildDto(
        NavigationNode node,
        Dictionary<int, List<NavigationNode>> byParent,
        int rootKey)
    {
        var childNodes = byParent.GetValueOrDefault(node.Id) ?? new List<NavigationNode>();
        var childDtos = childNodes
            .Select(child => BuildDto(child, byParent, rootKey))
            .ToList();

        return ToDto(node, childDtos);
    }

    private static NavigationNodeDto ToDto(NavigationNode node, List<NavigationNodeDto> children)
    {
        return new NavigationNodeDto(
            node.Id,
            node.Label,
            node.Icon,
            node.ParentId,
            node.SortOrder,
            children);
    }
}
