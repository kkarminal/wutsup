namespace Wutsup.Api.Models;

public record UpdateNavigationNodeRequest(
    string? Label,
    string? Icon,
    int? SortOrder
);
