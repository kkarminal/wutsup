namespace Wutsup.Api.Models;

public class NavigationNode
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public int? ParentId { get; set; }
    public NavigationNode? Parent { get; set; }
    public ICollection<NavigationNode> Children { get; set; } = new List<NavigationNode>();
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
