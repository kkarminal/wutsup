# Requirements Document

## Introduction

The Drill Orb Navigation feature replaces the current tab-strip dashboard with a single-page radial navigation experience. A Floating Action Button (FAB) sits at the dead centre of the landing screen. When tapped, it expands into a radial menu of top-level categories (Events, Food, Bars, etc.). Tapping any category node zooms it into the centre and reveals its subcategories in a new ring around it — creating the sensation of drilling into a map of options. Navigation history is tracked as a breadcrumb trail at the top of the screen, and users can navigate back by tapping the breadcrumb, pinching outward, or dragging the centre node backward.

The menu tree data is stored in PostgreSQL and served through a dedicated API, so new categories and subcategories can be added without a client release. Seed data provides a realistic starting tree for development and testing.

## Glossary

- **Drill_Orb**: The central interactive node that anchors the radial navigation system. At rest it is the FAB; once the menu is open it becomes the active category node.
- **Orb_Menu**: The full radial navigation overlay that appears when the Drill_Orb is activated.
- **Category_Node**: A single navigable item rendered as a circular node in the Orb_Menu. Each node has a label, an optional icon, and zero or more child nodes.
- **Root_Node**: The top-level Category_Node labelled "What's Up" that is displayed when the Orb_Menu first opens.
- **Category_Ring**: The ring of Category_Nodes arranged radially around the active Drill_Orb.
- **Active_Node**: The Category_Node currently occupying the centre position of the Orb_Menu.
- **Drill_Animation**: The zoom-and-morph transition played when the user taps a Category_Node to make it the new Active_Node.
- **Back_Animation**: The reverse zoom-and-morph transition played when the user navigates back to a parent node.
- **Breadcrumb_Trail**: The horizontal list of ancestor node labels rendered at the top of the Orb_Menu, representing the path from the Root_Node to the Active_Node.
- **Navigation_Tree**: The full hierarchical data structure of Category_Nodes stored in the database and served by the API.
- **Navigation_Tree_API**: The ASP.NET Core Web API endpoints that read and write the Navigation_Tree.
- **Orb_Controller**: The client-side service responsible for fetching the Navigation_Tree and managing drill-down state.
- **Pinch_Gesture**: A two-finger outward pinch gesture detected on the Orb_Menu.
- **Drag_Back_Gesture**: A drag gesture applied to the Active_Node that moves it backward (toward the previous parent position) to trigger back navigation.

---

## Requirements

### Requirement 1: Single-Page Landing Dashboard

**User Story:** As a user, I want the app to open to a single clean landing screen, so that I have one focused entry point without tabs or swipe panels.

#### Acceptance Criteria

1. THE Dashboard SHALL render as a single full-screen page with no tab bar, no swipe panels, and no bottom navigation strip.
2. THE Dashboard SHALL display the Drill_Orb as a circular FAB positioned at the horizontal and vertical centre of the screen.
3. WHILE the Orb_Menu is closed, THE Dashboard SHALL display only the Drill_Orb and the AppHeader, keeping the rest of the screen uncluttered.
4. THE Drill_Orb SHALL have an `accessibilityLabel` of "Open navigation menu" and an `accessibilityRole` of "button".
5. THE Dashboard SHALL be registered as the sole route rendered after the splash screen, replacing the previous tab-based layout.

---

### Requirement 2: Orb Menu Activation

**User Story:** As a user, I want to tap the central FAB to open a radial menu, so that I can explore available categories.

#### Acceptance Criteria

1. WHEN the user taps the Drill_Orb while the Orb_Menu is closed, THE Orb_Controller SHALL open the Orb_Menu and display the Root_Node as the Active_Node.
2. WHEN the Orb_Menu opens, THE Category_Ring SHALL display the direct children of the Root_Node as Category_Nodes arranged evenly around the Active_Node.
3. WHEN the Orb_Menu opens, THE Drill_Animation SHALL play an expand transition that completes within 350 ms.
4. WHEN the user taps the Active_Node while the Orb_Menu is open and the Active_Node is the Root_Node, THE Orb_Controller SHALL close the Orb_Menu and return to the resting FAB state.
5. WHEN the Orb_Menu closes, THE Back_Animation SHALL play a collapse transition that completes within 350 ms.
6. THE Orb_Menu SHALL render as a full-screen overlay above the Dashboard content.

---

### Requirement 3: Radial Category Layout

**User Story:** As a user, I want to see categories arranged in a circle around the central node, so that I can scan all options at a glance.

#### Acceptance Criteria

1. THE Category_Ring SHALL position each Category_Node at an equal angular interval around the Active_Node, such that the angles are evenly distributed across 360 degrees.
2. WHEN the Category_Ring contains N nodes, THE Category_Ring SHALL place each node at an angle of `(360 / N) * index` degrees from the top of the circle.
3. THE Category_Ring SHALL render each Category_Node at a fixed radial distance from the Active_Node, so that all nodes lie on a circle of equal radius.
4. WHEN a Category_Node has no children, THE Category_Ring SHALL render that node with a visual indicator (such as a distinct colour or icon) distinguishing it as a leaf node.
5. THE Category_Ring SHALL display each Category_Node's label below or inside the node circle in a legible font size of at least 11 sp.
6. THE Category_Ring SHALL be accessible, with each Category_Node providing an `accessibilityLabel` equal to the node's label and an `accessibilityRole` of "button".

---

### Requirement 4: Drill-Down Navigation

**User Story:** As a user, I want to tap a category node to zoom into it and see its subcategories, so that I can explore deeper levels without leaving the screen.

#### Acceptance Criteria

1. WHEN the user taps a Category_Node that has children, THE Orb_Controller SHALL set that node as the new Active_Node and display its children in the Category_Ring.
2. WHEN the Active_Node changes, THE Drill_Animation SHALL play a zoom-in transition where the tapped node moves to the centre and the previous ring fades out, completing within 400 ms.
3. WHEN the Active_Node changes, THE Breadcrumb_Trail SHALL update to append the new Active_Node's label to the trail.
4. WHEN the user taps a Category_Node that has no children (a leaf node), THE Orb_Controller SHALL emit a selection event containing the selected node's id and label, and the Orb_Menu SHALL close.
5. WHILE a Drill_Animation is in progress, THE Orb_Controller SHALL ignore additional tap gestures on Category_Nodes to prevent double-navigation.
6. THE Orb_Controller SHALL support Navigation_Tree depths of at least 5 levels without layout degradation.

---

### Requirement 5: Back Navigation

**User Story:** As a user, I want to navigate back to a parent category using a pinch, breadcrumb tap, or drag gesture, so that I can correct my path without closing the menu.

#### Acceptance Criteria

1. WHEN the user performs a Pinch_Gesture on the Orb_Menu, THE Orb_Controller SHALL navigate back to the parent of the current Active_Node.
2. WHEN the user taps a label in the Breadcrumb_Trail, THE Orb_Controller SHALL navigate directly to the tapped ancestor node, making it the new Active_Node.
3. WHEN the user performs a Drag_Back_Gesture on the Active_Node and drags it at least 40 points toward the previous parent position, THE Orb_Controller SHALL navigate back to the parent of the current Active_Node.
4. WHEN back navigation is triggered and the Active_Node is the Root_Node, THE Orb_Controller SHALL close the Orb_Menu instead of navigating further back.
5. WHEN back navigation is triggered, THE Back_Animation SHALL play a zoom-out transition where the current Active_Node shrinks back to its ring position and the parent node expands to the centre, completing within 400 ms.
6. WHEN back navigation is triggered, THE Breadcrumb_Trail SHALL remove the last label from the trail.
7. WHILE a Back_Animation is in progress, THE Orb_Controller SHALL ignore additional back-navigation gestures.

---

### Requirement 6: Navigation Tree API

**User Story:** As a developer, I want a REST API to read and manage the navigation tree, so that categories can be updated without a client release.

#### Acceptance Criteria

1. THE Navigation_Tree_API SHALL expose a `GET /api/navigation/tree` endpoint that returns the full Navigation_Tree as a nested JSON structure.
2. WHEN the `GET /api/navigation/tree` endpoint is called, THE Navigation_Tree_API SHALL return a response with HTTP status 200 and a JSON body containing all Category_Nodes with their id, label, icon, parentId, sortOrder, and children array.
3. THE Navigation_Tree_API SHALL expose a `POST /api/navigation/nodes` endpoint that creates a new Category_Node given a label, optional icon, parentId (null for root), and sortOrder.
4. WHEN a valid `POST /api/navigation/nodes` request is received, THE Navigation_Tree_API SHALL persist the new node to the database and return HTTP status 201 with the created node's id, label, icon, parentId, and sortOrder.
5. IF a `POST /api/navigation/nodes` request is received with a missing or empty label, THEN THE Navigation_Tree_API SHALL return HTTP status 400 with a descriptive error message.
6. IF a `POST /api/navigation/nodes` request is received with a parentId that does not exist in the database, THEN THE Navigation_Tree_API SHALL return HTTP status 404 with a descriptive error message.
7. THE Navigation_Tree_API SHALL expose a `PUT /api/navigation/nodes/{id}` endpoint that updates the label, icon, or sortOrder of an existing Category_Node.
8. IF a `PUT /api/navigation/nodes/{id}` request is received with an id that does not exist, THEN THE Navigation_Tree_API SHALL return HTTP status 404 with a descriptive error message.
9. THE Navigation_Tree_API SHALL expose a `DELETE /api/navigation/nodes/{id}` endpoint that removes a Category_Node and all of its descendants from the database.
10. IF a `DELETE /api/navigation/nodes/{id}` request is received with an id that does not exist, THEN THE Navigation_Tree_API SHALL return HTTP status 404 with a descriptive error message.

---

### Requirement 7: Navigation Tree Data Model

**User Story:** As a developer, I want the navigation tree stored in a relational database with a self-referencing parent-child structure, so that the tree can be queried and modified efficiently.

#### Acceptance Criteria

1. THE Navigation_Tree_API SHALL store each Category_Node as a row in a `navigation_nodes` table with columns: `id` (integer, primary key), `label` (varchar, not null), `icon` (varchar, nullable), `parent_id` (integer, nullable, foreign key to `navigation_nodes.id`), `sort_order` (integer, not null, default 0), `created_at` (timestamptz), and `updated_at` (timestamptz).
2. THE Navigation_Tree_API SHALL enforce a foreign key constraint on `parent_id` referencing `navigation_nodes.id` with cascade delete, so that deleting a parent node automatically removes all descendants.
3. THE Navigation_Tree_API SHALL seed the `navigation_nodes` table with a default tree on first migration, containing at minimum: a Root_Node labelled "What's Up" with children Events, Food, Bars, and Activities; Events with children Music, Sports, and Arts; Food with children Restaurants, Cafes, and Food Trucks; Bars with children Cocktail Bars, Sports Bars, and Breweries; Activities with children Outdoor, Classes, and Entertainment.
4. THE Navigation_Tree_API SHALL apply an index on `parent_id` to support efficient child-node lookups.

---

### Requirement 8: Client Navigation Tree Fetching

**User Story:** As a user, I want the radial menu to load its categories from the server, so that the menu reflects the latest content without requiring an app update.

#### Acceptance Criteria

1. WHEN the Dashboard mounts, THE Orb_Controller SHALL fetch the Navigation_Tree from `GET /api/navigation/tree` and cache the result in memory for the lifetime of the session.
2. WHILE the Navigation_Tree is being fetched, THE Drill_Orb SHALL display a loading indicator in place of its default icon.
3. IF the Navigation_Tree fetch fails, THEN THE Orb_Controller SHALL display an error state on the Drill_Orb with an `accessibilityLabel` of "Navigation unavailable, tap to retry" and SHALL retry the fetch when the user taps the Drill_Orb.
4. WHEN the Navigation_Tree fetch succeeds, THE Drill_Orb SHALL return to its default interactive state and the Orb_Menu SHALL be ready to open.
5. THE Orb_Controller SHALL parse the Navigation_Tree response into an in-memory tree structure that supports O(1) node lookup by id.

---

### Requirement 9: Animations and Motion

**User Story:** As a user, I want the drill-down and back animations to feel smooth and satisfying, so that navigating the menu is an enjoyable experience.

#### Acceptance Criteria

1. THE Drill_Animation and Back_Animation SHALL run on the native UI thread using React Native Reanimated, so that animations are not blocked by JavaScript execution.
2. THE Drill_Animation SHALL animate the tapped Category_Node scaling from its ring position to the centre of the screen while simultaneously fading out the other ring nodes.
3. THE Back_Animation SHALL animate the Active_Node scaling down from the centre back to its ring position while simultaneously fading in the parent's ring nodes.
4. WHERE the device has enabled the "Reduce Motion" accessibility setting, THE Orb_Menu SHALL substitute all Drill_Animations and Back_Animations with a cross-fade transition of no more than 200 ms.
5. WHILE any animation is in progress, THE Orb_Controller SHALL suppress all gesture input to prevent conflicting transitions.

---

### Requirement 10: Accessibility

**User Story:** As a user with accessibility needs, I want the Drill Orb navigation to be usable with screen readers and motion-reduction settings, so that I am not excluded from the core navigation experience.

#### Acceptance Criteria

1. THE Drill_Orb SHALL expose `accessibilityRole="button"` and a descriptive `accessibilityLabel` at all times.
2. THE Category_Ring SHALL expose each Category_Node with `accessibilityRole="button"` and an `accessibilityLabel` equal to the node's label.
3. THE Breadcrumb_Trail SHALL expose each breadcrumb item with `accessibilityRole="button"` and an `accessibilityLabel` of "Navigate back to [label]".
4. WHERE the device has enabled the "Reduce Motion" accessibility setting, THE Orb_Menu SHALL replace zoom animations with cross-fade transitions as specified in Requirement 9.4.
5. THE Orb_Menu SHALL be dismissible via the device back button (Android) and a close gesture, with the dismissal action announced to screen readers.
