# Requirements Document

## Introduction

The Discovery Results Feed feature populates the bottom half of the Dashboard screen with contextual results driven by the user's current position in the Drill Orb navigation menu. When the user opens the FAB and selects a category (e.g., Events), the feed displays discovery items from all visible child categories (Music, Sports, Arts, Comedy, Festivals, Networking). As the user drills deeper (e.g., Events → Music → Rock), the feed narrows to show only items matching that specific subcategory. The feature introduces a new `DiscoveryItem` data model, a query API endpoint, a mock data seeding system capable of generating hundreds to thousands of items, and a visually engaging card-based feed UI with map thumbnails, category badges, and location information.

## Glossary

- **Discovery_Item**: A single discoverable entity (event, restaurant, bar, activity, etc.) stored in the database and displayed in the results feed. Each item has a name, description, location, category linkage, and optional image.
- **Results_Feed**: The scrollable list of Discovery_Item cards rendered on the bottom half of the Dashboard screen when the Orb_Menu is active.
- **Discovery_Card**: A single visual card in the Results_Feed representing one Discovery_Item, showing name, description, location with map thumbnail, city name, and category badge.
- **Navigation_Node_ID**: The integer identifier of a node in the existing navigation tree, used to link Discovery_Items to categories.
- **Descendant_Nodes**: All nodes in the navigation tree that are children, grandchildren, or deeper descendants of a given node.
- **Discovery_API**: The ASP.NET Core Web API endpoints that query and return Discovery_Items based on navigation node context.
- **Mock_Data_Seeder**: The database migration or seed script that generates hundreds to thousands of realistic Discovery_Items across all categories.
- **Map_Thumbnail**: A small static map image displayed on a Discovery_Card showing the approximate location of the item.
- **Category_Badge**: A small label or tag on a Discovery_Card indicating which category the item belongs to.
- **Active_Feed_Node**: The navigation node currently determining which Discovery_Items appear in the Results_Feed — corresponds to the Active_Node in the Orb_Menu.

---

## Requirements

### Requirement 1: Discovery Item Data Model

**User Story:** As a developer, I want a flexible and extensible data model for discovery items, so that we can store events, restaurants, bars, activities, and other entities with a common structure that can grow over time.

#### Acceptance Criteria

1. THE Discovery_API SHALL store each Discovery_Item as a row in a `discovery_items` table with columns: `id` (integer, primary key), `name` (varchar, not null), `description` (text, not null), `latitude` (double precision, not null), `longitude` (double precision, not null), `city` (varchar, not null), `address` (varchar, nullable), `image_url` (varchar, nullable), `navigation_node_id` (integer, not null, foreign key to `navigation_nodes.id`), `metadata` (jsonb, nullable), `created_at` (timestamptz), and `updated_at` (timestamptz).
2. THE Discovery_API SHALL enforce a foreign key constraint on `navigation_node_id` referencing `navigation_nodes.id`, so that every Discovery_Item is linked to a valid category node.
3. THE Discovery_API SHALL apply an index on `navigation_node_id` to support efficient category-based lookups.
4. THE Discovery_API SHALL use a `metadata` column of type JSONB to store category-specific fields (such as event date, price range, cuisine type, or hours of operation), so that new fields can be added without schema migrations.
5. THE Discovery_API SHALL apply a composite index on `navigation_node_id` and `created_at` to support efficient paginated queries filtered by category.

---

### Requirement 2: Discovery Query API Endpoint

**User Story:** As a client developer, I want an API endpoint that returns discovery items for a given navigation node and all its descendants, so that the feed shows results matching the user's current drill-down level.

#### Acceptance Criteria

1. THE Discovery_API SHALL expose a `GET /api/discovery/items` endpoint that accepts a required query parameter `nodeId` (integer) representing the Navigation_Node_ID to query.
2. WHEN the `GET /api/discovery/items` endpoint is called with a valid `nodeId`, THE Discovery_API SHALL return all Discovery_Items linked to that node or any of its Descendant_Nodes.
3. THE Discovery_API SHALL support pagination via `page` (integer, default 1) and `pageSize` (integer, default 20, max 100) query parameters.
4. WHEN the `GET /api/discovery/items` endpoint is called, THE Discovery_API SHALL return a response with HTTP status 200 and a JSON body containing `items` (array of Discovery_Item objects), `totalCount` (integer), `page` (integer), and `pageSize` (integer).
5. IF the `GET /api/discovery/items` endpoint is called with a `nodeId` that does not exist in the navigation tree, THEN THE Discovery_API SHALL return HTTP status 404 with a descriptive error message.
6. THE Discovery_API SHALL return Discovery_Items ordered by `created_at` descending (newest first) by default.
7. THE Discovery_API SHALL return each Discovery_Item with fields: `id`, `name`, `description`, `latitude`, `longitude`, `city`, `address`, `imageUrl`, `navigationNodeId`, `categoryLabel` (the label of the linked navigation node), and `metadata`.

---

### Requirement 3: Mock Data Generation

**User Story:** As a developer, I want hundreds to thousands of realistic mock discovery items seeded across all categories, so that I can test scrolling performance, filtering behavior, and UI layout with production-like data volumes.

#### Acceptance Criteria

1. THE Mock_Data_Seeder SHALL generate at least 500 Discovery_Items distributed across all leaf-level navigation nodes in the tree.
2. THE Mock_Data_Seeder SHALL assign each generated Discovery_Item a realistic name, description, latitude, longitude, and city appropriate to its category (e.g., music venue names for Rock events, restaurant names for Italian restaurants).
3. THE Mock_Data_Seeder SHALL distribute items across geographic locations representing at least 3 distinct cities to test location-based display.
4. THE Mock_Data_Seeder SHALL populate the `metadata` JSONB field with category-appropriate data (e.g., `{"eventDate": "...", "venue": "..."}` for events, `{"cuisineType": "...", "priceRange": "..."}` for restaurants).
5. THE Mock_Data_Seeder SHALL be implemented as an EF Core migration so that mock data is available immediately after running migrations in the Local environment.
6. THE Mock_Data_Seeder SHALL assign image URLs using placeholder image services or static asset paths, so that the UI can render image thumbnails during development.

---

### Requirement 4: Results Feed UI — Layout and Positioning

**User Story:** As a user, I want to see discovery results on the bottom half of the dashboard when I open the navigation menu, so that I can browse what's available while navigating categories.

#### Acceptance Criteria

1. WHEN the Orb_Menu is open, THE Results_Feed SHALL render on the bottom half of the Dashboard screen, below the Orb_Menu area.
2. WHILE the Orb_Menu is closed, THE Results_Feed SHALL be hidden from the Dashboard screen.
3. THE Results_Feed SHALL be a vertically scrollable list that supports smooth scrolling through hundreds of items without performance degradation.
4. WHEN the Orb_Menu opens, THE Results_Feed SHALL animate into view with a slide-up or fade-in transition completing within 300 ms.
5. WHEN the Orb_Menu closes, THE Results_Feed SHALL animate out of view with a slide-down or fade-out transition completing within 300 ms.
6. THE Results_Feed SHALL display a loading indicator while Discovery_Items are being fetched from the API.
7. IF the Discovery_API returns zero items for the current Active_Feed_Node, THEN THE Results_Feed SHALL display an empty state message indicating no results were found for the selected category.

---

### Requirement 5: Discovery Card Design

**User Story:** As a user, I want each result displayed as an engaging card with the item's name, description, a map thumbnail showing its location, the city name, and a category badge, so that I can quickly assess whether an item interests me.

#### Acceptance Criteria

1. THE Discovery_Card SHALL display the Discovery_Item's name in a prominent font as the card title.
2. THE Discovery_Card SHALL display the Discovery_Item's description, truncated to a maximum of 2 lines with an ellipsis if it exceeds the available space.
3. THE Discovery_Card SHALL display a Map_Thumbnail showing the approximate location of the item, rendered as a static map image or map preview component.
4. THE Discovery_Card SHALL display the city name adjacent to or below the Map_Thumbnail.
5. THE Discovery_Card SHALL display a Category_Badge showing the label of the navigation node the item belongs to.
6. THE Discovery_Card SHALL display the Discovery_Item's image (when `imageUrl` is present) as a thumbnail on the card.
7. IF the Discovery_Item has no `imageUrl`, THEN THE Discovery_Card SHALL display a placeholder image or icon appropriate to the item's category.
8. THE Discovery_Card SHALL have an `accessibilityLabel` that includes the item name and category for screen reader users.

---

### Requirement 6: Feed Filtering by Navigation Context

**User Story:** As a user, I want the results feed to automatically update when I drill into a subcategory, so that I see only relevant items matching my current selection.

#### Acceptance Criteria

1. WHEN the Active_Node in the Orb_Menu changes, THE Results_Feed SHALL fetch and display Discovery_Items for the new Active_Feed_Node and all its Descendant_Nodes.
2. WHEN the user drills from a parent node to a child node, THE Results_Feed SHALL replace its contents with items matching the new narrower category scope.
3. WHEN the user navigates back to a parent node, THE Results_Feed SHALL replace its contents with items matching the broader parent category scope.
4. WHILE a new set of Discovery_Items is being fetched after a navigation change, THE Results_Feed SHALL display a loading indicator without clearing the previous results until the new data arrives.
5. THE Results_Feed SHALL reset its scroll position to the top when the Active_Feed_Node changes.

---

### Requirement 7: Client Discovery API Integration

**User Story:** As a client developer, I want a typed API client for the discovery endpoint, so that the feed can fetch items with proper error handling and type safety.

#### Acceptance Criteria

1. THE Client SHALL provide a `discoveryApi` service module that exposes a `getItems(nodeId: number, page?: number, pageSize?: number)` function returning a typed response with `items`, `totalCount`, `page`, and `pageSize`.
2. WHEN the `getItems` function receives a successful response, THE Client SHALL parse the response into typed `DiscoveryItem` objects.
3. IF the `getItems` function receives an error response, THEN THE Client SHALL throw a typed error containing the HTTP status code and error message.
4. THE Client SHALL provide a `useDiscoveryFeed` hook that manages fetching, pagination state, loading state, and error state for the Results_Feed.
5. WHEN the Active_Feed_Node changes, THE `useDiscoveryFeed` hook SHALL cancel any in-flight request and initiate a new fetch for the updated node.

---

### Requirement 8: Pagination and Infinite Scroll

**User Story:** As a user, I want the results feed to load more items as I scroll down, so that I can browse through large result sets without waiting for all items to load upfront.

#### Acceptance Criteria

1. WHEN the user scrolls to within 200 points of the bottom of the Results_Feed, THE `useDiscoveryFeed` hook SHALL fetch the next page of results automatically.
2. WHILE additional pages are being loaded, THE Results_Feed SHALL display a loading indicator at the bottom of the list.
3. WHEN all available pages have been loaded (total items reached), THE Results_Feed SHALL stop requesting additional pages.
4. IF a page fetch fails, THEN THE Results_Feed SHALL display a retry option at the bottom of the list allowing the user to re-attempt the failed page load.
5. THE Results_Feed SHALL append new page results to the existing list without re-rendering previously loaded items.

---

### Requirement 9: Discovery Item Response Serialization

**User Story:** As a developer, I want the API to serialize discovery items consistently, so that the client can reliably parse responses.

#### Acceptance Criteria

1. THE Discovery_API SHALL serialize all Discovery_Item responses using camelCase property names.
2. THE Discovery_API SHALL include a `categoryLabel` field in each Discovery_Item response derived from the linked navigation node's label.
3. THE Discovery_API SHALL serialize the `metadata` JSONB field as a JSON object in the response, preserving its structure without transformation.
4. FOR ALL valid Discovery_Items stored in the database, serializing to JSON and deserializing back SHALL produce an equivalent object (round-trip property).

