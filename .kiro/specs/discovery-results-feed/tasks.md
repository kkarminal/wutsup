# Implementation Plan: Discovery Results Feed

## Overview

This plan implements a contextual discovery results feed on the Dashboard screen, driven by the user's position in the Drill Orb navigation tree. The implementation progresses from API data model through service layer, endpoint, client API integration, reactive hook, UI components, and finally Dashboard integration — each step building on the previous.

## Tasks

- [x] 1. Create DiscoveryItem entity and database migration
  - [x] 1.1 Create the `DiscoveryItem` model class in `api/Models/DiscoveryItem.cs`
    - Define entity with properties: Id, Name, Description, Latitude, Longitude, City, Address, ImageUrl, NavigationNodeId, NavigationNode (navigation property), Metadata (string for JSONB), CreatedAt, UpdatedAt
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Create the `DiscoveryItemDto` and `DiscoveryPageResponse` DTOs in `api/Models/`
    - Define `DiscoveryItemDto` record with camelCase-serializable fields including `CategoryLabel`
    - Define `DiscoveryPageResponse` record with Items, TotalCount, Page, PageSize
    - _Requirements: 2.4, 2.7, 9.1, 9.2_
  - [x] 1.3 Update `AppDbContext` to add `DiscoveryItems` DbSet and configure entity
    - Add `DbSet<DiscoveryItem>` property
    - Configure table name `discovery_items`, column types (JSONB for metadata, varchar lengths), foreign key to `navigation_nodes`, and indexes on `navigation_node_id` and composite `(navigation_node_id, created_at DESC)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.4 Generate and apply the EF Core migration for the `discovery_items` table
    - Run `dotnet ef migrations add AddDiscoveryItems`
    - Verify migration creates table with correct columns, constraints, and indexes
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2. Create mock data seeder migration
  - [x] 2.1 Create an EF Core migration that seeds 500+ DiscoveryItems
    - Distribute items across all leaf-level navigation nodes
    - Use realistic names and descriptions appropriate to each category (music venues for Rock, restaurant names for Italian, trail names for Hiking, etc.)
    - Spread items across at least 3 cities (e.g., Austin TX, Portland OR, Denver CO)
    - Populate `metadata` JSONB with category-appropriate fields (eventDate/venue for events, cuisineType/priceRange for restaurants, difficulty/distance for hiking, etc.)
    - Assign placeholder image URLs using `https://picsum.photos/seed/{id}/400/300` or similar
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Implement DiscoveryService with descendant resolution
  - [x] 3.1 Create `IDiscoveryService` interface in `api/Services/IDiscoveryService.cs`
    - Define `Task<DiscoveryPageResponse> GetItemsAsync(int nodeId, int page, int pageSize)`
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 Create `DiscoveryService` implementation in `api/Services/DiscoveryService.cs`
    - Verify node exists (throw if not found)
    - Use recursive CTE (`WITH RECURSIVE descendants AS (...)`) to resolve all descendant node IDs including the queried node itself
    - Query `discovery_items` WHERE `navigation_node_id IN (descendantIds)` ordered by `created_at DESC`
    - Apply OFFSET/LIMIT pagination
    - Join `navigation_nodes` to populate `categoryLabel`
    - Return `DiscoveryPageResponse` with items, totalCount, page, pageSize
    - _Requirements: 2.2, 2.3, 2.6, 9.2_
  - [x] 3.3 Register `IDiscoveryService`/`DiscoveryService` in DI container in `Program.cs`
    - _Requirements: 2.1_

- [x] 4. Implement DiscoveryController endpoint
  - [x] 4.1 Create `DiscoveryController` in `api/Controllers/DiscoveryController.cs`
    - Expose `GET /api/discovery/items` with query parameters: `nodeId` (required int), `page` (int, default 1), `pageSize` (int, default 20, clamped to max 100)
    - Return 400 if `nodeId` is missing
    - Return 404 if node does not exist (catch from service)
    - Return 200 with `DiscoveryPageResponse` JSON body on success
    - Clamp `page` to minimum 1 and `pageSize` to range [1, 100]
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.7, 9.1_

- [x] 5. Checkpoint — Verify API layer
  - Ensure the API builds successfully and migrations apply cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. API property tests
  - [x] 6.1 Write property test: Descendant node resolution correctness (Property 1)
    - **Property 1: Descendant node resolution correctness**
    - Generate random navigation trees (1–4 levels, 2–5 children per node) and random items distributed across nodes
    - Assert: query for any node returns exactly items on that node or its descendants, no more, no less
    - **Validates: Requirements 2.2**
  - [x] 6.2 Write property test: Pagination slice correctness (Property 2)
    - **Property 2: Pagination slice correctness**
    - Generate random item counts (1–200) with random page/pageSize values
    - Assert: returned slice matches expected offset/limit of the ordered set; totalCount equals total matching items; items.length ≤ pageSize
    - **Validates: Requirements 2.3, 2.4**
  - [x] 6.3 Write property test: Result ordering invariant (Property 3)
    - **Property 3: Result ordering invariant**
    - Generate random items with random `created_at` timestamps
    - Assert: returned items are in descending `created_at` order
    - **Validates: Requirements 2.6**
  - [x] 6.4 Write property test: Response serialization structure (Property 4)
    - **Property 4: Response serialization structure**
    - Generate random valid DiscoveryItems
    - Assert: serialized JSON uses camelCase and includes all required fields (id, name, description, latitude, longitude, city, navigationNodeId, categoryLabel, metadata)
    - **Validates: Requirements 2.7, 9.1**
  - [x] 6.5 Write property test: CategoryLabel join correctness (Property 5)
    - **Property 5: CategoryLabel join correctness**
    - Generate random items linked to random nodes
    - Assert: categoryLabel matches the linked node's label
    - **Validates: Requirements 9.2**
  - [x] 6.6 Write property test: Serialization round-trip (Property 6)
    - **Property 6: Serialization round-trip**
    - Generate random DiscoveryItemDto objects
    - Assert: serialize to JSON → deserialize back produces equivalent object
    - **Validates: Requirements 9.3, 9.4**
  - [x] 6.7 Write property test: Metadata JSONB storage round-trip (Property 7)
    - **Property 7: Metadata JSONB storage round-trip**
    - Generate random JSON objects (nested, arrays, strings, numbers, booleans, nulls)
    - Assert: store in JSONB → retrieve → compare equals original
    - **Validates: Requirements 1.4**

- [x] 7. Implement client discoveryApi service module
  - [x] 7.1 Create `client/services/discoveryApi.ts`
    - Define `DiscoveryItem` interface with all fields (id, name, description, latitude, longitude, city, address, imageUrl, navigationNodeId, categoryLabel, metadata)
    - Define `DiscoveryPageResponse` interface with items, totalCount, page, pageSize
    - Define `DiscoveryApiError` class extending Error with statusCode property
    - Implement `createDiscoveryApiClient(apiBaseUrl: string)` factory returning a client with `getItems(nodeId, page?, pageSize?)` method
    - Use fetch with proper error handling: throw `DiscoveryApiError` on non-200 responses
    - Support `AbortSignal` parameter for request cancellation
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. Implement useDiscoveryFeed hook
  - [x] 8.1 Create `client/hooks/useDiscoveryFeed.ts`
    - Accept `activeNodeId: number | null` parameter
    - Maintain state: items array, page number, totalCount, loading, loadingMore, error, hasMore
    - On `activeNodeId` change: abort in-flight request via AbortController, reset items/page, fetch page 1
    - Implement `fetchNextPage`: increment page, fetch next page, append results to existing items
    - Compute `hasMore` as `items.length < totalCount`
    - Implement `retry` for re-attempting failed fetches
    - Return `UseDiscoveryFeedResult` with items, loading, loadingMore, error, hasMore, fetchNextPage, retry
    - _Requirements: 7.4, 7.5, 6.1, 6.4, 6.5, 8.1, 8.3_

- [x] 9. Implement DiscoveryCard component
  - [x] 9.1 Create `client/components/DiscoveryCard.tsx`
    - Accept `item: DiscoveryItem` prop
    - Render item name as prominent title (FONT_SIZE.lg, fontWeight 600)
    - Render description with `numberOfLines={2}` for truncation with ellipsis
    - Render map thumbnail placeholder using item's latitude/longitude
    - Render city name adjacent to map thumbnail
    - Render category badge pill/tag showing `categoryLabel`
    - Render item image when `imageUrl` is present; show category-appropriate placeholder icon otherwise
    - Set `accessibilityLabel={`${item.name}, ${item.categoryLabel}`}`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 10. Implement ResultsFeed component
  - [x] 10.1 Create `client/components/ResultsFeed.tsx`
    - Accept `activeNodeId: number | null` and `visible: boolean` props
    - Use `useDiscoveryFeed` hook internally
    - Render FlatList of DiscoveryCard components with virtualization
    - Implement `onEndReached` with `onEndReachedThreshold` for infinite scroll (trigger at ~200pt from bottom)
    - Show loading indicator during initial fetch
    - Show loading indicator at list bottom during page loads
    - Show empty state message ("No results found for this category") when items is empty and not loading
    - Show retry button at bottom on page fetch failure (use ThemedButton)
    - Animate enter/exit with Reanimated FadeIn/FadeOut (300ms duration)
    - Reset scroll position to top via `scrollToOffset({ offset: 0 })` when `activeNodeId` changes
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11. Integrate ResultsFeed into DashboardScreen
  - [x] 11.1 Update `client/screens/DashboardScreen.tsx`
    - Import and render `ResultsFeed` component
    - Pass `activeNodeId` from `useOrbController`'s `activeNode?.id` (or null when menu is closed)
    - Pass `visible` based on `orbState` being 'open' or 'animating'
    - Position ResultsFeed on the bottom half of the screen, below the Orb Menu area
    - Hide ResultsFeed when Orb Menu is closed
    - _Requirements: 4.1, 4.2, 6.1, 6.2, 6.3_

- [x] 12. Checkpoint — Verify full stack integration
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the feed loads items when the Orb Menu is opened and filters correctly on drill-down.

- [x] 13. Client property tests
  - [x] 13.1 Write property test: DiscoveryCard renders required information (Property 8)
    - **Property 8: DiscoveryCard renders required information**
    - Generate random valid DiscoveryItem objects with `fc.record({ id: fc.nat(), name: fc.string({minLength:1}), city: fc.string({minLength:1}), categoryLabel: fc.string({minLength:1}), ... })`
    - Assert: rendered output contains name, city, categoryLabel; accessibilityLabel contains name and categoryLabel
    - **Validates: Requirements 5.1, 5.4, 5.5, 5.8**
  - [x] 13.2 Write property test: Feed reacts to active node changes (Property 9)
    - **Property 9: Feed reacts to active node changes**
    - Generate random sequences of nodeId changes with `fc.array(fc.nat({min:1}), {minLength:2, maxLength:5})`
    - Assert: after each change, fetch is called with the latest nodeId
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 13.3 Write property test: Request cancellation on rapid node changes (Property 10)
    - **Property 10: Request cancellation on rapid node changes**
    - Generate rapid sequences of nodeIds with `fc.array(fc.nat({min:1}), {minLength:2, maxLength:5})`
    - Assert: only the final nodeId's response populates items; earlier responses are discarded
    - **Validates: Requirements 7.5**
  - [x] 13.4 Write property test: Pagination terminates correctly (Property 11)
    - **Property 11: Pagination terminates correctly**
    - Generate `fc.record({ totalCount: fc.nat({max:100}), pageSize: fc.integer({min:1, max:50}) })`
    - Assert: when loaded items >= totalCount, hasMore is false and no additional fetches are initiated
    - **Validates: Requirements 8.3**
  - [x] 13.5 Write property test: Page append stability (Property 12)
    - **Property 12: Page append stability**
    - Generate multiple pages of items with `fc.array(fc.array(fc.record({...}), {minLength:1, maxLength:20}), {minLength:2, maxLength:4})`
    - Assert: first page items remain unchanged after appending subsequent pages
    - **Validates: Requirements 8.5**

- [x] 14. Final checkpoint — Ensure all tests pass
  - Run full test suite for both API and client projects
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The recursive CTE approach avoids multiple database round-trips for descendant resolution
- AbortController usage prevents stale data from appearing when the user navigates rapidly
