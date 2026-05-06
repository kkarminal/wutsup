# Implementation Plan: Discovery Ratings & Reviews

## Overview

This plan implements Google Places API integration with server-side caching, enriches discovery items with rating/review data, adds a star rating display component, expandable card details, and a list/carousel view toggle. The implementation proceeds bottom-up: API data layer → service layer → endpoint enrichment → client models → UI components → view toggle wiring.

## Tasks

- [x] 1. Create API data models and cache infrastructure
  - [x] 1.1 Create RatingData, ReviewData, PlacesRatingResult, and EnrichedDiscoveryItemDto models
    - Create `api/Models/RatingData.cs` with `RatingData` and `ReviewData` records
    - Create `api/Models/PlacesRatingResult.cs` record
    - Create `api/Models/EnrichedDiscoveryItemDto.cs` extending DiscoveryItemDto with a nullable `RatingData` field
    - _Requirements: 6.3_
  - [x] 1.2 Create RatingCacheEntry entity and EF Core configuration
    - Create `api/Models/RatingCacheEntry.cs` entity class with Id, DiscoveryItemId, RatingDataJson, CachedAt, ExpiresAt
    - Add `DbSet<RatingCacheEntry>` to `AppDbContext`
    - Configure table mapping (`rating_cache`), unique index on `discovery_item_id`, index on `expires_at`
    - Create EF Core migration for the `rating_cache` table
    - _Requirements: 2.4_
  - [x] 1.3 Add GooglePlaces and RatingCache configuration sections
    - Add `GooglePlaces` section (ApiKey, BaseUrl, TimeoutSeconds) and `RatingCache` section (TtlMinutes) to `appsettings.json`
    - Add placeholder values in `appsettings.Local.json`
    - _Requirements: 2.3_

- [x] 2. Implement IRatingCacheStore and RatingCacheStore
  - [x] 2.1 Create IRatingCacheStore interface and RatingCacheStore implementation
    - Create `api/Services/IRatingCacheStore.cs` with `GetAsync` and `SetAsync` methods
    - Create `api/Services/RatingCacheStore.cs` using EF Core to read/write `RatingCacheEntry` records
    - Implement TTL check in `GetAsync` (return null if expired)
    - Implement upsert logic in `SetAsync` (insert or update existing entry)
    - Register in DI container in `Program.cs`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 Write property test: Cache hit returns stored data (Property 3)
    - **Property 3: Cache hit returns stored data without external API call**
    - **Validates: Requirements 2.1, 2.2**
    - Test file: `tests/Wutsup.Api.Tests/RatingServicePropertyTests.cs`
  - [x] 2.3 Write property test: Cache miss fetches from API and stores (Property 4)
    - **Property 4: Cache miss fetches from API and stores by item ID**
    - **Validates: Requirements 2.3, 2.4**
    - Test file: `tests/Wutsup.Api.Tests/RatingServicePropertyTests.cs`

- [x] 3. Implement IPlacesClient and PlacesClient
  - [x] 3.1 Create IPlacesClient interface and PlacesClient implementation
    - Create `api/Services/IPlacesClient.cs` with `GetRatingAsync` method
    - Create `api/Services/PlacesClient.cs` using `HttpClient` to call Google Places API
    - Implement place ID resolution using item name and coordinates
    - Parse response into `PlacesRatingResult` (rating, review count, up to 5 reviews)
    - Handle timeouts (configurable via `GooglePlaces:TimeoutSeconds`), HTTP errors, and no-match scenarios by returning null
    - Clamp rating values to 0–5 range
    - Register `HttpClient` and `PlacesClient` in DI container
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 3.2 Write property test: Places API response parsing preserves data (Property 1)
    - **Property 1: Places API response parsing preserves data**
    - **Validates: Requirements 1.2**
    - Test file: `tests/Wutsup.Api.Tests/RatingServicePropertyTests.cs`
  - [x] 3.3 Write property test: API errors produce null rating without throwing (Property 2)
    - **Property 2: API errors produce null rating without throwing**
    - **Validates: Requirements 1.3, 1.4**
    - Test file: `tests/Wutsup.Api.Tests/RatingServicePropertyTests.cs`

- [x] 4. Implement IRatingService and RatingService
  - [x] 4.1 Create IRatingService interface and RatingService implementation
    - Create `api/Services/IRatingService.cs` with `GetRatingForItemAsync` and `EnrichItemsAsync` methods
    - Create `api/Services/RatingService.cs` orchestrating cache lookup → Places API call → cache store
    - Implement graceful degradation: catch cache failures (fall back to Places API), catch Places API failures (return null rating)
    - Log failures using `ILogger<RatingService>`
    - Register in DI container
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.5, 6.2, 6.4_
  - [x] 4.2 Write property test: Response DTO includes rating fields with correct structure (Property 6)
    - **Property 6: Response DTO includes rating fields with correct structure**
    - **Validates: Requirements 6.1, 6.3, 6.4**
    - Test file: `tests/Wutsup.Api.Tests/RatingServicePropertyTests.cs`
  - [x] 4.3 Write property test: Enrichment applies cached data to all items (Property 7)
    - **Property 7: Enrichment applies cached data to all items**
    - **Validates: Requirements 6.2**
    - Test file: `tests/Wutsup.Api.Tests/RatingServicePropertyTests.cs`

- [x] 5. Enrich DiscoveryController endpoint with rating data
  - [x] 5.1 Update DiscoveryService and DiscoveryController to return enriched DTOs
    - Inject `IRatingService` into `DiscoveryService`
    - After fetching paginated items, call `EnrichItemsAsync` to attach rating data
    - Update `DiscoveryPageResponse` to use `EnrichedDiscoveryItemDto` (or make response generic)
    - Ensure the endpoint still returns items without rating data if enrichment fails for any item
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 6. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update client data models and API client
  - [x] 7.1 Extend client DiscoveryItem interface with rating fields
    - Add `Review` interface to `client/services/discoveryApi.ts`
    - Add `RatingData` interface to `client/services/discoveryApi.ts`
    - Add `rating: RatingData | null` field to the existing `DiscoveryItem` interface
    - No changes needed to the API client fetch logic (field is included in the response automatically)
    - _Requirements: 6.3_

- [x] 8. Implement StarRatingDisplay component
  - [x] 8.1 Create StarRatingDisplay component
    - Create `client/components/StarRatingDisplay.tsx`
    - Render 5 Ionicons star icons: `star` (filled), `star-half` (half-filled), `star-outline` (empty)
    - Calculate star breakdown: filled for whole stars, half for 0.25–0.74 remainder, empty for the rest
    - Display numeric rating text next to stars
    - Provide `accessibilityLabel`: "Rated {rating} out of 5 stars"
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 8.2 Write property test: Star rating display correctness (Property 5)
    - **Property 5: Star rating display correctness**
    - **Validates: Requirements 3.1, 3.2, 3.4**
    - Test file: `client/__tests__/properties/discoveryRatings.property.test.ts`

- [x] 9. Implement ExpandedCardView component
  - [x] 9.1 Create ExpandedCardView component
    - Create `client/components/ExpandedCardView.tsx`
    - Display top reviews (author name, rating, text, relative time)
    - Display menu metadata section when available
    - Display event metadata section when available
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 10. Add expand/collapse behavior to DiscoveryCard
  - [x] 10.1 Update DiscoveryCard with expand/collapse functionality
    - Add tap handler to toggle expanded state
    - Integrate `StarRatingDisplay` — show when `item.rating` is not null, omit when null
    - Integrate `ExpandedCardView` — render when card is expanded
    - Animate expand/collapse transitions over 300ms using `react-native-reanimated`
    - _Requirements: 3.3, 4.1, 4.5, 4.6_
  - [x] 10.2 Enforce single-expanded-card constraint in ResultsFeed
    - Lift expanded card state to `ResultsFeed` (or a shared context)
    - When a card is expanded, collapse any previously expanded card
    - Pass `expandedItemId` and `onToggleExpand` to each `DiscoveryCard`
    - _Requirements: 4.7_
  - [x] 10.3 Write property test: At most one card expanded at a time (Property 8)
    - **Property 8: At most one card expanded at a time**
    - **Validates: Requirements 4.7**
    - Test file: `client/__tests__/properties/discoveryRatings.property.test.ts`

- [x] 11. Implement ViewToggle and ResultsCarousel
  - [x] 11.1 Create ViewToggle component
    - Create `client/components/ViewToggle.tsx`
    - Render two options (list and carousel) using Ionicons (`list-outline`, `grid-outline`)
    - Accept `mode` and `onModeChange` props
    - Default to list view when no prior selection exists
    - Persist selected mode in component state for the session duration
    - _Requirements: 5.1, 5.6, 5.7_
  - [x] 11.2 Create ResultsCarousel component
    - Create `client/components/ResultsCarousel.tsx`
    - Display one full-detail discovery card at a time with horizontal swipe navigation
    - Use `FlatList` with `horizontal` and `pagingEnabled` for swipe gestures
    - Support infinite scroll by loading next page when reaching the last loaded item
    - Each carousel card displays all detail sections (star rating, reviews, menu, events) without requiring tap to expand
    - _Requirements: 5.3, 5.4, 5.5, 5.8, 5.9_
  - [x] 11.3 Write property test: Carousel cards display all detail sections (Property 9)
    - **Property 9: Carousel cards display all detail sections**
    - **Validates: Requirements 5.9**
    - Test file: `client/__tests__/properties/discoveryRatings.property.test.ts`

- [x] 12. Wire ViewToggle into DashboardScreen and ResultsFeed
  - [x] 12.1 Integrate ViewToggle with ResultsFeed and ResultsCarousel
    - Add `ViewToggle` to `DashboardScreen` above the feed container
    - Add view mode state to `DashboardScreen`
    - Conditionally render `ResultsFeed` (list mode) or `ResultsCarousel` (carousel mode) based on selected mode
    - Pass `activeNodeId` and `visible` props to both components
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (P1–P9)
- Unit tests validate specific examples and edge cases
- The API implementation proceeds bottom-up (data layer → services → controller) to ensure each layer is testable in isolation
- Client implementation proceeds from models → atomic components → composite components → wiring
