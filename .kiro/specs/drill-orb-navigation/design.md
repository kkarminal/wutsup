# Design Document — Drill Orb Navigation

## Overview

This feature replaces the existing tab-strip dashboard with a single-page radial navigation experience. A Floating Action Button (FAB) — the **Drill_Orb** — sits at the dead centre of the landing screen. Tapping it opens a full-screen overlay (**Orb_Menu**) that displays the root navigation node surrounded by a ring of category nodes. Tapping any category node zooms it to the centre and reveals its children, creating a drill-down sensation. Users navigate back via breadcrumb tap, pinch gesture, or drag gesture.

The navigation tree is stored in PostgreSQL and served by a new `NavigationController` in the ASP.NET Core API, so categories can be updated without a client release. The client fetches the tree on mount, caches it in memory, and uses it to drive all navigation state.

### Key Design Decisions

- **`useOrbController` hook** encapsulates all navigation state (active node, breadcrumb stack, animation lock, tree cache). This keeps the OrbMenu component purely presentational and makes the logic independently testable.
- **Polar-to-Cartesian coordinate math** in a pure utility function (`orbLayout.ts`) computes node positions from angle and radius. Extracting this as a pure function makes it property-testable without any React dependencies.
- **React Native Reanimated v4** for all animations — worklets run on the native UI thread, satisfying the native-thread requirement. `useSharedValue` / `withTiming` / `withSpring` are used throughout.
- **Gesture Handler v2 API** (`Gesture.Pan()`, `Gesture.Pinch()`, `GestureDetector`) — the modern composable API is preferred over legacy `<PanGestureHandler>` components.
- **Animation lock** (`isAnimating: SharedValue<boolean>`) prevents double-navigation during transitions, consistent with the dashboard-swipe-navigation pattern.
- **Self-referencing `navigation_nodes` table** with cascade delete on `parent_id` — standard adjacency list pattern, efficient for the tree sizes expected here.
- **Recursive tree builder** on the API side assembles the flat DB rows into a nested JSON structure in a single query pass.
- **EF Core seed data** in the initial migration populates the full default tree so development and testing work immediately.

---

## Architecture

```
client/
├── app/
│   ├── _layout.tsx                  ← updated: remove tab screens, add dashboard
│   └── index.tsx                    ← updated: redirect to /dashboard
├── screens/
│   └── DashboardScreen.tsx          ← updated: single-page layout with DrillOrb
├── components/
│   ├── DrillOrb.tsx                 ← new: FAB / active-node orb
│   ├── OrbMenu.tsx                  ← new: full-screen overlay
│   ├── CategoryNode.tsx             ← new: individual radial node
│   └── BreadcrumbTrail.tsx          ← new: ancestor path at top of OrbMenu
├── hooks/
│   └── useOrbController.ts          ← new: navigation state + tree fetching
├── services/
│   └── navigationApi.ts             ← new: typed API client for navigation tree
└── utils/
    └── orbLayout.ts                 ← new: pure polar-to-cartesian math

api/
├── Controllers/
│   └── NavigationController.cs      ← new: GET tree, POST/PUT/DELETE nodes
├── Models/
│   ├── NavigationNode.cs            ← new: EF Core entity
│   ├── NavigationNodeDto.cs         ← new: response DTO (nested)
│   ├── CreateNavigationNodeRequest.cs ← new: POST request body
│   └── UpdateNavigationNodeRequest.cs ← new: PUT request body
├── Services/
│   ├── INavigationService.cs        ← new: interface
│   └── NavigationService.cs         ← new: tree assembly + CRUD
├── Data/
│   └── AppDbContext.cs              ← updated: add NavigationNodes DbSet
└── Migrations/
    └── ..._AddNavigationNodes.cs    ← new: table + seed data

tests/Wutsup.Api.Tests/
└── NavigationServicePropertyTests.cs ← new: FsCheck property tests

client/__tests__/properties/
└── orbNavigation.property.test.ts   ← new: fast-check property tests
```

### Data Flow — Opening the Menu

```
Dashboard mounts
      │
      ▼
useOrbController.fetchTree()
      │  GET /api/navigation/tree
      ▼
navigationApi.getTree()
      │  returns NavigationNodeDto (nested)
      ▼
useOrbController: build id→node map, set treeRoot, set ready
      │
      ▼
User taps DrillOrb
      │
      ▼
useOrbController.openMenu()
      │  sets activeNode = root, pushes root to breadcrumb
      ▼
OrbMenu renders with CategoryRing of root's children
```

### Data Flow — Drill Down

```
User taps CategoryNode (has children)
      │
      ▼
useOrbController.drillInto(node)
      │  checks isAnimating → if true, no-op
      │  sets isAnimating = true
      │  sets activeNode = node
      │  pushes node.label to breadcrumb
      ▼
OrbMenu plays Drill_Animation (Reanimated worklet)
      │  tapped node scales to centre, ring fades out
      │  on complete: isAnimating = false
      ▼
CategoryRing re-renders with node's children
```

### Data Flow — Back Navigation

```
User pinches / taps breadcrumb / drags ≥ 40 pts
      │
      ▼
resolveBackGesture(gesture, isAnimating) → BackAction
      │  'back' | 'jump-to' | 'none'
      ▼
useOrbController.navigateBack() or navigateTo(ancestorId)
      │  pops breadcrumb, sets activeNode = parent
      ▼
OrbMenu plays Back_Animation (Reanimated worklet)
```

---

## Components and Interfaces

### `orbLayout.ts` (pure utility)

```typescript
export interface PolarPosition {
  angle: number;   // degrees, 0 = top
  radius: number;  // points
}

export interface CartesianPosition {
  x: number;
  y: number;
}

export const RING_RADIUS = 120;  // points from centre to node centre
export const DRAG_BACK_THRESHOLD = 40;  // points

/**
 * Converts polar coordinates (angle in degrees, radius in points)
 * to Cartesian (x, y) offsets from the centre point.
 * Angle 0 = top (12 o'clock), increases clockwise.
 */
export function polarToCartesian(polar: PolarPosition): CartesianPosition;

/**
 * Computes the angle in degrees for node at `index` in a ring of `total` nodes.
 * Angles are evenly distributed across 360 degrees starting from 0 (top).
 * Returns (360 / total) * index.
 */
export function computeNodeAngle(index: number, total: number): number;

/**
 * Computes the Cartesian positions for all nodes in a ring.
 * Returns one position per node, all at RING_RADIUS from centre.
 */
export function computeRingPositions(nodeCount: number): CartesianPosition[];

/**
 * Returns true if a drag gesture of the given distance (in points)
 * meets the threshold to trigger back navigation.
 */
export function meetsBackDragThreshold(dragDistance: number): boolean;
```

### `navigationApi.ts`

```typescript
export interface NavigationNodeDto {
  id: number;
  label: string;
  icon: string | null;
  parentId: number | null;
  sortOrder: number;
  children: NavigationNodeDto[];
}

export interface CreateNodeRequest {
  label: string;
  icon?: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface UpdateNodeRequest {
  label?: string;
  icon?: string | null;
  sortOrder?: number;
}

export interface NavigationApiClient {
  getTree(): Promise<NavigationNodeDto>;
  createNode(req: CreateNodeRequest): Promise<NavigationNodeDto>;
  updateNode(id: number, req: UpdateNodeRequest): Promise<NavigationNodeDto>;
  deleteNode(id: number): Promise<void>;
}

export function createNavigationApiClient(apiBaseUrl: string): NavigationApiClient;
```

### `useOrbController.ts`

```typescript
export type OrbState = 'loading' | 'error' | 'ready' | 'open' | 'animating';

export interface OrbControllerState {
  orbState: OrbState;
  activeNode: NavigationNodeDto | null;
  breadcrumb: string[];           // labels from root to active
  childNodes: NavigationNodeDto[];
}

export interface OrbControllerActions {
  openMenu(): void;
  closeMenu(): void;
  drillInto(node: NavigationNodeDto): void;
  navigateBack(): void;
  navigateTo(nodeId: number): void;  // breadcrumb jump
  retryFetch(): void;
}

export function useOrbController(): OrbControllerState & OrbControllerActions;
```

Internal state:
- `treeRoot: NavigationNodeDto | null` — root of the fetched tree
- `nodeMap: Map<number, NavigationNodeDto>` — O(1) lookup by id
- `isAnimating: SharedValue<boolean>` — Reanimated shared value; worklet-safe animation guard
- `activeNode: NavigationNodeDto | null`
- `breadcrumb: string[]`

### `DrillOrb.tsx`

```typescript
interface DrillOrbProps {
  orbState: OrbState;
  onPress: () => void;
}
```

Renders:
- `loading` state: `CircularProgress` from `@expo/ui/swift-ui` wrapped in `Host`
- `error` state: Ionicons `warning-outline`, `accessibilityLabel="Navigation unavailable, tap to retry"`
- `ready` / `open` state: Ionicons `add` icon, `accessibilityLabel="Open navigation menu"`, `accessibilityRole="button"`

### `OrbMenu.tsx`

```typescript
interface OrbMenuProps {
  visible: boolean;
  activeNode: NavigationNodeDto | null;
  childNodes: NavigationNodeDto[];
  breadcrumb: string[];
  onDrillInto: (node: NavigationNodeDto) => void;
  onNavigateBack: () => void;
  onNavigateTo: (nodeId: number) => void;
  onClose: () => void;
}
```

Full-screen `Modal` (or absolute-positioned `View` with `pointerEvents`) overlay. Contains:
- `BreadcrumbTrail` at top
- `CategoryNode` components positioned via `computeRingPositions`
- Central active node (the DrillOrb in its open state)
- `PanGestureHandler` on the active node for drag-back
- `GestureDetector` with `Gesture.Pinch()` on the overlay for pinch-back

### `CategoryNode.tsx`

```typescript
interface CategoryNodeProps {
  node: NavigationNodeDto;
  position: CartesianPosition;
  isLeaf: boolean;
  onPress: (node: NavigationNodeDto) => void;
  // Reanimated animated style for drill/back transitions
  animatedStyle?: AnimatedStyle;
}
```

Renders a circular `Pressable` with:
- Node label below the circle (font size ≥ 11 sp)
- Leaf indicator: distinct background colour (`BRAND.cyan`) when `isLeaf`
- `accessibilityLabel={node.label}`, `accessibilityRole="button"`

### `BreadcrumbTrail.tsx`

```typescript
interface BreadcrumbTrailProps {
  breadcrumb: string[];
  nodeIds: number[];   // parallel array — same length as breadcrumb
  onNavigateTo: (nodeId: number) => void;
}
```

Horizontal `ScrollView` of `Pressable` items. Each item:
- `accessibilityRole="button"`
- `accessibilityLabel={\`Navigate back to ${label}\`}`

---

## Data Models

### Client — In-Memory Tree

| Structure | Type | Purpose |
|-----------|------|---------|
| `treeRoot` | `NavigationNodeDto \| null` | Root of the fetched tree |
| `nodeMap` | `Map<number, NavigationNodeDto>` | O(1) lookup by id |
| `breadcrumb` | `string[]` | Labels from root to active node |
| `breadcrumbIds` | `number[]` | Node ids parallel to breadcrumb labels |
| `activeNode` | `NavigationNodeDto \| null` | Currently centred node |
| `isAnimating` | `SharedValue<boolean>` | Reanimated animation lock |

### Client — Layout Constants

| Constant | Value | Requirement |
|----------|-------|-------------|
| `RING_RADIUS` | `120` points | Req 3.3 |
| `DRAG_BACK_THRESHOLD` | `40` points | Req 5.3 |
| `DRILL_ANIMATION_DURATION` | `350` ms | Req 2.3, 4.2 |
| `BACK_ANIMATION_DURATION` | `350` ms | Req 2.5, 5.5 |
| `REDUCE_MOTION_DURATION` | `150` ms | Req 9.4 |

### API — `NavigationNode` Entity

```csharp
public class NavigationNode
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public NavigationNode? Parent { get; set; }
    public ICollection<NavigationNode> Children { get; set; } = new List<NavigationNode>();
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
```

EF Core table mapping (`navigation_nodes`):

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `integer` | PK, identity always |
| `label` | `varchar(255)` | NOT NULL |
| `icon` | `varchar(100)` | nullable |
| `parent_id` | `integer` | nullable, FK → `navigation_nodes.id` CASCADE DELETE |
| `sort_order` | `integer` | NOT NULL, default 0 |
| `created_at` | `timestamptz` | NOT NULL, default NOW() |
| `updated_at` | `timestamptz` | NOT NULL, default NOW() |

Index: `idx_navigation_nodes_parent_id` on `parent_id`.

### API — DTOs

```csharp
// Response DTO (nested)
public record NavigationNodeDto(
    int Id,
    string Label,
    string? Icon,
    int? ParentId,
    int SortOrder,
    List<NavigationNodeDto> Children
);

// POST request
public record CreateNavigationNodeRequest(
    string Label,
    string? Icon,
    int? ParentId,
    int SortOrder = 0
);

// PUT request
public record UpdateNavigationNodeRequest(
    string? Label,
    string? Icon,
    int? SortOrder
);
```

### Seed Data Tree

```
What's Up (root, id=1)
├── Events (id=2, sort=0)
│   ├── Music (id=6, sort=0)
│   ├── Sports (id=7, sort=1)
│   └── Arts (id=8, sort=2)
├── Food (id=3, sort=1)
│   ├── Restaurants (id=9, sort=0)
│   ├── Cafes (id=10, sort=1)
│   └── Food Trucks (id=11, sort=2)
├── Bars (id=4, sort=2)
│   ├── Cocktail Bars (id=12, sort=0)
│   ├── Sports Bars (id=13, sort=1)
│   └── Breweries (id=14, sort=2)
└── Activities (id=5, sort=3)
    ├── Outdoor (id=15, sort=0)
    ├── Classes (id=16, sort=1)
    └── Entertainment (id=17, sort=2)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Even angular distribution

*For any* positive integer N (number of nodes in a ring), the angle computed for node at index `i` shall equal `(360 / N) * i` degrees, and all N angles shall be distinct and evenly spaced across 360 degrees.

**Validates: Requirements 3.1, 3.2**

---

### Property 2: Equal radial distance

*For any* positive integer N, all Cartesian positions computed by `computeRingPositions(N)` shall be at the same distance from the origin (within floating-point tolerance), and that distance shall equal `RING_RADIUS`.

**Validates: Requirements 3.3**

---

### Property 3: Leaf node visual distinction

*For any* `CategoryNode` rendered with `isLeaf=true`, the component shall expose a prop or style that distinguishes it visually from non-leaf nodes; and *for any* `CategoryNode` rendered with `isLeaf=false`, that distinction shall be absent.

**Validates: Requirements 3.4**

---

### Property 4: Node label font size invariant

*For any* node label string, the `CategoryNode` component shall render the label with a font size of at least 11 sp.

**Validates: Requirements 3.5**

---

### Property 5: Category node accessibility invariant

*For any* navigation node, the rendered `CategoryNode` shall have `accessibilityRole="button"` and `accessibilityLabel` equal to the node's label string.

**Validates: Requirements 3.6, 10.2**

---

### Property 6: Breadcrumb grows on drill, shrinks on back (round-trip)

*For any* sequence of drill-down operations followed by the same number of back-navigation operations, the breadcrumb trail shall return to its original length and content. Specifically: drilling into a node appends its label; navigating back removes the last label.

**Validates: Requirements 4.3, 5.6**

---

### Property 7: Animation guard prevents navigation

*For any* gesture input (drill tap, pinch, drag, breadcrumb tap) received while `isAnimating` is `true`, the `useOrbController` shall not change `activeNode`, `breadcrumb`, or `orbState`.

**Validates: Requirements 4.5, 5.7, 9.5**

---

### Property 8: Drag-back threshold

*For any* drag distance ≥ 40 points, `meetsBackDragThreshold` shall return `true`. *For any* drag distance < 40 points, it shall return `false`.

**Validates: Requirements 5.3**

---

### Property 9: Breadcrumb jump navigates to correct ancestor

*For any* drill sequence of depth D, tapping the breadcrumb item at position `k` (0-indexed) shall set `activeNode` to the node at depth `k` in the path, and the breadcrumb shall be truncated to length `k + 1`.

**Validates: Requirements 5.2**

---

### Property 10: Reduce Motion animation config

*For any* animation trigger, if `reduceMotion` is `true`, the resolved animation config shall have `duration ≤ 200` ms and `type === 'fade'`. If `reduceMotion` is `false`, the config shall have `duration ≤ 400` ms and `type === 'zoom'`.

**Validates: Requirements 9.4, 10.4**

---

### Property 11: Breadcrumb accessibility label format

*For any* breadcrumb label string, the rendered `BreadcrumbTrail` item shall have `accessibilityRole="button"` and `accessibilityLabel` equal to `"Navigate back to " + label`.

**Validates: Requirements 10.3**

---

### Property 12: Node lookup by id is correct

*For any* navigation tree, after building the `nodeMap`, looking up any node's id shall return that exact node (same id, label, and children count).

**Validates: Requirements 8.5**

---

### Property 13: POST node — valid label creates node with correct fields

*For any* non-empty label string and valid optional fields, a `POST /api/navigation/nodes` request shall return HTTP 201 with a response body containing the same label, icon, parentId, and sortOrder that were submitted.

**Validates: Requirements 6.3, 6.4**

---

### Property 14: POST node — empty label returns 400

*For any* string composed entirely of whitespace (including the empty string), a `POST /api/navigation/nodes` request with that label shall return HTTP 400.

**Validates: Requirements 6.5**

---

### Property 15: GET tree — all nodes contain required fields

*For any* navigation tree stored in the database, the `GET /api/navigation/tree` response shall contain every node with non-null `id`, `label`, `sortOrder`, and `children` array (icon and parentId may be null).

**Validates: Requirements 6.1, 6.2**

---

### Property 16: DELETE node removes all descendants

*For any* node with one or more descendants, issuing `DELETE /api/navigation/nodes/{id}` shall remove the node and every descendant from the database, leaving no orphaned rows.

**Validates: Requirements 6.9**

---

### Property 17: PUT node — update is reflected in subsequent GET

*For any* existing node and any valid update (non-empty label, any icon, any sortOrder), a `PUT /api/navigation/nodes/{id}` followed by `GET /api/navigation/tree` shall return the updated values for that node.

**Validates: Requirements 6.7**

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Navigation tree fetch fails on mount | `orbState` → `'error'`; DrillOrb shows warning icon with `accessibilityLabel="Navigation unavailable, tap to retry"`; tap calls `retryFetch()` |
| Navigation tree fetch fails on retry | Same error state; user can retry again |
| Tap during animation | `isAnimating` guard returns no-op; no state change |
| Pinch/drag during animation | Same animation guard |
| Leaf node tapped | Selection event emitted with `{ id, label }`; OrbMenu closes |
| Back at root node | `navigateBack()` calls `closeMenu()` instead of popping breadcrumb |
| Breadcrumb jump to current active node | No-op (already at that node) |
| `POST /api/navigation/nodes` with empty label | HTTP 400 with `{ message: "Label is required." }` |
| `POST /api/navigation/nodes` with non-existent parentId | HTTP 404 with `{ message: "Parent node not found." }` |
| `PUT /api/navigation/nodes/{id}` with non-existent id | HTTP 404 with `{ message: "Node not found." }` |
| `DELETE /api/navigation/nodes/{id}` with non-existent id | HTTP 404 with `{ message: "Node not found." }` |
| API unreachable from client | `navigationApi` catches fetch errors and throws a typed `NavigationApiError`; `useOrbController` catches and sets error state |
| Reduce Motion enabled | All animations replaced with cross-fade ≤ 150 ms via `useReduceMotion()` from Reanimated |

---

## Testing Strategy

### Unit / Example Tests

Located next to source files (`*.test.ts` / `*.test.tsx`):

- `orbLayout.test.ts` — boundary examples: `computeNodeAngle(0, 1) === 0`, `computeNodeAngle(0, 4) === 0`, `computeNodeAngle(1, 4) === 90`, `meetsBackDragThreshold(40) === true`, `meetsBackDragThreshold(39) === false`
- `DrillOrb.test.tsx` — render tests for loading, error, and ready states; verify `accessibilityLabel` and `accessibilityRole` in each state
- `OrbMenu.test.tsx` — render test: menu visible when `visible=true`; menu absent when `visible=false`; back button press calls `onNavigateBack`
- `CategoryNode.test.tsx` — render test: label present; leaf vs non-leaf styling; accessibility props
- `BreadcrumbTrail.test.tsx` — render test: each item has correct `accessibilityLabel` format; tap calls `onNavigateTo` with correct id
- `useOrbController.test.ts` — example tests: initial state is `loading`; after successful fetch state is `ready`; `openMenu` sets state to `open`; back at root closes menu
- `NavigationController.test.cs` — example tests: GET with non-existent id returns 404; POST with non-existent parentId returns 404; DELETE with non-existent id returns 404

### Property-Based Tests

**Client** — `client/__tests__/properties/orbNavigation.property.test.ts`

Uses **fast-check** with `numRuns: 100` per property. Each test tagged: `Feature: drill-orb-navigation, Property N: <description>`

| Property | Generator | Assertion |
|----------|-----------|-----------|
| 1 — Even angular distribution | `fc.integer({ min: 1, max: 20 })` for N | `computeNodeAngle(i, N) === (360/N)*i` for all i |
| 2 — Equal radial distance | `fc.integer({ min: 1, max: 20 })` for N | All positions at distance `RING_RADIUS` from origin |
| 3 — Leaf node visual distinction | `fc.boolean()` for isLeaf | Leaf indicator present/absent correctly |
| 4 — Node label font size | `fc.string()` for label | Rendered font size ≥ 11 |
| 5 — Category node accessibility | `fc.record({ id: fc.integer(), label: fc.string({ minLength: 1 }) })` | `accessibilityLabel === node.label`, `accessibilityRole === "button"` |
| 6 — Breadcrumb round-trip | `fc.array(fc.record({ id: fc.integer(), label: fc.string({ minLength: 1 }) }), { minLength: 1, maxLength: 5 })` | Drill N times then back N times → breadcrumb restored |
| 7 — Animation guard | `fc.oneof(fc.constant('drill'), fc.constant('back'), fc.constant('breadcrumb'))` for gesture type | No state change when `isAnimating=true` |
| 8 — Drag-back threshold | `fc.integer({ min: 40, max: 500 })` and `fc.integer({ min: 0, max: 39 })` | `meetsBackDragThreshold` returns true/false correctly |
| 9 — Breadcrumb jump | `fc.array(...)` for drill sequence, `fc.nat()` for jump index | Active node and breadcrumb length correct after jump |
| 10 — Reduce Motion config | `fc.boolean()` for reduceMotion | Duration and type constraints |
| 11 — Breadcrumb accessibility | `fc.string({ minLength: 1 })` for label | `accessibilityLabel === "Navigate back to " + label` |
| 12 — Node lookup by id | `fc.array(fc.record({ id: fc.integer(), label: fc.string({ minLength: 1 }) }), { minLength: 1 })` | `nodeMap.get(node.id)` returns correct node |

**API** — `tests/Wutsup.Api.Tests/NavigationServicePropertyTests.cs`

Uses **FsCheck** with `MaxTest = 100`. Each test tagged: `Feature: drill-orb-navigation, Property N: <description>`

| Property | Generator | Assertion |
|----------|-----------|-----------|
| 13 — POST valid label creates node | Non-empty string labels, optional icon/sortOrder | Response 201, body matches input |
| 14 — POST empty label returns 400 | Whitespace-only strings | Response 400 |
| 15 — GET tree all nodes have required fields | Seed various tree shapes | All nodes have id, label, sortOrder, children |
| 16 — DELETE removes all descendants | Trees with 1–4 levels of children | No orphaned rows after delete |
| 17 — PUT update reflected in GET | Random label/icon/sortOrder updates | GET returns updated values |

### Smoke Tests

- Verify `client/app/home.tsx` (or `dashboard.tsx`) renders `DashboardScreen` with `DrillOrb` at centre
- Verify `api/Migrations/..._AddNavigationNodes.cs` exists and creates `navigation_nodes` table with correct schema
- Verify seed data migration populates the default tree (17 nodes)
- Verify Reanimated worklets are used in `OrbMenu.tsx` (code review / static analysis)

### Integration Tests

- `GET /api/navigation/tree` with seeded database returns nested JSON with all 17 seed nodes
- `POST` → `GET` round-trip: created node appears in tree response
- Cascade delete: delete a parent node, verify all children absent from subsequent `GET /api/navigation/tree`
- Client `useOrbController` with mocked API: fetch failure → error state → retry → success → ready state
