namespace Wutsup.Api.Models;

public record DiscoveryPageResponse(
    List<EnrichedDiscoveryItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize
);
