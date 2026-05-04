namespace Wutsup.Api.Models;

public record CreateNavigationNodeRequest(
    string Label,
    string? Icon,
    int? ParentId,
    int SortOrder = 0
);
