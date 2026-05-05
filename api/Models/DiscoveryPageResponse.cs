namespace Wutsup.Api.Models;

public record DiscoveryPageResponse(
    List<DiscoveryItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize
);
