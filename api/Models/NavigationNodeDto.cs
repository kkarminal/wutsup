namespace Wutsup.Api.Models;

public record NavigationNodeDto(
    int Id,
    string Label,
    string? Icon,
    string? BackgroundImageUrl,
    int? ParentId,
    int SortOrder,
    List<NavigationNodeDto> Children
);
