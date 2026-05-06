# Requirements Document

## Introduction

This feature enhances the expanded/detail view of discovery cards by organizing richer information into a tabbed interface. Currently, the expanded card view only displays reviews, menu metadata, and event metadata in a flat list. This feature introduces a tab-based navigation system within the expanded card, adding new content sections including a detailed description, location with map view, hours of operation, and busy times. The Google Places API integration will be extended to fetch the additional data (hours and busy times), and the client will present all content in clearly organized, switchable tabs.

## Glossary

- **Expanded_Card_View**: The detail section rendered when a user taps a discovery card to expand it, showing additional information beyond the card summary.
- **Tab_Bar**: A horizontal row of selectable tab labels within the expanded card view that allows the user to switch between content sections.
- **Active_Tab**: The currently selected tab whose content panel is visible to the user.
- **Info_Tab**: The tab displaying the full description, address, and general details about a discovery item.
- **Reviews_Tab**: The tab displaying user reviews and ratings for a discovery item.
- **Location_Tab**: The tab displaying a map view, address, operating hours, and busy times for a discovery item.
- **Hours_Data**: Structured data representing the days and times a place is open, retrieved from the Google Places API.
- **Busy_Times_Data**: Structured data representing the relative popularity of a place at different times of day, retrieved from the Google Places API.
- **Places_Client**: The server-side service that communicates with the Google Places API to fetch place details.
- **Discovery_API_Client**: The client-side service that fetches discovery item data from the Wutsup API.
- **Map_View**: A visual map component centered on a geographic coordinate, showing the location of a discovery item.

## Requirements

### Requirement 1: Tab Bar Navigation

**User Story:** As a user, I want to see organized tabs when I expand a discovery card, so that I can quickly navigate to the specific information I'm interested in.

#### Acceptance Criteria

1. WHEN a discovery card is expanded, THE Tab_Bar SHALL render a horizontal row of tab labels within the Expanded_Card_View.
2. WHEN the user taps a tab label, THE Tab_Bar SHALL set that tab as the Active_Tab and display its corresponding content panel.
3. THE Tab_Bar SHALL display the following tabs in order: "Info", "Reviews", "Location".
4. WHEN a discovery card is expanded, THE Tab_Bar SHALL set "Info" as the default Active_Tab.
5. THE Tab_Bar SHALL visually distinguish the Active_Tab from inactive tabs using the theme's primary color for the active indicator.
6. WHILE a tab is the Active_Tab, THE Expanded_Card_View SHALL display only the content panel associated with that tab.

### Requirement 2: Info Tab Content

**User Story:** As a user, I want to see a detailed description and key details about a place when I expand its card, so that I can decide if it interests me.

#### Acceptance Criteria

1. WHEN the Info_Tab is the Active_Tab, THE Expanded_Card_View SHALL display the full description of the discovery item without line truncation.
2. WHEN the Info_Tab is the Active_Tab, THE Expanded_Card_View SHALL display the address of the discovery item.
3. WHEN the Info_Tab is the Active_Tab, THE Expanded_Card_View SHALL display the category label of the discovery item.
4. WHEN the discovery item has menu metadata, THE Info_Tab SHALL display the menu items with names and prices.
5. WHEN the discovery item has event metadata, THE Info_Tab SHALL display the event details including name, date, and description.

### Requirement 3: Reviews Tab Content

**User Story:** As a user, I want to read reviews from other people about a place, so that I can gauge the quality of the experience.

#### Acceptance Criteria

1. WHEN the Reviews_Tab is the Active_Tab, THE Expanded_Card_View SHALL display up to five reviews including author name, individual rating, review text, and relative time description.
2. WHEN the Reviews_Tab is the Active_Tab, THE Expanded_Card_View SHALL display the overall rating and total review count at the top of the section.
3. IF the discovery item has no rating data, THEN THE Reviews_Tab SHALL display a message indicating that no reviews are available.

### Requirement 4: Location Tab Content

**User Story:** As a user, I want to see where a place is located on a map along with its hours and busy times, so that I can plan my visit.

#### Acceptance Criteria

1. WHEN the Location_Tab is the Active_Tab, THE Expanded_Card_View SHALL display a Map_View centered on the discovery item's latitude and longitude coordinates.
2. WHEN the Location_Tab is the Active_Tab, THE Expanded_Card_View SHALL display a marker on the Map_View at the discovery item's coordinates.
3. WHEN the Location_Tab is the Active_Tab, THE Expanded_Card_View SHALL display the full address text below the Map_View.
4. WHEN the Location_Tab is the Active_Tab, THE Expanded_Card_View SHALL display the city name below the address.
5. IF the discovery item has no address, THEN THE Location_Tab SHALL display only the city name and the Map_View.
6. WHEN Hours_Data is available, THE Location_Tab SHALL display the operating hours for each day of the week below the address section.
7. THE Location_Tab SHALL highlight the current day's hours in the weekly schedule using the theme's primary color.
8. WHEN Busy_Times_Data is available, THE Location_Tab SHALL display a visual representation of busy times for the current day below the hours section.
9. IF Hours_Data is not available for a discovery item, THEN THE Location_Tab SHALL omit the hours section without showing an error.
10. IF Busy_Times_Data is not available for a discovery item, THEN THE Location_Tab SHALL omit the busy times section without showing an error.

### Requirement 5: Extended Places API Data Retrieval

**User Story:** As a developer, I want the API to fetch hours of operation and busy times from Google Places, so that the client can display this information.

#### Acceptance Criteria

1. WHEN the Places_Client fetches place details, THE Places_Client SHALL request the opening_hours and current_opening_hours fields from the Google Places API.
2. WHEN the Google Places API returns opening hours data, THE Places_Client SHALL parse the weekday text array into structured Hours_Data.
3. WHEN the Google Places API returns popular times data, THE Places_Client SHALL parse the data into structured Busy_Times_Data with hour and relative popularity percentage.
4. IF the Google Places API does not return hours data for a place, THEN THE Places_Client SHALL return null for the Hours_Data field.
5. IF the Google Places API does not return busy times data for a place, THEN THE Places_Client SHALL return null for the Busy_Times_Data field.
6. THE Places_Client SHALL include hours and busy times data in the enriched discovery item response alongside existing rating and review data.

### Requirement 6: Client Data Model Extension

**User Story:** As a developer, I want the client data model to include hours and busy times, so that the UI components can render this information.

#### Acceptance Criteria

1. THE Discovery_API_Client SHALL define a typed interface for Hours_Data containing an array of day-of-week entries with day name and hours text.
2. THE Discovery_API_Client SHALL define a typed interface for Busy_Times_Data containing an array of hourly entries with hour number and popularity percentage.
3. WHEN the API response includes hours data, THE Discovery_API_Client SHALL deserialize the hours data into the typed Hours_Data interface.
4. WHEN the API response includes busy times data, THE Discovery_API_Client SHALL deserialize the busy times data into the typed Busy_Times_Data interface.
5. IF the API response does not include hours or busy times data, THEN THE Discovery_API_Client SHALL set the corresponding fields to null.

### Requirement 7: Tab Content Transition Animation

**User Story:** As a user, I want smooth transitions when switching between tabs, so that the experience feels polished and responsive.

#### Acceptance Criteria

1. WHEN the user switches the Active_Tab, THE Expanded_Card_View SHALL animate the content panel transition using a fade effect with a duration of 200 milliseconds.
2. THE Tab_Bar SHALL animate the active indicator position when the Active_Tab changes.
3. WHILE a tab transition animation is in progress, THE Tab_Bar SHALL remain interactive and accept new tab selections.

### Requirement 8: Local Development Mock Data

**User Story:** As a developer, I want realistic mock data for hours, busy times, and extended place details in local development, so that I can build and test the UI without a real Google Places API key.

#### Acceptance Criteria

1. WHEN the FakePlacesClient is active (no real API key configured), THE FakePlacesClient SHALL generate deterministic mock Hours_Data for each discovery item with realistic weekday hours (e.g., "9:00 AM – 10:00 PM").
2. WHEN the FakePlacesClient is active, THE FakePlacesClient SHALL generate deterministic mock Busy_Times_Data for each discovery item with hourly popularity percentages that follow a realistic bell-curve pattern (low in early morning, peak at lunch/dinner, low at night).
3. THE FakePlacesClient SHALL vary the generated hours across items so that some items appear as "Open 24 hours", some have standard business hours, and some have split hours (e.g., closed between lunch and dinner).
4. THE FakePlacesClient SHALL generate some items with null Hours_Data and null Busy_Times_Data to test the graceful omission behavior in the Location tab.
5. THE FakePlacesClient SHALL use the item name as a deterministic seed so that the same item always produces the same mock data across requests.
