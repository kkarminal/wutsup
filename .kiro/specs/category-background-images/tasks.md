# Implementation Plan: Category Background Images

## Overview

This plan implements dynamic background images for navigation categories across the Wutsup platform. The work progresses from API data model changes through static file serving, mobile client integration, and admin portal management — each step building on the previous one.

## Tasks

- [x] 1. Extend NavigationNode model and create EF Core migration
  - [x] 1.1 Add BackgroundImageUrl property to NavigationNode entity
    - Add `public string? BackgroundImageUrl { get; set; }` to `api/Models/NavigationNode.cs`
    - Add EF Core column configuration in `AppDbContext.OnModelCreating` for `background_image_url` as `varchar(1000)`, nullable
    - _Requirements: 1.1_

  - [x] 1.2 Create EF Core migration for the new column
    - Generate migration adding `background_image_url` column to `navigation_nodes` table
    - Verify migration applies cleanly against the existing schema
    - _Requirements: 1.1_

- [x] 2. Update NavigationNodeDto and mapping logic
  - [x] 2.1 Add BackgroundImageUrl to NavigationNodeDto
    - Add `string? BackgroundImageUrl` parameter to the `NavigationNodeDto` record in `api/Models/NavigationNodeDto.cs`
    - Update the `ToDto` helper in `NavigationService.cs` to pass `node.BackgroundImageUrl` to the DTO constructor
    - _Requirements: 1.2, 1.3_

  - [x] 2.2 Write property test: DTO Mapping Preserves BackgroundImageUrl
    - **Property 1: DTO Mapping Preserves BackgroundImageUrl**
    - Add test to `tests/Wutsup.Api.Tests/NavigationServicePropertyTests.cs` (or a new `NavigationNodeDtoPropertyTests.cs`)
    - For any NavigationNode with any BackgroundImageUrl value (valid URL or null), mapping to DTO preserves the value
    - **Validates: Requirements 1.2, 1.3**

- [x] 3. Update API update endpoint to handle BackgroundImageUrl
  - [x] 3.1 Extend UpdateNavigationNodeRequest with BackgroundImageUrl fields
    - Add `string? BackgroundImageUrl` and `bool? UpdateBackgroundImageUrl` to `api/Models/UpdateNavigationNodeRequest.cs`
    - _Requirements: 5.1, 5.4_

  - [x] 3.2 Implement BackgroundImageUrl update logic in NavigationService
    - In `NavigationService.UpdateNodeAsync`, when `UpdateBackgroundImageUrl` is true:
      - If `BackgroundImageUrl` is non-null, validate it is a well-formed absolute HTTP/HTTPS URL using `Uri.TryCreate`
      - If valid, persist the value; if invalid, throw `ArgumentException`
      - If `BackgroundImageUrl` is null, clear the existing value
    - When `UpdateBackgroundImageUrl` is false or absent, leave existing value unchanged
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 3.3 Map ArgumentException to 400 in NavigationController
    - Add `catch (ArgumentException ex)` to the `UpdateNode` action in `NavigationController.cs` returning `BadRequest`
    - _Requirements: 5.6_

  - [x] 3.4 Write property test: BackgroundImageUrl Update Round-Trip
    - **Property 2: BackgroundImageUrl Update Round-Trip**
    - For any valid URL string or null, updating with `UpdateBackgroundImageUrl = true` and retrieving returns the same value
    - **Validates: Requirements 1.1, 5.2, 5.3**

  - [x] 3.5 Write property test: Omitted BackgroundImageUrl Preserves Existing Value
    - **Property 3: Omitted BackgroundImageUrl Field Preserves Existing Value**
    - For any node with an existing BackgroundImageUrl, updating with `UpdateBackgroundImageUrl` false/absent leaves value unchanged
    - **Validates: Requirements 5.4**

  - [x] 3.6 Write property test: Invalid URL Strings Are Rejected
    - **Property 4: Invalid URL Strings Are Rejected**
    - For any string that is not a well-formed absolute HTTP/HTTPS URL, updating with that value returns 400 and preserves existing value
    - **Validates: Requirements 5.5, 5.6**

- [x] 4. Checkpoint - Ensure API changes compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Configure static file serving and move images
  - [x] 5.1 Create wwwroot/images directory and move neon images
    - Create `api/wwwroot/images/` directory
    - Move `neon_concert_background.jpeg`, `neon_dancing_background.jpeg`, `neon_nightclub_background.jpeg`, `neon_sports_background.jpeg` from project root to `api/wwwroot/images/`
    - _Requirements: 2.1_

  - [x] 5.2 Configure static file middleware in Program.cs
    - Add `UseStaticFiles` with `PhysicalFileProvider` pointing to `wwwroot/images` and `RequestPath = "/images"`
    - Place the middleware call before `MapControllers()`
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Create seed data migration for initial background URLs
  - [x] 6.1 Create a data migration assigning BackgroundImageUrl to existing categories
    - Assign `/images/neon_concert_background.jpeg` to Events
    - Assign `/images/neon_nightclub_background.jpeg` to Nightlife
    - Assign `/images/neon_sports_background.jpeg` to Activities
    - Assign `/images/neon_dancing_background.jpeg` to Dancing
    - Use SQL UPDATE statements in the migration `Up` method
    - _Requirements: 1.1, 2.1_

- [x] 7. Checkpoint - Verify API serves images and seed data is correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create AnimatedBackground component in mobile client
  - [x] 8.1 Update client NavigationNodeDto interface
    - Add `backgroundImageUrl: string | null` to the `NavigationNodeDto` interface in `client/services/navigationApi.ts`
    - _Requirements: 1.2, 1.3_

  - [x] 8.2 Create AnimatedBackground component
    - Create `client/components/AnimatedBackground.tsx`
    - Accept `imageUrl: string | null` prop
    - Render absolutely-positioned full-screen image using `react-native-reanimated` for fade transitions
    - Crossfade between images (~300ms) when `imageUrl` changes
    - Fade out to transparent when `imageUrl` is null
    - Use `resizeMode="cover"` for full-screen coverage without distortion
    - Handle image load errors gracefully (fade out broken image)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Integrate AnimatedBackground into DashboardScreen
  - [x] 9.1 Wire AnimatedBackground into DashboardScreen
    - Import and render `AnimatedBackground` as the first child in the root `View` (positioned absolutely behind all content)
    - Pass `activeNode?.backgroundImageUrl ?? null` as the `imageUrl` prop
    - _Requirements: 3.1, 3.2_

- [x] 10. Checkpoint - Verify mobile client renders background images
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create CategoryManagementPage in admin portal
  - [x] 11.1 Add API client functions for navigation management
    - Add `getNavigationTree(token: string)` function to `admin/src/services/apiClient.ts`
    - Add `updateNavigationNode(token: string, id: number, request: UpdateNodeRequest)` function
    - Define `NavigationNodeDto` and `UpdateNodeRequest` interfaces in the admin client
    - Include JWT token in Authorization header for all requests
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.2_

  - [x] 11.2 Create CategoryManagementPage component
    - Create `admin/src/pages/CategoryManagementPage.tsx`
    - Fetch navigation tree on mount using `getNavigationTree`
    - Display flat list of all NavigationNodes with label, icon, and current BackgroundImageUrl status
    - Add "Edit" action per row to open a dialog for assigning/changing/removing the URL
    - Edit dialog: text input for URL, "Clear" button to remove, "Save" to persist
    - Call `updateNavigationNode` with `updateBackgroundImageUrl: true` on save
    - Show MUI Snackbar error on failed update; retain previous value
    - Redirect to login on 401 response
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.3_

- [x] 12. Add routing and navigation for CategoryManagementPage
  - [x] 12.1 Register /categories route in App.tsx
    - Add a protected route for `/categories` pointing to `CategoryManagementPage`
    - Add navigation link to the category management page from the dashboard or sidebar
    - _Requirements: 4.1, 6.1_

- [x] 13. Checkpoint - Verify admin portal category management works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Write property-based tests for admin portal
  - [x] 14.1 Write property test: Update request payload includes URL and flag
    - Create `admin/__tests__/properties/categoryManagement.property.test.ts`
    - **Property: For any valid URL string, the update request payload includes the URL and updateBackgroundImageUrl: true**
    - Use fast-check with `numRuns: 100`
    - **Validates: Requirements 4.2, 4.4, 5.1**

  - [x] 14.2 Write property test: All nodes rendered in management interface
    - **Property: For any node list returned by the API, all nodes are rendered in the management interface**
    - Use fast-check with `numRuns: 100`
    - **Validates: Requirements 4.1**

- [x] 15. Update CORS policy to allow PUT method
  - [x] 15.1 Add PUT to the CORS allowed methods in Program.cs
    - Update the `AdminPortalPolicy` CORS configuration to include `"PUT"` in `WithMethods`
    - Also add `"Authorization"` to `WithHeaders` for JWT token support
    - _Requirements: 5.1, 6.2_

- [x] 16. Final checkpoint - Ensure all tests pass across all projects
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major milestone
- Property tests validate universal correctness properties from the design document
- The implementation order ensures each step builds on the previous: data model → API logic → static files → mobile client → admin portal
