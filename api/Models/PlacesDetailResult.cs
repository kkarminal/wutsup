namespace Wutsup.Api.Models;

public record PlacesDetailResult(
    double Rating,
    int ReviewCount,
    List<ReviewData> Reviews,
    HoursData? Hours,
    BusyTimesData? BusyTimes
);
