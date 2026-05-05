using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public interface IDiscoveryService
{
    /// <summary>
    /// Returns a paginated list of discovery items for the given navigation node and all its descendants.
    /// </summary>
    /// <param name="nodeId">The navigation node ID to query items for.</param>
    /// <param name="page">The page number (1-based).</param>
    /// <param name="pageSize">The number of items per page.</param>
    /// <exception cref="KeyNotFoundException">Thrown when no node with the given nodeId exists.</exception>
    Task<DiscoveryPageResponse> GetItemsAsync(int nodeId, int page, int pageSize);
}
