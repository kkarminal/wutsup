namespace Wutsup.Api.Models;

public record DayHours(string Day, string Hours);

public record HoursData(List<DayHours> WeekdayHours);
