# Design Document: Category Background Images

## Overview

This feature adds dynamic background images to navigation categories across the Wutsup platform. The system extends the existing `NavigationNode` data model with an optional `BackgroundImageUrl` property, serves image assets as static files from the API, and integrates background image display into both the mobile client (with animated fade transitions) and the admin portal (with a management interface for assigning/removing images).

The design leverages the existing navigation tree infrastructure — the `NavigationNode` entity, `NavigationNodeDto`, `NavigationService`, and `NavigationController` — adding the new field through an EF Core migration and extending the existing update endpoint to handle URL assignment and validation.

## Architecture

```mermaid
graph TD
    subgraph API ["ASP.NET Core API"]
        SF[Static File Middleware]
        NC[NavigationController]
        NS[NavigationService]
        DB[(PostgreSQL)]
        IMG[/images/ directory]
    end

    subgraph Admin ["Admin Portal (React)"]
        CMP[CategoryManagementPage]
        AC[apiClient]
    end

    subgraph Mobile ["Mobile Client (React Native)"]
        DS[DashboardScreen]
        BG[AnimatedBackground]
        OC[useOrbController]
    end

    CMP -->|PUT /api/navigation/nodes/:id| AC
    AC -->|HTTP + JWT| NC
    NC --> NS
    NS --> DB

    OC -->|GET /api/navigation/tree| NC
    DS --> BG
    BG -->|GET /images/:filename| SF
    SF --> IMG

    CMP -->|preview| SF
```

### Key Design Decisions

1. **Static files over cloud storage**: Background images are served directly from the API's filesystem via ASP.NET Core's `UseStaticFiles` middleware. This avoids external dependencies (S3, CDN) for the initial implementation while keeping the URL-based approach compatible with a future migration to cloud storage.

2. **URL stored on NavigationNode**: The `BackgroundImageUrl` is a nullable string on the entity. This keeps the schema simple and allows URLs to point to either local static files or external sources in the future.

3. **Absent vs null distinction in updates**: The `UpdateNavigationNodeRequest` uses a sentinel pattern (a wrapper or explicit "include" flag) to distinguish between "field not provided" (leave unchanged) and "field explicitly set to null" (clear the value). This is implemented using a nullable `string?` property with a separate `bool` to indicate presence.

4. **Fade animation on mobile**: The mobile client uses `react-native-reanimated` (already in the project) to animate background opacity transitions. A crossfade approach renders two `Animated.Image` layers, fading the new image in while fading the old one out.

## Components and Interfaces

### API Layer

#### Updated Model: `NavigationNode`

```csharp
public class NavigationNode
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? BackgroundImageUrl { get; set; }  // NEW
    public int? ParentId { get; set; }
    public NavigationNode? Parent { get; set; }
    public ICollection<NavigationNode> Children { get; set; } = new List<NavigationNode>();
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
```

#### Updated DTO: `NavigationNodeDto`

```csharp
public record NavigationNodeDto(
    int Id,
    string Label,
    string? Icon,
    string? BackgroundImageUrl,  // NEW
    int? ParentId,
    int SortOrder,
    List<NavigationNodeDto> Children
);
```

#### Updated Request: `UpdateNavigationNodeRequest`

```csharp
public record UpdateNavigationNodeRequest(
    string? Label,
    string? Icon,
    int? SortOrder,
    string? BackgroundImageUrl,       // NEW — the URL value
    bool? UpdateBackgroundImageUrl    // NEW — true = apply the value (even if null), absent/false = leave unchanged
);
```

The `UpdateBackgroundImageUrl` flag resolves the ambiguity between "not provided" and "set to null":
- If `UpdateBackgroundImageUrl` is `true`, the service writes `BackgroundImageUrl` (which may be null to clear it).
- If `UpdateBackgroundImageUrl` is `false` or absent, the existing value is preserved.

#### URL Validation

The `NavigationService.UpdateNodeAsync` method validates `BackgroundImageUrl` when `UpdateBackgroundImageUrl` is true and the value is non-null:
- Must be a well-formed absolute URI (using `Uri.TryCreate` with `UriKind.Absolute`)
- Must use `http` or `https` scheme
- Throws `ArgumentException` on invalid input, which the controller maps to 400 Bad Request

#### Static File Configuration

In `Program.cs`:
```csharp
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "images")),
    RequestPath = "/images"
});
```

Images are placed in `api/wwwroot/images/` and served at `/images/{filename}`.

### Mobile Client

#### Updated `NavigationNodeDto` Interface

```typescript
export interface NavigationNodeDto {
  id: number;
  label: string;
  icon: string | null;
  backgroundImageUrl: string | null;  // NEW
  parentId: number | null;
  sortOrder: number;
  children: NavigationNodeDto[];
}
```

#### New Component: `AnimatedBackground`

```typescript
interface AnimatedBackgroundProps {
  imageUrl: string | null;
}
```

Responsibilities:
- Renders an absolutely-positioned full-screen image behind all other content
- Uses `react-native-reanimated` shared values to animate opacity (fade in/out)
- When `imageUrl` changes: fade out current image, fade in new image (crossfade ~300ms)
- When `imageUrl` is null: fade out to transparent (show default background)

#### Integration with `DashboardScreen`

The `DashboardScreen` passes `activeNode?.backgroundImageUrl ?? null` to `AnimatedBackground`. The component sits as the first child in the root `View`, positioned absolutely behind all other content.

### Admin Portal

#### New Page: `CategoryManagementPage`

Route: `/categories` (protected by `ProtectedRoute`)

Features:
- Fetches the navigation tree from `GET /api/navigation/tree`
- Displays a flat list (or expandable tree) of all NavigationNodes
- Each row shows: label, icon, current BackgroundImageUrl (or "None")
- Each row has an "Edit" action to assign/change/remove the background image URL
- Edit dialog: text input for URL, "Clear" button to remove, "Save" to persist
- Calls `PUT /api/navigation/nodes/:id` with `updateBackgroundImageUrl: true` and the new value

#### Updated `apiClient.ts`

Add functions:
- `getNavigationTree(token: string): Promise<NavigationNodeDto[]>` — fetches tree with auth header
- `updateNavigationNode(token: string, id: number, request: UpdateNodeRequest): Promise<NavigationNodeDto>` — sends PUT with auth header

## Data Models

### Database Schema Change

```sql
ALTER TABLE navigation_nodes
ADD COLUMN background_image_url VARCHAR(1000) NULL;
```

Implemented as an EF Core migration:

```csharp
migrationBuilder.AddColumn<string>(
    name: "background_image_url",
    table: "navigation_nodes",
    type: "varchar(1000)",
    nullable: true);
```

### Static Image Files

Location: `api/wwwroot/images/`

Initial files:
- `neon_concert_background.jpeg`
- `neon_dancing_background.jpeg`
- `neon_nightclub_background.jpeg`
- `neon_sports_background.jpeg`

These are moved from the project root into the API's static files directory.

### Seed Data Migration

A data migration assigns initial background image URLs to existing top-level category nodes:

| Category | BackgroundImageUrl |
|----------|-------------------|
| Events | `/images/neon_concert_background.jpeg` |
| Nightlife | `/images/neon_nightclub_background.jpeg` |
| Activities | `/images/neon_sports_background.jpeg` |
| Dancing | `/images/neon_dancing_background.jpeg` |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: DTO Mapping Preserves BackgroundImageUrl

*For any* NavigationNode with any BackgroundImageUrl value (valid URL string or null), mapping that node to a NavigationNodeDto SHALL produce a DTO whose BackgroundImageUrl field is identical to the source entity's value.

**Validates: Requirements 1.2, 1.3**

### Property 2: BackgroundImageUrl Update Round-Trip

*For any* NavigationNode and any valid URL string or null value, updating the node's BackgroundImageUrl (with `UpdateBackgroundImageUrl = true`) and then retrieving the node SHALL return the same BackgroundImageUrl value that was set.

**Validates: Requirements 1.1, 5.2, 5.3**

### Property 3: Omitted BackgroundImageUrl Field Preserves Existing Value

*For any* NavigationNode with an existing BackgroundImageUrl value, sending an update request where `UpdateBackgroundImageUrl` is false or absent SHALL leave the BackgroundImageUrl unchanged regardless of what other fields are modified.

**Validates: Requirements 5.4**

### Property 4: Invalid URL Strings Are Rejected

*For any* string that is not a well-formed absolute HTTP/HTTPS URL, sending an update request with that string as BackgroundImageUrl (with `UpdateBackgroundImageUrl = true`) SHALL result in a 400 Bad Request response, and the node's existing BackgroundImageUrl SHALL remain unchanged.

**Validates: Requirements 5.5, 5.6**

## Error Handling

### API Layer

| Scenario | Response | Behavior |
|----------|----------|----------|
| Invalid URL format in update request | 400 Bad Request | Returns `{ message: "BackgroundImageUrl must be a valid absolute HTTP or HTTPS URL." }` |
| Node not found for update | 404 Not Found | Existing behavior unchanged |
| Static file not found | 404 Not Found | ASP.NET Core static file middleware returns 404 automatically |
| Database error during update | 500 Internal Server Error | EF Core exception propagates to global error handler |

### Mobile Client

| Scenario | Behavior |
|----------|----------|
| Image URL fails to load | `Image` component's `onError` handler fades out the broken image, showing default background |
| Network timeout loading image | Same as above — graceful fallback to no background |
| Null backgroundImageUrl | No image rendered; default background color shown |

### Admin Portal

| Scenario | Behavior |
|----------|----------|
| Update API call fails (non-401) | Show MUI Snackbar with error message; revert UI to previous value |
| Update API call returns 401 | Redirect to login page (token expired) |
| Navigation tree fetch fails | Show error state with retry button |
| Invalid URL entered by admin | Client-side validation before submission; show inline error |

## Testing Strategy

### Property-Based Tests (API — FsCheck + xUnit)

Location: `tests/Wutsup.Api.Tests/NavigationNodePropertyTests.cs`

| Property | What It Tests | Library |
|----------|---------------|---------|
| Property 1: DTO Mapping | `ToDto` preserves BackgroundImageUrl for any input | FsCheck |
| Property 2: Update Round-Trip | Update + retrieve returns same value | FsCheck |
| Property 3: Omitted Field | Update without flag preserves existing URL | FsCheck |
| Property 4: Invalid URL Rejection | Non-URL strings produce 400 | FsCheck |

Configuration: Minimum 100 iterations per property (`MaxTest = 100`).
Tag format: `// Feature: category-background-images, Property N: description`

### Unit Tests (API — xUnit)

Location: `tests/Wutsup.Api.Tests/NavigationServiceTests.cs`

- Verify `UpdateNodeAsync` sets BackgroundImageUrl when flag is true
- Verify `UpdateNodeAsync` clears BackgroundImageUrl when flag is true and value is null
- Verify `UpdateNodeAsync` throws ArgumentException for malformed URLs
- Verify `UpdateNodeAsync` preserves BackgroundImageUrl when flag is false/absent

### Integration Tests (API — xUnit)

Location: `tests/Wutsup.Api.Tests/IntegrationTests.cs`

- `GET /images/neon_concert_background.jpeg` returns 200 with `image/jpeg` content type
- `GET /images/nonexistent.jpeg` returns 404
- `PUT /api/navigation/nodes/:id` with valid BackgroundImageUrl persists and returns in tree
- `GET /api/navigation/tree` includes BackgroundImageUrl in response

### Unit Tests (Admin — Jest)

Location: `admin/__tests__/`

- CategoryManagementPage renders all nodes from API response
- Edit dialog submits correct payload with `updateBackgroundImageUrl: true`
- Error state displays on failed update
- Redirect to login on 401 response

### Property-Based Tests (Admin — fast-check)

Location: `admin/__tests__/properties/categoryManagement.property.test.ts`

- For any valid URL string, the update request payload includes the URL and the update flag
- For any node list, all nodes are rendered in the management interface

Configuration: Minimum 100 iterations (`numRuns: 100`).

### Unit Tests (Mobile Client — Jest)

Location: `client/__tests__/`

- AnimatedBackground renders Image when URL is provided
- AnimatedBackground renders nothing when URL is null
- NavigationNodeDto interface includes backgroundImageUrl field

### Manual Testing

- Verify fade animation smoothness on iOS and Android devices
- Verify image covers full screen without distortion on various screen sizes
- Verify admin portal UX flow for assigning/removing images
