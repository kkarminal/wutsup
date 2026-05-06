# Requirements Document

## Introduction

This feature enhances the existing discovery system with star ratings, user reviews from Google Places API, expandable result cards with rich detail views, and a view toggle allowing users to switch between a flat list and a swipeable carousel. A server-side caching layer minimizes external API calls to Google Places.

## Glossary

- **Discovery_Card**: The UI component that renders a single discovery item in the results feed
- **Rating_Service**: The API-side service responsible for fetching, caching, and serving Google Places rating and review data
- **Cache_Store**: The server-side storage layer that persists Google Places responses to reduce external API calls
- **Places_Client**: The API-side HTTP client that communicates with the Google Places API
- **Star_Rating_Display**: The client-side component that renders a 0–5 star rating visually
- **Expanded_Card_View**: The detailed view shown when a user expands a Discovery_Card
- **View_Toggle**: The UI control that switches between list view and carousel view
- **Results_Carousel**: The horizontal swipeable view that displays one Discovery_Card at a time
- **Results_List**: The current vertical scrollable flat list of Discovery_Cards
- **TTL**: Time-to-live; the duration a cached entry remains valid before requiring a refresh

## Requirements

### Requirement 1: Fetch Ratings and Reviews from Google Places API

**User Story:** As a user, I want to see real ratings and reviews for discovery items, so that I can make informed decisions about where to go.

#### Acceptance Criteria

1. WHEN a discovery item is requested with ratings, THE Places_Client SHALL query the Google Places API using the item name and coordinates to resolve a place ID
2. WHEN a place ID is resolved, THE Places_Client SHALL retrieve the overall star rating (0–5 scale) and up to 5 of the most helpful reviews for that place
3. IF the Google Places API returns an error or times out, THEN THE Rating_Service SHALL return the discovery item without rating data and log the failure
4. IF no matching place is found in Google Places, THEN THE Rating_Service SHALL return a null rating for that discovery item

### Requirement 2: Cache Google Places Responses

**User Story:** As a system operator, I want Google Places responses to be cached, so that the application minimizes external API calls and stays within rate limits.

#### Acceptance Criteria

1. WHEN the Rating_Service receives a rating request for a discovery item, THE Cache_Store SHALL check for an existing cached entry before calling the Places_Client
2. WHILE a cached entry exists and its TTL has not expired, THE Rating_Service SHALL return the cached rating and reviews without calling the Places_Client
3. WHEN a cached entry has expired or does not exist, THE Rating_Service SHALL call the Places_Client and store the response in the Cache_Store with a configurable TTL
4. THE Cache_Store SHALL key cached entries by discovery item ID
5. IF the Cache_Store is unreachable, THEN THE Rating_Service SHALL fall back to calling the Places_Client directly and log the cache failure

### Requirement 3: Display Star Rating on Discovery Card

**User Story:** As a user, I want to see a star rating on each discovery card, so that I can quickly assess the quality of a place at a glance.

#### Acceptance Criteria

1. WHEN a discovery item has a rating value, THE Star_Rating_Display SHALL render filled, half-filled, and empty star icons to represent the rating on a 0–5 scale
2. WHEN a discovery item has a rating value, THE Star_Rating_Display SHALL display the numeric rating value next to the stars
3. WHILE a discovery item has no rating data available, THE Discovery_Card SHALL omit the star rating section rather than showing empty stars
4. THE Star_Rating_Display SHALL support accessibility by providing a text label describing the rating value (e.g., "Rated 4.3 out of 5 stars")

### Requirement 4: Expandable Discovery Card

**User Story:** As a user, I want to expand a discovery card to see more details like reviews, menus, and events, so that I can learn more without leaving the results feed.

#### Acceptance Criteria

1. WHEN a user taps on a Discovery_Card, THE Discovery_Card SHALL expand to reveal the Expanded_Card_View with additional details
2. WHEN a Discovery_Card is expanded, THE Expanded_Card_View SHALL display the top reviews retrieved from Google Places
3. WHERE a discovery item has menu metadata, THE Expanded_Card_View SHALL display the menu information
4. WHERE a discovery item has event metadata, THE Expanded_Card_View SHALL display upcoming events
5. WHEN a user taps on an expanded Discovery_Card, THE Discovery_Card SHALL collapse back to its compact state
6. THE Expanded_Card_View SHALL animate its expand and collapse transitions over a duration of 300 milliseconds
7. WHILE a Discovery_Card is expanded, THE Results_List or Results_Carousel SHALL allow only one card to be expanded at a time, collapsing any previously expanded card

### Requirement 5: View Toggle Between List and Carousel

**User Story:** As a user, I want to switch between a list view and a carousel view, so that I can browse results in the format I prefer.

#### Acceptance Criteria

1. THE View_Toggle SHALL display two options: list view and carousel view
2. WHEN the user selects list view, THE Results_List SHALL display discovery items as a vertical scrollable flat list (current behavior)
3. WHEN the user selects carousel view, THE Results_Carousel SHALL display one discovery item at a time with horizontal swipe gestures to navigate between items
4. WHEN the user swipes left on the Results_Carousel, THE Results_Carousel SHALL animate to the next discovery item
5. WHEN the user swipes right on the Results_Carousel, THE Results_Carousel SHALL animate to the previous discovery item
6. THE View_Toggle SHALL persist the user's selected view mode for the duration of the session
7. THE View_Toggle SHALL default to list view when no prior selection exists
8. WHILE in carousel view, THE Results_Carousel SHALL support infinite scroll by loading the next page when the user reaches the last loaded item
9. WHILE in carousel view, EACH Discovery_Card SHALL display all details that would appear in both the collapsed and expanded states, including star rating, reviews, menu information, and event metadata, without requiring the user to tap to expand

### Requirement 6: API Endpoint for Ratings and Reviews

**User Story:** As a client application, I want an API endpoint that returns discovery items enriched with rating and review data, so that the mobile app can display this information.

#### Acceptance Criteria

1. THE Rating_Service SHALL expose rating and review data as part of the existing discovery items response DTO
2. WHEN the discovery items endpoint is called, THE Rating_Service SHALL enrich each item with its cached rating and reviews
3. THE Rating_Service SHALL include the following fields in the response: overall rating (number, 0–5), review count (number), and a list of up to 5 reviews each containing author name, rating, text, and relative time description
4. IF rating data is not available for an item, THEN THE Rating_Service SHALL return null for the rating fields without failing the entire request
