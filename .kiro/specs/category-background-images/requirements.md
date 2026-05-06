# Requirements Document

## Introduction

This feature adds dynamic background images to navigation categories in the Wutsup mobile app. When a user selects a category via the Drill Orb navigation, the page background animates to display a background image associated with that category. Background images are stored as URLs on NavigationNode records in the database and can be managed (assigned, changed, removed) by administrators through the admin portal.

## Glossary

- **Navigation_Node**: A category entry in the hierarchical navigation tree, stored in the database with properties including label, icon, parent reference, and sort order.
- **Background_Image_URL**: A URL string stored on a Navigation_Node that points to the image file to be displayed as the page background when that category is active.
- **Mobile_Client**: The React Native/Expo mobile application used by end users to browse categories and discover content.
- **Admin_Portal**: The React/Vite web application used by authenticated administrators to manage application content.
- **Drill_Orb**: The circular navigation component in the Mobile_Client that allows users to drill into category hierarchies.
- **API**: The ASP.NET Core Web API that serves data to both the Mobile_Client and Admin_Portal.
- **Static_File_Server**: The mechanism by which the API serves image files from a designated directory on disk.

## Requirements

### Requirement 1: Store Background Image URL on Navigation Node

**User Story:** As a system administrator, I want background image URLs stored on navigation nodes in the database, so that images can be dynamically associated with categories without code changes.

#### Acceptance Criteria

1. THE Navigation_Node SHALL include an optional Background_Image_URL property that stores a URL string or null.
2. WHEN a Navigation_Node has a Background_Image_URL value, THE API SHALL include the Background_Image_URL in the navigation tree response DTO.
3. WHEN a Navigation_Node has no Background_Image_URL value, THE API SHALL return null for the Background_Image_URL field in the navigation tree response DTO.

### Requirement 2: Serve Background Images via Static Files

**User Story:** As a developer, I want background images served from the API as static files, so that the Mobile_Client and Admin_Portal can load them via URL without external hosting dependencies.

#### Acceptance Criteria

1. THE API SHALL serve image files from a designated static files directory accessible via HTTP GET requests.
2. WHEN a valid image file path is requested, THE Static_File_Server SHALL return the image with the appropriate content type header.
3. IF a requested image file does not exist, THEN THE Static_File_Server SHALL return a 404 Not Found response.

### Requirement 3: Display Background Image on Category Selection

**User Story:** As a mobile user, I want to see a background image appear when I select a category, so that the browsing experience feels immersive and visually engaging.

#### Acceptance Criteria

1. WHEN a user selects a Navigation_Node that has a Background_Image_URL, THE Mobile_Client SHALL animate the page background to display the associated image.
2. WHEN a user selects a Navigation_Node that does not have a Background_Image_URL, THE Mobile_Client SHALL display the default background without any image.
3. WHEN the background image transitions between categories, THE Mobile_Client SHALL animate the transition with a fade effect.
4. WHILE a background image is displayed, THE Mobile_Client SHALL render the image to cover the full screen area without distortion.

### Requirement 4: Admin Portal Background Image Management

**User Story:** As an administrator, I want to assign, change, and remove background images for categories through the admin portal, so that I can control the visual experience without developer intervention.

#### Acceptance Criteria

1. WHILE an administrator is authenticated, THE Admin_Portal SHALL display a category management interface listing all Navigation_Nodes with their current Background_Image_URL status.
2. WHEN an administrator assigns a Background_Image_URL to a Navigation_Node, THE Admin_Portal SHALL send an update request to the API and reflect the change in the interface.
3. WHEN an administrator removes a Background_Image_URL from a Navigation_Node, THE Admin_Portal SHALL send an update request setting the value to null and reflect the removal in the interface.
4. WHEN an administrator changes the Background_Image_URL of a Navigation_Node, THE Admin_Portal SHALL send an update request with the new URL and reflect the updated value in the interface.
5. IF the update request fails, THEN THE Admin_Portal SHALL display an error message to the administrator and retain the previous value in the interface.

### Requirement 5: API Update Endpoint Supports Background Image URL

**User Story:** As a system component, I want the navigation node update endpoint to accept background image URL changes, so that the admin portal can manage background images through the existing API.

#### Acceptance Criteria

1. THE API SHALL accept an optional Background_Image_URL field in the update navigation node request body.
2. WHEN the update request includes a non-null Background_Image_URL value, THE API SHALL persist the value on the Navigation_Node record.
3. WHEN the update request includes a null Background_Image_URL value, THE API SHALL clear the existing Background_Image_URL on the Navigation_Node record.
4. WHEN the update request omits the Background_Image_URL field, THE API SHALL leave the existing Background_Image_URL unchanged.
5. WHILE processing an update request, THE API SHALL validate that the Background_Image_URL, if provided, is a well-formed URL string.
6. IF the Background_Image_URL is not a well-formed URL string, THEN THE API SHALL return a 400 Bad Request response with a descriptive error message.

### Requirement 6: Admin Portal Authentication for Image Management

**User Story:** As a system administrator, I want background image management to require authentication, so that only authorized users can modify category visuals.

#### Acceptance Criteria

1. IF an unauthenticated user attempts to access the category management interface, THEN THE Admin_Portal SHALL redirect the user to the login page.
2. WHILE an administrator is authenticated, THE Admin_Portal SHALL include the JWT token in all API requests for background image management.
3. IF the API returns a 401 Unauthorized response during a background image update, THEN THE Admin_Portal SHALL redirect the administrator to the login page.
