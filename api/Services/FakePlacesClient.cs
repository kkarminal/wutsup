using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

/// <summary>
/// A fake IPlacesClient for local development that returns random ratings and reviews
/// without calling the real Google Places API. Used when GooglePlaces:ApiKey is empty
/// or set to a placeholder value.
/// </summary>
public class FakePlacesClient : IPlacesClient
{
    private static readonly string[] FakeAuthors =
    [
        "Alex M.", "Jordan K.", "Sam T.", "Casey R.", "Morgan L.",
        "Riley P.", "Quinn D.", "Avery S.", "Taylor W.", "Jamie B."
    ];

    private static readonly string[] FakeReviewTexts =
    [
        "Great atmosphere and friendly staff. Would definitely come back!",
        "The food was amazing, especially the appetizers. Highly recommend.",
        "Decent place but a bit overpriced for what you get.",
        "Absolutely loved it. One of the best spots in the city.",
        "Good vibes, great music, and the drinks were on point.",
        "Nothing special honestly, but not bad either. Average experience.",
        "Perfect for a date night. Cozy and romantic setting.",
        "The service was slow but the quality made up for it.",
        "Hidden gem! Can't believe I hadn't been here before.",
        "Solid choice for a casual hangout with friends.",
        "The outdoor seating area is beautiful, especially at sunset.",
        "A bit noisy but the energy is infectious. Fun place.",
    ];

    private static readonly string[] FakeRelativeTimes =
    [
        "a week ago", "2 weeks ago", "a month ago", "2 months ago",
        "3 months ago", "6 months ago", "a year ago"
    ];

    private static readonly string[] DayNames =
    [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    public Task<PlacesDetailResult?> GetRatingAsync(string name, double latitude, double longitude, CancellationToken ct = default)
    {
        // Use a deterministic seed based on the item name so the same item
        // always gets the same fake rating (consistent during a session).
        var seed = name.GetHashCode();
        var rng = new Random(seed);

        // Generate a rating between 2.5 and 5.0 (realistic range)
        var rating = Math.Round(rng.NextDouble() * 2.5 + 2.5, 1);

        // Generate review count between 5 and 500
        var reviewCount = rng.Next(5, 501);

        // Generate 1–5 fake reviews
        var reviewListCount = rng.Next(1, 6);
        var reviews = new List<ReviewData>();

        for (var i = 0; i < reviewListCount; i++)
        {
            var authorName = FakeAuthors[rng.Next(FakeAuthors.Length)];
            var reviewRating = Math.Round(rng.NextDouble() * 2.0 + 3.0, 1); // 3.0–5.0
            var text = FakeReviewTexts[rng.Next(FakeReviewTexts.Length)];
            var relativeTime = FakeRelativeTimes[rng.Next(FakeRelativeTimes.Length)];

            reviews.Add(new ReviewData(authorName, reviewRating, text, relativeTime));
        }

        var hours = GenerateHoursData(rng);
        var busyTimes = GenerateBusyTimesData(rng);

        var result = new PlacesDetailResult(rating, reviewCount, reviews, hours, busyTimes);
        return Task.FromResult<PlacesDetailResult?>(result);
    }

    private static HoursData? GenerateHoursData(Random rng)
    {
        // ~20% of items return null hours
        if (rng.Next(100) < 20)
            return null;

        var pattern = rng.Next(100);
        var dayHours = new List<DayHours>();

        if (pattern < 30)
        {
            // ~30% standard business hours
            var openHour = rng.Next(7, 11);  // 7–10 AM
            var closeHour = rng.Next(20, 23); // 8–10 PM
            var hoursText = $"{FormatHour(openHour)} – {FormatHour(closeHour)}";

            for (var i = 0; i < 7; i++)
            {
                dayHours.Add(new DayHours(DayNames[i], hoursText));
            }
        }
        else if (pattern < 60)
        {
            // ~30% extended hours (Open 24 hours)
            for (var i = 0; i < 7; i++)
            {
                dayHours.Add(new DayHours(DayNames[i], "Open 24 hours"));
            }
        }
        else
        {
            // ~20% split hours (closed between lunch and dinner)
            var morningOpen = rng.Next(7, 10);   // 7–9 AM
            var morningClose = rng.Next(13, 15);  // 1–2 PM
            var eveningOpen = rng.Next(17, 18);   // 5 PM
            var eveningClose = rng.Next(21, 24);  // 9–11 PM
            var hoursText = $"{FormatHour(morningOpen)} – {FormatHour(morningClose)}, {FormatHour(eveningOpen)} – {FormatHour(eveningClose)}";

            for (var i = 0; i < 7; i++)
            {
                dayHours.Add(new DayHours(DayNames[i], hoursText));
            }
        }

        return new HoursData(dayHours);
    }

    private static BusyTimesData? GenerateBusyTimesData(Random rng)
    {
        // ~20% of items return null busy times
        if (rng.Next(100) < 20)
            return null;

        var hourlyPopularity = new List<HourPopularity>();

        for (var hour = 0; hour < 24; hour++)
        {
            var basePopularity = GetBasePopularity(hour);
            // Add some random variation (±10%)
            var variation = rng.Next(-10, 11);
            var popularity = Math.Clamp(basePopularity + variation, 0, 100);
            hourlyPopularity.Add(new HourPopularity(hour, popularity));
        }

        return new BusyTimesData(hourlyPopularity);
    }

    /// <summary>
    /// Returns a base popularity percentage for a given hour following a bell-curve
    /// pattern with peaks at lunch (12 PM) and dinner (7 PM).
    /// </summary>
    private static int GetBasePopularity(int hour)
    {
        return hour switch
        {
            0 => 15,   // midnight
            1 => 10,
            2 => 8,    // early morning low
            3 => 5,
            4 => 5,
            5 => 8,
            6 => 15,   // starting to rise
            7 => 25,
            8 => 35,
            9 => 45,
            10 => 55,
            11 => 70,  // approaching lunch peak
            12 => 85,  // lunch peak
            13 => 75,
            14 => 60,  // post-lunch dip
            15 => 50,
            16 => 55,
            17 => 65,  // rising toward dinner
            18 => 75,
            19 => 90,  // dinner peak
            20 => 80,
            21 => 60,  // winding down
            22 => 40,
            23 => 25,
            _ => 20
        };
    }

    private static string FormatHour(int hour24)
    {
        var period = hour24 >= 12 ? "PM" : "AM";
        var hour12 = hour24 % 12;
        if (hour12 == 0) hour12 = 12;
        return $"{hour12}:00 {period}";
    }
}
