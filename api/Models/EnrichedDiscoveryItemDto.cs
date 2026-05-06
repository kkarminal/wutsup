namespace Wutsup.Api.Models;

public record EnrichedDiscoveryItemDto(
    int Id,
    string Name,
    string Description,
    double Latitude,
    double Longitude,
    string City,
    string? Address,
    string? ImageUrl,
    int NavigationNodeId,
    string CategoryLabel,
    object? Metadata,
    RatingData? Rating,
    HoursData? Hours,
    BusyTimesData? BusyTimes
);
