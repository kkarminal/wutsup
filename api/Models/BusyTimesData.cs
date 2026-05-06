namespace Wutsup.Api.Models;

public record HourPopularity(int Hour, int PopularityPercent);

public record BusyTimesData(List<HourPopularity> HourlyPopularity);
