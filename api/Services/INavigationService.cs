using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public interface INavigationService
{
    /// <summary>
    /// Returns the full navigation tree as a nested DTO starting from the root node.
    /// </summary>
    Task<NavigationNodeDto> GetTreeAsync();

    /// <summary>
    /// Creates a new navigation node and returns the created node as a DTO.
    /// </summary>
    /// <exception cref="ArgumentException">Thrown when the label is null or whitespace.</exception>
    /// <exception cref="KeyNotFoundException">Thrown when the specified parentId does not exist.</exception>
    Task<NavigationNodeDto> CreateNodeAsync(CreateNavigationNodeRequest request);

    /// <summary>
    /// Updates an existing navigation node and returns the updated node as a DTO.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Thrown when no node with the given id exists.</exception>
    Task<NavigationNodeDto> UpdateNodeAsync(int id, UpdateNavigationNodeRequest request);

    /// <summary>
    /// Deletes a navigation node and all of its descendants (cascade handled by the database FK).
    /// </summary>
    /// <exception cref="KeyNotFoundException">Thrown when no node with the given id exists.</exception>
    Task DeleteNodeAsync(int id);
}
