namespace Wutsup.Api.Models;

public record RatingData(
    double Rating,
    int ReviewCount,
    List<ReviewData> Reviews
);

public record ReviewData(
    string AuthorName,
    double Rating,
    string Text,
    string RelativeTimeDescription
);
