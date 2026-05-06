using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public class PlacesClient : IPlacesClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PlacesClient> _logger;

    public PlacesClient(HttpClient httpClient, IConfiguration configuration, ILogger<PlacesClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PlacesDetailResult?> GetRatingAsync(string name, double latitude, double longitude, CancellationToken ct = default)
    {
        try
        {
            var apiKey = _configuration["GooglePlaces:ApiKey"];
            var baseUrl = _configuration["GooglePlaces:BaseUrl"] ?? "https://maps.googleapis.com/maps/api/place";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Google Places API key is not configured");
                return null;
            }

            // Step 1: Find Place from text search using name and coordinates
            var placeId = await ResolvePlaceIdAsync(name, latitude, longitude, baseUrl, apiKey, ct);

            if (placeId is null)
            {
                return null;
            }

            // Step 2: Get Place Details (rating and reviews)
            return await GetPlaceDetailsAsync(placeId, baseUrl, apiKey, ct);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || ex.CancellationToken != ct)
        {
            _logger.LogWarning("Google Places API request timed out for '{Name}' at ({Latitude}, {Longitude})", name, latitude, longitude);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling Google Places API for '{Name}' at ({Latitude}, {Longitude})", name, latitude, longitude);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling Google Places API for '{Name}' at ({Latitude}, {Longitude})", name, latitude, longitude);
            return null;
        }
    }

    private async Task<string?> ResolvePlaceIdAsync(string name, double latitude, double longitude, string baseUrl, string apiKey, CancellationToken ct)
    {
        var locationBias = $"point:{latitude},{longitude}";
        var encodedName = Uri.EscapeDataString(name);
        var url = $"{baseUrl}/findplacefromtext/json?input={encodedName}&inputtype=textquery&locationbias={locationBias}&fields=place_id&key={apiKey}";

        var response = await _httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var findPlaceResponse = JsonSerializer.Deserialize<FindPlaceResponse>(json, JsonOptions);

        if (findPlaceResponse?.Candidates is null || findPlaceResponse.Candidates.Count == 0)
        {
            return null;
        }

        return findPlaceResponse.Candidates[0].PlaceId;
    }

    private async Task<PlacesDetailResult?> GetPlaceDetailsAsync(string placeId, string baseUrl, string apiKey, CancellationToken ct)
    {
        var url = $"{baseUrl}/details/json?place_id={placeId}&fields=rating,user_ratings_total,reviews,opening_hours&key={apiKey}";

        var response = await _httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var detailsResponse = JsonSerializer.Deserialize<PlaceDetailsResponse>(json, JsonOptions);

        if (detailsResponse?.Result is null)
        {
            return null;
        }

        var result = detailsResponse.Result;

        // Clamp rating to 0–5 range
        var rating = Math.Clamp(result.Rating ?? 0, 0, 5);
        var reviewCount = result.UserRatingsTotal ?? 0;

        // Take up to 5 reviews
        var reviews = new List<ReviewData>();
        if (result.Reviews is not null)
        {
            foreach (var review in result.Reviews.Take(5))
            {
                reviews.Add(new ReviewData(
                    review.AuthorName ?? string.Empty,
                    Math.Clamp(review.Rating ?? 0, 0, 5),
                    review.Text ?? string.Empty,
                    review.RelativeTimeDescription ?? string.Empty
                ));
            }
        }

        // Parse opening hours into HoursData
        var hours = ParseHoursData(result.OpeningHours);

        // Parse busy times (popular times) - Google Places basic API does not reliably
        // return popular times data, so we parse it if available but expect null most of the time
        var busyTimes = ParseBusyTimesData(result.CurrentOpeningHours);

        return new PlacesDetailResult(rating, reviewCount, reviews, hours, busyTimes);
    }

    private HoursData? ParseHoursData(PlaceOpeningHours? openingHours)
    {
        if (openingHours?.WeekdayText is null || openingHours.WeekdayText.Count == 0)
        {
            return null;
        }

        var dayHoursList = new List<DayHours>();

        foreach (var entry in openingHours.WeekdayText)
        {
            if (string.IsNullOrWhiteSpace(entry))
            {
                _logger.LogWarning("Invalid hours entry: empty or whitespace string");
                return null;
            }

            // Format is "DayName: HoursText" (e.g., "Monday: 9:00 AM – 10:00 PM")
            var separatorIndex = entry.IndexOf(": ", StringComparison.Ordinal);
            if (separatorIndex < 0)
            {
                _logger.LogWarning("Invalid hours entry format, expected 'Day: Hours' but got: {Entry}", entry);
                return null;
            }

            var day = entry[..separatorIndex];
            var hours = entry[(separatorIndex + 2)..];

            dayHoursList.Add(new DayHours(day, hours));
        }

        return new HoursData(dayHoursList);
    }

    private BusyTimesData? ParseBusyTimesData(PlaceCurrentOpeningHours? currentOpeningHours)
    {
        // Google Places API does not reliably return popular times / busy times
        // in the standard Places Details response. If the data is present in a
        // non-standard field, we attempt to parse it; otherwise return null.
        if (currentOpeningHours?.PopularTimes is null || currentOpeningHours.PopularTimes.Count == 0)
        {
            return null;
        }

        var hourlyPopularity = new List<HourPopularity>();

        foreach (var entry in currentOpeningHours.PopularTimes)
        {
            if (entry.Hour < 0 || entry.Hour > 23)
            {
                _logger.LogWarning("Invalid busy times entry: hour {Hour} is out of range 0-23", entry.Hour);
                return null;
            }

            if (entry.PopularityPercent < 0 || entry.PopularityPercent > 100)
            {
                _logger.LogWarning("Invalid busy times entry: popularity {Percent} is out of range 0-100", entry.PopularityPercent);
                return null;
            }

            hourlyPopularity.Add(new HourPopularity(entry.Hour, entry.PopularityPercent));
        }

        return new BusyTimesData(hourlyPopularity);
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    // Internal DTOs for deserializing Google Places API responses

    internal class FindPlaceResponse
    {
        [JsonPropertyName("candidates")]
        public List<PlaceCandidate>? Candidates { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }
    }

    internal class PlaceCandidate
    {
        [JsonPropertyName("place_id")]
        public string? PlaceId { get; set; }
    }

    internal class PlaceDetailsResponse
    {
        [JsonPropertyName("result")]
        public PlaceDetailsResult? Result { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }
    }

    internal class PlaceDetailsResult
    {
        [JsonPropertyName("rating")]
        public double? Rating { get; set; }

        [JsonPropertyName("user_ratings_total")]
        public int? UserRatingsTotal { get; set; }

        [JsonPropertyName("reviews")]
        public List<PlaceReview>? Reviews { get; set; }

        [JsonPropertyName("opening_hours")]
        public PlaceOpeningHours? OpeningHours { get; set; }

        [JsonPropertyName("current_opening_hours")]
        public PlaceCurrentOpeningHours? CurrentOpeningHours { get; set; }
    }

    internal class PlaceOpeningHours
    {
        [JsonPropertyName("weekday_text")]
        public List<string>? WeekdayText { get; set; }
    }

    internal class PlaceCurrentOpeningHours
    {
        [JsonPropertyName("popular_times")]
        public List<PopularTimeEntry>? PopularTimes { get; set; }
    }

    internal class PopularTimeEntry
    {
        [JsonPropertyName("hour")]
        public int Hour { get; set; }

        [JsonPropertyName("popularity_percent")]
        public int PopularityPercent { get; set; }
    }

    internal class PlaceReview
    {
        [JsonPropertyName("author_name")]
        public string? AuthorName { get; set; }

        [JsonPropertyName("rating")]
        public double? Rating { get; set; }

        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("relative_time_description")]
        public string? RelativeTimeDescription { get; set; }
    }
}
