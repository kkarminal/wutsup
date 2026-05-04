# Implementation Plan: Drill Orb Navigation

## Overview

Replace the existing tab-strip dashboard with a single-page radial navigation experience. The implementation is broken into seven incremental phases:

1. **API data layer** — `NavigationNode` entity, EF Core migration, seed data
2. **API service + controller** — tree assembly, CRUD endpoints, property tests
3. **Client layout utility** — pure polar-to-cartesian math, property tests
4. **Client navigation API client** — typed fetch wrapper
5. **Client `useOrbController` hook** — state machine, tree fetching, animation lock
6. **Client UI components** — `DrillOrb`, `OrbMenu`, `CategoryNode`, `BreadcrumbTrail`
7. **Dashboard wiring** — replace tab layout with single-page dashboard, final validation

All TypeScript code uses `strict: true`. No new client dependencies are required — `react-native-reanimated ~4.1.1`, `react-native-gesture-handler ~2.28.0`, and `fast-check ^4.7.0` are already present. The API already has EF Core + Npgsql; no new NuGet packages are needed.

---

## Tasks

- [x] 1. API — NavigationNode entity, migration, and seed data
  - Create `api/Models/NavigationNode.cs` with properties: `Id` (int), `Label` (string), `Icon` (string?), `ParentId` (int?), `Parent` (NavigationNode?), `Children` (ICollection<NavigationNode>), `SortOrder` (int), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - Create `api/Models/NavigationNodeDto.cs` as a record: `(int Id, string Label, string? Icon, int? ParentId, int SortOrder, List<NavigationNodeDto> Children)`
  - Create `api/Models/CreateNavigationNodeRequest.cs` as a record: `(string Label, string? Icon, int? ParentId, int SortOrder = 0)`
  - Create `api/Models/UpdateNavigationNodeRequest.cs` as a record: `(string? Label, string? Icon, int? SortOrder)`
  - Update `api/Data/AppDbContext.cs` to add `DbSet<NavigationNode> NavigationNodes` and configure the entity in `OnModelCreating`: table name `navigation_nodes`, column names snake_case, `parent_id` FK with cascade delete, index `idx_navigation_nodes_parent_id` on `parent_id`, `created_at` and `updated_at` default `NOW()`
  - Generate EF Core migration: `dotnet ef migrations add AddNavigationNodes` from the `api/` directory
  - Add seed data in the migration's `Up` method using `migrationBuilder.InsertData` for all 17 nodes in the default tree (What's Up → Events/Food/Bars/Activities → subcategories as specified in the design)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. API — NavigationService and NavigationController
  - Create `api/Services/INavigationService.cs` with methods:
    - `Task<NavigationNodeDto> GetTreeAsync()`
    - `Task<NavigationNodeDto> CreateNodeAsync(CreateNavigationNodeRequest request)`
    - `Task<NavigationNodeDto> UpdateNodeAsync(int id, UpdateNavigationNodeRequest request)`
    - `Task DeleteNodeAsync(int id)`
  - Create `api/Services/NavigationService.cs` implementing `INavigationService`:
    - `GetTreeAsync`: load all nodes ordered by `sort_order`, build a `Dictionary<int?, List<NavigationNode>>` keyed by `parent_id`, then recursively assemble the nested `NavigationNodeDto` tree starting from the root (nodes where `parent_id IS NULL`)
    - `CreateNodeAsync`: validate label is non-empty (throw `ArgumentException` if not), validate parentId exists if provided (throw `KeyNotFoundException` if not), insert node, return DTO
    - `UpdateNodeAsync`: find node by id (throw `KeyNotFoundException` if not found), apply non-null fields, save, return DTO
    - `DeleteNodeAsync`: find node by id (throw `KeyNotFoundException` if not found), delete (cascade handles descendants), save
  - Create `api/Controllers/NavigationController.cs` with `[Route("api/navigation")]`:
    - `GET /api/navigation/tree` → `200 OK` with `NavigationNodeDto`
    - `POST /api/navigation/nodes` → `201 Created` with `NavigationNodeDto`; catch `ArgumentException` → `400`; catch `KeyNotFoundException` → `404`
    - `PUT /api/navigation/nodes/{id}` → `200 OK` with `NavigationNodeDto`; catch `KeyNotFoundException` → `404`
    - `DELETE /api/navigation/nodes/{id}` → `204 No Content`; catch `KeyNotFoundException` → `404`
  - Register `INavigationService` / `NavigationService` as scoped in `api/Program.cs`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [x] 2.1 Write API property tests
    - Create `tests/Wutsup.Api.Tests/NavigationServicePropertyTests.cs`
    - Use FsCheck with `MaxTest = 100` and in-memory EF Core database (same pattern as `LoggingServicePropertyTests.cs`)
    - Tag each test: `// Feature: drill-orb-navigation, Property N: <description>`
    - **Property 13** — For any non-empty label string (and optional icon/sortOrder), `CreateNodeAsync` persists a node and returns a DTO with matching label, icon, parentId, and sortOrder
    - **Property 14** — For any whitespace-only string (including empty string), `CreateNodeAsync` throws `ArgumentException`
    - **Property 15** — For any set of nodes inserted into the database, `GetTreeAsync` returns a tree where every node has a non-default `Id`, non-empty `Label`, non-negative `SortOrder`, and a non-null `Children` list
    - **Property 16** — For any node with one or more descendants, `DeleteNodeAsync` removes the node and all descendants (verify by checking `NavigationNodes.Count` before and after)
    - **Property 17** — For any existing node and any valid update (non-empty label, any icon, any sortOrder), `UpdateNodeAsync` followed by `GetTreeAsync` returns the updated values for that node
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7, 6.9_

  - [x] 2.2 Write API example tests
    - Add to `tests/Wutsup.Api.Tests/NavigationServicePropertyTests.cs` or create `NavigationControllerTests.cs`
    - `POST` with non-existent `parentId` → `KeyNotFoundException` (maps to 404 in controller)
    - `PUT` with non-existent `id` → `KeyNotFoundException`
    - `DELETE` with non-existent `id` → `KeyNotFoundException`
    - _Requirements: 6.6, 6.8, 6.10_

  - [x] 2.3 Run API tests
    - Run `dotnet test` from `tests/Wutsup.Api.Tests/` and confirm all tests pass before proceeding

- [x] 3. Client — `orbLayout.ts` pure utility
  - Create `client/utils/orbLayout.ts` with the following exports:
    - `RING_RADIUS = 120` (points)
    - `DRAG_BACK_THRESHOLD = 40` (points)
    - `DRILL_ANIMATION_DURATION = 350` (ms)
    - `BACK_ANIMATION_DURATION = 350` (ms)
    - `REDUCE_MOTION_DURATION = 150` (ms)
    - `PolarPosition` interface: `{ angle: number; radius: number }`
    - `CartesianPosition` interface: `{ x: number; y: number }`
    - `polarToCartesian(polar: PolarPosition): CartesianPosition` — converts angle (degrees, 0=top, clockwise) and radius to x/y offsets from centre
    - `computeNodeAngle(index: number, total: number): number` — returns `(360 / total) * index`
    - `computeRingPositions(nodeCount: number): CartesianPosition[]` — returns array of `nodeCount` positions, all at `RING_RADIUS` from origin
    - `meetsBackDragThreshold(dragDistance: number): boolean` — returns `dragDistance >= DRAG_BACK_THRESHOLD`
    - `resolveAnimationConfig(reduceMotion: boolean): { duration: number; type: 'zoom' | 'fade' }` — returns `{ duration: REDUCE_MOTION_DURATION, type: 'fade' }` when `reduceMotion` is `true`, otherwise `{ duration: DRILL_ANIMATION_DURATION, type: 'zoom' }`
  - This is a pure module with no React or native imports
  - _Requirements: 3.1, 3.2, 3.3, 5.3, 9.4_

  - [x] 3.1 Write example-based unit tests for `orbLayout.ts`
    - Create `client/utils/orbLayout.test.ts`
    - `computeNodeAngle(0, 1) === 0`
    - `computeNodeAngle(0, 4) === 0`, `computeNodeAngle(1, 4) === 90`, `computeNodeAngle(2, 4) === 180`, `computeNodeAngle(3, 4) === 270`
    - `computeRingPositions(4)` returns 4 positions all at distance `RING_RADIUS` from origin (within 0.001 tolerance)
    - `meetsBackDragThreshold(40) === true`, `meetsBackDragThreshold(39) === false`, `meetsBackDragThreshold(0) === false`
    - `resolveAnimationConfig(true)` returns `duration ≤ 200` and `type === 'fade'`
    - `resolveAnimationConfig(false)` returns `duration ≤ 400` and `type === 'zoom'`
    - _Requirements: 3.1, 3.2, 3.3, 5.3, 9.4_

  - [x] 3.2 Write property-based tests for `orbLayout.ts`
    - Create `client/__tests__/properties/orbNavigation.property.test.ts`
    - Use `fast-check` with `numRuns: 100` per property
    - Tag each test: `// Feature: drill-orb-navigation, Property N: <description>`
    - **Property 1** — `fc.integer({ min: 1, max: 20 })` for N: `computeNodeAngle(i, N) === (360/N)*i` for all i in [0, N-1]
    - **Property 2** — `fc.integer({ min: 1, max: 20 })` for N: all positions from `computeRingPositions(N)` are at distance `RING_RADIUS` from origin (within 0.001 tolerance)
    - **Property 8** — `fc.integer({ min: 40, max: 500 })` for distance ≥ threshold: `meetsBackDragThreshold` returns `true`; `fc.integer({ min: 0, max: 39 })` for distance < threshold: returns `false`
    - **Property 10** — `fc.boolean()` for reduceMotion: when `true` → `duration ≤ 200` and `type === 'fade'`; when `false` → `duration ≤ 400` and `type === 'zoom'`
    - _Requirements: 3.1, 3.2, 3.3, 5.3, 9.4_

  - [x] 3.3 Run client tests checkpoint
    - Run `npx jest` from the `client/` directory and confirm all tests pass

- [x] 4. Client — `navigationApi.ts` service
  - Create `client/services/navigationApi.ts`
  - Define and export interfaces: `NavigationNodeDto`, `CreateNodeRequest`, `UpdateNodeRequest`, `NavigationApiClient`
  - Implement `createNavigationApiClient(apiBaseUrl: string): NavigationApiClient` with methods:
    - `getTree()`: `GET {apiBaseUrl}/api/navigation/tree`, returns `NavigationNodeDto`; throws `NavigationApiError` on non-200 or network failure
    - `createNode(req)`: `POST {apiBaseUrl}/api/navigation/nodes`, returns `NavigationNodeDto`; throws on non-201
    - `updateNode(id, req)`: `PUT {apiBaseUrl}/api/navigation/nodes/{id}`, returns `NavigationNodeDto`; throws on non-200
    - `deleteNode(id)`: `DELETE {apiBaseUrl}/api/navigation/nodes/{id}`; throws on non-204
  - Define and export `NavigationApiError` class with `message` and `statusCode` fields
  - Never throw raw `Error` — always wrap in `NavigationApiError`
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 5. Client — `useOrbController` hook
  - Create `client/hooks/useOrbController.ts`
  - Export types: `OrbState = 'loading' | 'error' | 'ready' | 'open' | 'animating'`
  - Internal state (React `useState`):
    - `orbState: OrbState` — initial `'loading'`
    - `activeNode: NavigationNodeDto | null`
    - `breadcrumb: string[]`
    - `breadcrumbIds: number[]`
    - `childNodes: NavigationNodeDto[]`
  - Internal refs:
    - `treeRoot: React.MutableRefObject<NavigationNodeDto | null>`
    - `nodeMap: React.MutableRefObject<Map<number, NavigationNodeDto>>`
  - Reanimated shared value: `isAnimating: SharedValue<boolean>` via `useSharedValue(false)`
  - On mount: call `navigationApi.getTree()`, build `nodeMap` (flatten tree into `Map<id, node>`), set `treeRoot`, set `orbState = 'ready'`; on error set `orbState = 'error'`
  - `openMenu()`: if `orbState !== 'ready'` no-op; set `activeNode = treeRoot`, `breadcrumb = [treeRoot.label]`, `breadcrumbIds = [treeRoot.id]`, `childNodes = treeRoot.children`, `orbState = 'open'`
  - `closeMenu()`: set `orbState = 'ready'`, clear `activeNode`, `breadcrumb`, `breadcrumbIds`, `childNodes`
  - `drillInto(node)`: if `isAnimating.value === true` no-op; if node has no children emit selection event and call `closeMenu()`; otherwise set `isAnimating.value = true`, update `activeNode`, append to `breadcrumb` and `breadcrumbIds`, set `childNodes = node.children`, set `orbState = 'animating'`; after animation completes set `isAnimating.value = false`, `orbState = 'open'`
  - `navigateBack()`: if `isAnimating.value === true` no-op; if `activeNode === treeRoot` call `closeMenu()`; otherwise pop `breadcrumb` and `breadcrumbIds`, set `activeNode` to parent via `nodeMap`, set `childNodes = parent.children`, set `isAnimating.value = true`, `orbState = 'animating'`; after animation set `isAnimating.value = false`, `orbState = 'open'`
  - `navigateTo(nodeId)`: if `isAnimating.value === true` no-op; find node in `nodeMap`, truncate `breadcrumb` and `breadcrumbIds` to the index of that node, set `activeNode`, set `childNodes = node.children`
  - `retryFetch()`: set `orbState = 'loading'`, re-run fetch
  - Export `useOrbController` returning `{ orbState, activeNode, breadcrumb, breadcrumbIds, childNodes, isAnimating, openMenu, closeMenu, drillInto, navigateBack, navigateTo, retryFetch }`
  - _Requirements: 2.1, 2.4, 4.1, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 8.1, 8.3, 8.4, 8.5_

  - [x] 5.1 Write example-based tests for `useOrbController`
    - Create `client/hooks/useOrbController.test.ts`
    - Mock `navigationApi` using Jest module mocking
    - Initial state is `'loading'`
    - After successful fetch: `orbState === 'ready'`
    - After failed fetch: `orbState === 'error'`
    - `openMenu()` sets `orbState === 'open'` and `activeNode === treeRoot`
    - `drillInto(leafNode)` emits selection event and closes menu
    - `navigateBack()` at root closes menu
    - `retryFetch()` re-triggers fetch
    - _Requirements: 2.1, 2.4, 4.4, 5.4, 8.1, 8.3, 8.4_

  - [x] 5.2 Write property-based tests for `useOrbController` logic
    - Add to `client/__tests__/properties/orbNavigation.property.test.ts`
    - **Property 6** — `fc.array(fc.record({ id: fc.integer({ min: 1 }), label: fc.string({ minLength: 1 }) }), { minLength: 1, maxLength: 5 })`: drill into N nodes then navigate back N times → breadcrumb returns to original length and content
    - **Property 7** — For any gesture type (`'drill'`, `'back'`, `'breadcrumb'`) when `isAnimating = true`: no change to `activeNode`, `breadcrumb`, or `orbState`
    - **Property 9** — For any drill sequence of depth D, `navigateTo(breadcrumbIds[k])` sets `activeNode.id === breadcrumbIds[k]` and `breadcrumb.length === k + 1`
    - **Property 12** — For any navigation tree, `nodeMap.get(node.id)` returns the node with matching `id`, `label`, and `children.length`
    - _Requirements: 4.3, 4.5, 5.2, 5.6, 5.7, 8.5_

  - [x] 5.3 Run client tests checkpoint
    - Run `npx jest` from the `client/` directory and confirm all tests pass

- [x] 6. Client — UI components
  - [x] 6.1 Create `CategoryNode.tsx`
    - Create `client/components/CategoryNode.tsx`
    - Props: `node: NavigationNodeDto`, `position: CartesianPosition`, `isLeaf: boolean`, `onPress: (node: NavigationNodeDto) => void`, `animatedStyle?: AnimatedStyle`
    - Render an `Animated.View` (Reanimated) positioned absolutely using `position.x` and `position.y` as offsets from the centre of the parent
    - Inside: a circular `Pressable` (56×56 pt, `borderRadius: 28`) with background `BRAND.blue` for non-leaf nodes and `BRAND.cyan` for leaf nodes
    - Label below the circle: `Text` with `fontSize: FONT_SIZE.xs` (11 sp) minimum, `textAlign: 'center'`
    - `accessibilityLabel={node.label}`, `accessibilityRole="button"`
    - _Requirements: 3.4, 3.5, 3.6, 10.2_

  - [x] 6.2 Write tests for `CategoryNode`
    - Create `client/components/CategoryNode.test.tsx`
    - Render with a non-leaf node: assert label present, `accessibilityRole="button"`, `accessibilityLabel === node.label`, non-leaf background colour
    - Render with a leaf node: assert leaf background colour (`BRAND.cyan`) is applied
    - **Property 3** — `fc.boolean()` for isLeaf: leaf indicator present/absent correctly (add to `orbNavigation.property.test.ts`)
    - **Property 4** — `fc.string()` for label: rendered font size ≥ 11 (add to `orbNavigation.property.test.ts`)
    - **Property 5** — `fc.record({ id: fc.integer(), label: fc.string({ minLength: 1 }) })` for node: `accessibilityLabel === node.label` and `accessibilityRole === "button"` (add to `orbNavigation.property.test.ts`)
    - _Requirements: 3.4, 3.5, 3.6, 10.2_

  - [x] 6.3 Create `BreadcrumbTrail.tsx`
    - Create `client/components/BreadcrumbTrail.tsx`
    - Props: `breadcrumb: string[]`, `nodeIds: number[]`, `onNavigateTo: (nodeId: number) => void`
    - Render a horizontal `ScrollView` with one `Pressable` per breadcrumb item
    - Each item: `accessibilityRole="button"`, `accessibilityLabel={\`Navigate back to ${label}\`}`
    - Separator `>` between items (not pressable)
    - _Requirements: 5.2, 10.3_

  - [x] 6.4 Write tests for `BreadcrumbTrail`
    - Create `client/components/BreadcrumbTrail.test.tsx`
    - Render with 3 breadcrumb items: assert all labels present, all `accessibilityRole="button"`, all `accessibilityLabel` values match `"Navigate back to " + label`
    - Tap second item: assert `onNavigateTo` called with correct `nodeId`
    - **Property 11** — `fc.string({ minLength: 1 })` for label: `accessibilityLabel === "Navigate back to " + label` (add to `orbNavigation.property.test.ts`)
    - _Requirements: 5.2, 10.3_

  - [x] 6.5 Create `DrillOrb.tsx`
    - Create `client/components/DrillOrb.tsx`
    - Props: `orbState: OrbState`, `onPress: () => void`
    - `loading` state: render `Host` + `CircularProgress` from `@expo/ui/swift-ui`; `accessibilityLabel="Loading navigation"`, `accessibilityRole="button"`
    - `error` state: render Ionicons `warning-outline` (size 32); `accessibilityLabel="Navigation unavailable, tap to retry"`, `accessibilityRole="button"`
    - `ready` / `open` / `animating` state: render Ionicons `add` (size 32); `accessibilityLabel="Open navigation menu"`, `accessibilityRole="button"`
    - Circular shape: 64×64 pt, `borderRadius: 32`, background `BRAND.blue`
    - Wrap in `Pressable` with `onPress`
    - _Requirements: 1.2, 1.4, 2.1, 8.2, 8.3, 10.1_

  - [x] 6.6 Write tests for `DrillOrb`
    - Create `client/components/DrillOrb.test.tsx`
    - `loading` state: assert loading indicator present, `accessibilityLabel="Loading navigation"`
    - `error` state: assert warning icon present, `accessibilityLabel="Navigation unavailable, tap to retry"`
    - `ready` state: assert `accessibilityLabel="Open navigation menu"`, `accessibilityRole="button"`
    - Press in `ready` state: assert `onPress` called
    - _Requirements: 1.4, 8.2, 8.3, 10.1_

  - [x] 6.7 Create `OrbMenu.tsx`
    - Create `client/components/OrbMenu.tsx`
    - Props: `visible: boolean`, `activeNode: NavigationNodeDto | null`, `childNodes: NavigationNodeDto[]`, `breadcrumb: string[]`, `breadcrumbIds: number[]`, `onDrillInto: (node: NavigationNodeDto) => void`, `onNavigateBack: () => void`, `onNavigateTo: (nodeId: number) => void`, `onClose: () => void`
    - Render as a `Modal` with `transparent={true}` and `animationType="none"` (animations handled by Reanimated internally)
    - Full-screen `View` with `backgroundColor: theme.overlay`
    - `BreadcrumbTrail` at top (safe area aware)
    - Centre area: `DrillOrb` in `open` state showing `activeNode.label`
    - `CategoryNode` components positioned using `computeRingPositions(childNodes.length)` — each node's `position` is the computed `CartesianPosition`
    - `isLeaf` prop: `node.children.length === 0`
    - Wrap centre area in `GestureDetector` with composed `Gesture.Simultaneous(panGesture, pinchGesture)`:
      - `panGesture = Gesture.Pan()` on the active node: on `onEnd`, if `translationX` or `translationY` meets `DRAG_BACK_THRESHOLD`, call `onNavigateBack`
      - `pinchGesture = Gesture.Pinch()` on the overlay: on `onEnd`, if `scale > 1.2`, call `onNavigateBack`
    - Drill animation: use `useSharedValue` for scale and opacity; on `drillInto`, animate tapped node to centre (scale 1→2, opacity 1→0 for others) using `withTiming(DRILL_ANIMATION_DURATION)`
    - Back animation: reverse — active node scales 2→1, ring fades in
    - Reduce Motion: use `useReduceMotion()` from Reanimated; when `true`, use `withTiming(REDUCE_MOTION_DURATION)` with opacity-only transition
    - Android back button: `BackHandler.addEventListener('hardwareBackPress', onNavigateBack)` when `visible`
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 4.2, 5.1, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4, 10.5_

  - [x] 6.8 Write tests for `OrbMenu`
    - Create `client/components/OrbMenu.test.tsx`
    - `visible=false`: assert modal not rendered
    - `visible=true` with 4 child nodes: assert 4 `CategoryNode` components rendered
    - `visible=true`: assert `BreadcrumbTrail` rendered
    - Tap active node (root): assert `onClose` called
    - _Requirements: 2.2, 2.6_

  - [x] 6.9 Run client tests checkpoint
    - Run `npx jest` from the `client/` directory and confirm all tests pass

- [x] 7. Dashboard wiring and final validation
  - [x] 7.1 Update `DashboardScreen.tsx`
    - Replace the existing tab-strip layout in `client/screens/DashboardScreen.tsx` with a single-page layout:
      - Remove `TabBar`, `QuickActionDrawer`, `FindFoodScreen`, `FindStuffScreen` imports and rendering
      - Add `AppHeader` at top
      - Add `DrillOrb` centred on screen using `flex: 1` + `alignItems: 'center'` + `justifyContent: 'center'`
      - Add `OrbMenu` as a sibling (rendered outside the centred container so it can be full-screen)
      - Wire `useOrbController` hook: pass all state and actions to `DrillOrb` and `OrbMenu`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 7.2 Update `client/app/_layout.tsx`
    - Remove `find-food` and `find-stuff` route registrations (no longer needed)
    - Ensure `home` route is registered with `headerShown: false`
    - No tab layout — the root stack is the only navigator
    - _Requirements: 1.1, 1.5_

  - [x] 7.3 Write render tests for updated `DashboardScreen`
    - Update `client/screens/DashboardScreen.test.tsx`
    - Assert `DrillOrb` is present with `accessibilityLabel="Open navigation menu"`
    - Assert no `TabBar` component is rendered
    - Assert `AppHeader` is present
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 7.4 Final test run — client
    - Run `npx jest` from the `client/` directory and confirm all tests pass

  - [x] 7.5 Final test run — API
    - Run `dotnet test` from `tests/Wutsup.Api.Tests/` and confirm all tests pass

---

## Notes

- All property tests use `fast-check` (client, `numRuns: 100`) or FsCheck (API, `MaxTest = 100`)
- Every property test is tagged: `// Feature: drill-orb-navigation, Property N: <description>`
- `isAnimating` is a Reanimated `SharedValue<boolean>` — read and written inside worklets on the UI thread; never use React state for the animation lock
- The `orbLayout.ts` utility is pure (no React/native imports) — straightforward to test in Jest without mocking
- `NavigationService.GetTreeAsync` builds the nested tree in memory from a flat DB query — avoids N+1 queries
- Cascade delete on `parent_id` is handled by the database FK constraint; `NavigationService.DeleteNodeAsync` only needs to delete the root of the subtree
- `@expo/ui/swift-ui` `CircularProgress` requires a `Host` wrapper — see tech.md for usage pattern
- The `OrbMenu` uses `Modal` for the overlay so it renders above all other content including the status bar
- Gesture composition uses `Gesture.Simultaneous(panGesture, pinchGesture)` so both gestures can be recognised at the same time
