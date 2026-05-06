# Implementation Plan: Expanded Card Detail Tabs

## Overview

This plan transforms the existing flat-list `ExpandedCardView` into a tabbed interface (Info, Reviews, Location) with extended API data (hours, busy times). Implementation proceeds API-first (data models → service updates → mock data), then client-side (TypeScript interfaces → UI components → integration).

## Tasks

- [ ] 1. Extend API data models
  - [x] 1.1 Create new record types: DayHours, HoursData, HourPopularity, BusyTimesData
    - Add `DayHours(string Day, string Hours)` record
    - Add `HoursData(List<DayHours> WeekdayHours)` record
    - Add `HourPopularity(int Hour, int PopularityPercent)` record
    - Add `BusyTimesData(List<HourPopularity> HourlyPopularity)` record
    - Create these in `api/Models/` as new files or grouped logically
    - _Requirements: 5.2, 5.3_

  - [x] 1.2 Rename PlacesRatingResult to PlacesDetailResult and extend with hours/busy times
    - Rename `api/Models/PlacesRatingResult.cs` to `PlacesDetailResult.cs`
    - Change record to `PlacesDetailResult(double Rating, int ReviewCount, List<ReviewData> Reviews, HoursData? Hours, BusyTimesData? BusyTimes)`
    - Update all references from `PlacesRatingResult` to `PlacesDetailResult`
    - _Requirements: 5.6_

  - [x] 1.3 Update IPlacesClient interface return type
    - Change `Task<PlacesRatingResult?>` to `Task<PlacesDetailResult?>` in `IPlacesClient.GetRatingAsync`
    - _Requirements: 5.1_

  - [x] 1.4 Extend EnrichedDiscoveryItemDto with hours and busy times fields
    - Add `HoursData? Hours` and `BusyTimesData? BusyTimes` parameters to the record
    - _Requirements: 5.6, 6.3, 6.4_

- [ ] 2. Update PlacesClient to fetch hours and busy times from Google Places
  - [x] 2.1 Update PlacesClient.GetPlaceDetailsAsync to request opening_hours fields
    - Add `opening_hours` to the fields parameter in the Place Details API request URL
    - Parse `weekday_text` array from the response into `HoursData`
    - Return null for hours if data is missing or invalid
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 2.2 Add busy times parsing to PlacesClient
    - Parse popular times data from the response into `BusyTimesData`
    - Return null for busy times if data is missing or invalid
    - Log warnings for invalid data formats
    - _Requirements: 5.3, 5.5_

  - [x] 2.3 Update PlacesClient return type to PlacesDetailResult
    - Change `GetRatingAsync` to return `PlacesDetailResult?` with hours and busy times included
    - Update internal DTOs for deserializing the extended response
    - _Requirements: 5.1, 5.6_

- [ ] 3. Update FakePlacesClient with mock hours and busy times data
  - [x] 3.1 Add deterministic hours generation to FakePlacesClient
    - Use `name.GetHashCode()` seed to generate consistent hours patterns
    - Implement standard hours (e.g., "9:00 AM – 10:00 PM"), extended hours ("Open 24 hours"), and split hours (e.g., "11:00 AM – 2:00 PM, 5:00 PM – 11:00 PM")
    - ~20% of items return null hours
    - Generate 7 DayHours entries for non-null results
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 3.2 Add deterministic busy times generation to FakePlacesClient
    - Generate bell-curve popularity pattern with peaks at lunch (12 PM) and dinner (7 PM)
    - Low values for early morning (2–5 AM) and late night
    - ~20% of items return null busy times
    - _Requirements: 8.2, 8.4, 8.5_

  - [x] 3.3 Update FakePlacesClient return type to PlacesDetailResult
    - Change `GetRatingAsync` to return `PlacesDetailResult?` with hours and busy times
    - _Requirements: 8.1_

- [ ] 4. Update RatingService and EnrichedDiscoveryItemDto wiring
  - [x] 4.1 Update RatingService to pass hours and busy times through
    - Update `GetRatingForItemAsync` to extract hours and busy times from `PlacesDetailResult`
    - Update `EnrichItemsAsync` to include hours and busy times in `EnrichedDiscoveryItemDto`
    - Update cache serialization to include hours and busy times in `RatingData` or handle separately
    - _Requirements: 5.6_

- [ ]* 5. Write API property tests for Places data
  - [ ]* 5.1 Write property test for hours data parsing (Property 5)
    - **Property 5: Hours data parsing preserves structure**
    - Generate random weekday text arrays of 7 strings, verify parsing produces 7 DayHours with matching fields
    - **Validates: Requirements 5.2**

  - [ ]* 5.2 Write property test for busy times data parsing (Property 6)
    - **Property 6: Busy times data parsing preserves structure**
    - Generate random popular times arrays with hour (0–23) and percentage (0–100), verify parsing preserves count, order, and values
    - **Validates: Requirements 5.3**

  - [ ]* 5.3 Write property test for FakePlacesClient determinism (Property 8)
    - **Property 8: FakePlacesClient determinism**
    - Generate random item name strings, call GetRatingAsync multiple times with same inputs, verify identical results
    - **Validates: Requirements 8.1, 8.5**

  - [ ]* 5.4 Write property test for FakePlacesClient output variety (Property 9)
    - **Property 9: FakePlacesClient output variety**
    - Generate sets of 20+ distinct names, verify at least two distinct hours patterns and at least one null hours and one null busy times
    - **Validates: Requirements 8.3, 8.4**

  - [ ]* 5.5 Write property test for FakePlacesClient bell-curve pattern (Property 10)
    - **Property 10: FakePlacesClient busy times bell-curve pattern**
    - For items with non-null BusyTimesData, verify average popularity for hours 2–5 AM < average for hours 11 AM–1 PM
    - **Validates: Requirements 8.2**

- [x] 6. Checkpoint - API changes complete
  - Ensure all API tests pass (`cd tests/Wutsup.Api.Tests && dotnet test`), ask the user if questions arise.

- [ ] 7. Extend client data model interfaces
  - [x] 7.1 Add TypeScript interfaces for hours and busy times
    - Add `DayHours`, `HoursData`, `HourPopularity`, `BusyTimesData` interfaces to `client/services/discoveryApi.ts`
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 Extend DiscoveryItem interface with hours and busyTimes fields
    - Add `hours: HoursData | null` and `busyTimes: BusyTimesData | null` to the `DiscoveryItem` interface
    - _Requirements: 6.3, 6.4, 6.5_

- [ ] 8. Implement TabBar component
  - [x] 8.1 Create TabBar component
    - Create `client/components/TabBar.tsx`
    - Accept `tabs: string[]`, `activeTab: string`, `onTabChange: (tab: string) => void` props
    - Render horizontal row of touchable tab labels
    - Use theme primary color for active tab indicator
    - Animate active indicator position on tab change using react-native-reanimated
    - _Requirements: 1.1, 1.3, 1.5, 7.2_

- [ ] 9. Implement InfoTabContent component
  - [x] 9.1 Create InfoTabContent component
    - Create `client/components/InfoTabContent.tsx`
    - Accept `description`, `address`, `categoryLabel`, `menuMetadata?`, `eventMetadata?` props
    - Display full description without truncation
    - Display address (omit if null)
    - Display category label as a badge
    - Display menu items with names and prices when available
    - Display event details (name, date, description) when available
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 10. Implement ReviewsTabContent component
  - [x] 10.1 Create ReviewsTabContent component
    - Create `client/components/ReviewsTabContent.tsx`
    - Accept `rating: RatingData | null` prop
    - Display overall rating and review count header with StarRatingDisplay
    - Display up to 5 reviews with author name, individual rating, text, and relative time
    - Show "No reviews available" message when rating is null
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 11. Implement LocationTabContent component
  - [x] 11.1 Install react-native-maps dependency
    - Run `npx expo install react-native-maps` in the client directory
    - _Requirements: 4.1_

  - [x] 11.2 Create LocationTabContent component with MapView
    - Create `client/components/LocationTabContent.tsx`
    - Accept `latitude`, `longitude`, `address`, `city`, `hours`, `busyTimes` props
    - Render MapView centered on coordinates with a marker
    - Display address and city below the map (omit address if null)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 11.3 Create HoursDisplay sub-component
    - Create `client/components/HoursDisplay.tsx`
    - Accept `hours: HoursData` prop
    - Display each day's hours in a list
    - Highlight current day using theme primary color
    - Omit entirely when hours is null (handled by parent)
    - _Requirements: 4.6, 4.7, 4.9_

  - [x] 11.4 Create BusyTimesChart sub-component
    - Create `client/components/BusyTimesChart.tsx`
    - Accept `busyTimes: BusyTimesData` prop
    - Render horizontal bar chart showing hourly popularity percentages
    - Omit entirely when busyTimes is null (handled by parent)
    - _Requirements: 4.8, 4.10_

- [ ] 12. Refactor ExpandedCardView to use tab system
  - [x] 12.1 Refactor ExpandedCardView to accept full DiscoveryItem and manage tab state
    - Change props to `{ item: DiscoveryItem }`
    - Add `useState` for active tab (default "Info")
    - Render TabBar with ["Info", "Reviews", "Location"]
    - Conditionally render InfoTabContent, ReviewsTabContent, or LocationTabContent based on active tab
    - Implement fade transition (200ms) on tab change using react-native-reanimated
    - _Requirements: 1.2, 1.4, 1.6, 7.1, 7.3_

  - [-] 12.2 Update DiscoveryCard to pass full item to ExpandedCardView
    - Change `ExpandedCardView` usage in `DiscoveryCard` to pass `item={item}` instead of individual props
    - Remove old prop destructuring (reviews, menuMetadata, eventMetadata)
    - _Requirements: 1.1_

- [ ]* 13. Write client property tests
  - [ ]* 13.1 Write property test for tab selection exclusivity (Property 1)
    - **Property 1: Tab selection exclusivity**
    - Generate random tab selections from ["Info", "Reviews", "Location"], verify only the selected tab's content renders
    - **Validates: Requirements 1.2, 1.6**

  - [ ]* 13.2 Write property test for Info tab content completeness (Property 2)
    - **Property 2: Info tab content completeness**
    - Generate random DiscoveryItem data, verify Info tab renders description, address, category, menu items, and events
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ]* 13.3 Write property test for Reviews tab content completeness (Property 3)
    - **Property 3: Reviews tab content completeness**
    - Generate random RatingData with 1–5 reviews, verify Reviews tab displays overall rating, review count, and all review fields
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 13.4 Write property test for Location tab data rendering (Property 4)
    - **Property 4: Location tab renders available data**
    - Generate random location data with non-null address, hours (7 days), and busy times, verify all render
    - **Validates: Requirements 4.3, 4.4, 4.6, 4.8**

  - [ ]* 13.5 Write property test for client deserialization round trip (Property 7)
    - **Property 7: Client deserialization round trip**
    - Generate random hours/busyTimes JSON, verify deserialization into typed interfaces preserves all fields
    - **Validates: Requirements 6.3, 6.4**

- [~] 14. Final checkpoint
  - Ensure all tests pass (`cd client && npx jest` and `cd tests/Wutsup.Api.Tests && dotnet test`), ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The API changes are implemented first to ensure the data layer is stable before building UI
- `react-native-maps` must be installed before the LocationTabContent component can be built
