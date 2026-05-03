# Design Document — Dashboard Swipe Navigation

## Overview

This feature transforms the Wutsup home screen (`client/app/home.tsx`) into an interactive split-panel entry point. The screen is divided into two equal-height vertical sections — Food Panel and Activities Panel — each styled distinctly. A horizontal swipe gesture on the dashboard navigates to one of two placeholder destination screens, accompanied by a smooth native-thread animation.

The implementation uses **React Native Reanimated v4** (already installed at `~4.1.1`) for native-thread animations and **React Native Gesture Handler v2** (already installed at `~2.28.0`) for gesture detection. Both libraries are already present in `client/package.json`, so no new dependencies are required.

### Key Design Decisions

- **Reanimated over PanResponder**: Reanimated's `useSharedValue` / `withTiming` runs entirely on the UI thread via worklets, satisfying Requirement 5.1. PanResponder runs on the JS thread and would not meet the native-thread requirement.
- **Gesture Handler's `GestureDetector` + `Gesture.Pan()`**: The modern Gesture Handler v2 API is preferred over the legacy `PanResponder` or `<PanGestureHandler>` component API. It composes cleanly with Reanimated.
- **Expo Router `router.push`**: Navigation to destination screens uses Expo Router's imperative API, keeping routing consistent with the rest of the app.
- **Reduce Motion via `useReduceMotion`**: Reanimated exposes `useReduceMotion()` which reads the OS accessibility setting. When true, the animation is replaced with a cross-fade at ≤ 200 ms.
- **`isAnimating` guard**: A shared boolean value prevents double-navigation while a transition is in progress.

---

## Architecture

```
client/
├── app/
│   ├── home.tsx                  ← replaced: now renders DashboardScreen
│   ├── find-food.tsx             ← new: Find Food placeholder route
│   └── find-stuff.tsx            ← new: Find Stuff To Do placeholder route
├── screens/
│   ├── DashboardScreen.tsx       ← new: split-panel layout + gesture handling
│   ├── FindFoodScreen.tsx        ← new: placeholder screen
│   └── FindStuffScreen.tsx       ← new: placeholder screen
└── utils/
    └── gestureNavigation.ts      ← new: pure gesture decision logic (testable)
```

### Data Flow

```
User swipe gesture
      │
      ▼
GestureDetector (Gesture Handler v2)
      │  onEnd: dx, dy
      ▼
resolveSwipeNavigation(dx, isAnimating)   ← pure function in gestureNavigation.ts
      │  returns: 'food' | 'stuff' | 'none'
      ▼
DashboardScreen handler
      ├── 'none'  → no-op
      ├── 'food'  → start animation → router.push('/find-food')
      └── 'stuff' → start animation → router.push('/find-stuff')
```

The gesture decision logic is extracted into a pure function (`resolveSwipeNavigation`) so it can be property-tested without any React or native dependencies.

---

## Components and Interfaces

### `gestureNavigation.ts` (pure utility)

```typescript
export type SwipeDirection = 'food' | 'stuff' | 'none';

export interface SwipeGesture {
  dx: number;   // horizontal translation in points
}

export interface AnimationConfig {
  duration: number;   // milliseconds
  type: 'slide' | 'fade';
}

/**
 * Resolves a swipe gesture to a navigation target.
 *
 * Rules:
 *   - If isAnimating is true → always 'none'
 *   - If dx < -SWIPE_THRESHOLD → 'food'
 *   - If dx > SWIPE_THRESHOLD  → 'stuff'
 *   - Otherwise               → 'none'
 */
export function resolveSwipeNavigation(
  gesture: SwipeGesture,
  isAnimating: boolean,
): SwipeDirection;

/**
 * Returns the animation config for a navigation event.
 * Respects the OS Reduce Motion accessibility setting.
 */
export function resolveAnimationConfig(reduceMotion: boolean): AnimationConfig;

export const SWIPE_THRESHOLD = 50;  // points
export const ANIMATION_DURATION_NORMAL = 350;   // ms (≤ 400 ms)
export const ANIMATION_DURATION_REDUCED = 150;  // ms (≤ 200 ms)
```

### `DashboardScreen.tsx`

```typescript
interface DashboardScreenProps {
  // No external props — self-contained
}
```

Internal state / values:
- `isAnimating: SharedValue<boolean>` — Reanimated shared value; prevents double-navigation
- `panGesture: PanGesture` — Gesture Handler v2 pan gesture
- `reduceMotion: boolean` — from `useReduceMotion()`

### `FindFoodScreen.tsx` / `FindStuffScreen.tsx`

Stateless placeholder screens. No props. Render a centred label at `FONT_SIZE.xxl` (24 sp) or larger.

### Route files

- `client/app/find-food.tsx` — thin route wrapper that renders `<FindFoodScreen />`
- `client/app/find-stuff.tsx` — thin route wrapper that renders `<FindStuffScreen />`
- `client/app/home.tsx` — updated to render `<DashboardScreen />` instead of the current hero layout

---

## Data Models

No persistent data models are introduced by this feature. All state is ephemeral UI state.

### Shared Values (Reanimated)

| Value | Type | Purpose |
|-------|------|---------|
| `isAnimating` | `SharedValue<boolean>` | Guards against double-navigation during a transition |

### Constants

| Constant | Value | Requirement |
|----------|-------|-------------|
| `SWIPE_THRESHOLD` | `50` points | Req 2.4, 3.4 |
| `ANIMATION_DURATION_NORMAL` | `350` ms | Req 2.2, 3.2, 5.3 (≤ 400 ms) |
| `ANIMATION_DURATION_REDUCED` | `150` ms | Req 5.4 (≤ 200 ms) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Panel height invariant

*For any* positive screen height, the computed height of each panel (Food Panel and Activities Panel) shall equal exactly half the screen height, and the sum of both panel heights shall equal the full screen height.

**Validates: Requirements 1.1**

---

### Property 2: Directional gesture routing

*For any* swipe gesture where `dx < -50` and `isAnimating` is false, `resolveSwipeNavigation` shall return `'food'`. *For any* swipe gesture where `dx > 50` and `isAnimating` is false, `resolveSwipeNavigation` shall return `'stuff'`.

**Validates: Requirements 2.1, 3.1**

---

### Property 3: Sub-threshold gestures are ignored

*For any* swipe gesture where `-50 ≤ dx ≤ 50` (regardless of `isAnimating`), `resolveSwipeNavigation` shall return `'none'`.

**Validates: Requirements 2.4, 3.4**

---

### Property 4: Animation guard prevents double-navigation

*For any* swipe gesture (any `dx` value, any direction), if `isAnimating` is `true`, `resolveSwipeNavigation` shall return `'none'`.

**Validates: Requirements 5.2**

---

### Property 5: Reduce Motion animation config

*For any* navigation event, if `reduceMotion` is `true`, `resolveAnimationConfig` shall return a config with `duration ≤ 200` and `type === 'fade'`. If `reduceMotion` is `false`, it shall return a config with `duration ≤ 400` and `type === 'slide'`.

**Validates: Requirements 5.4, 2.2, 3.2, 5.3**

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Gesture fires while animation is in progress | `isAnimating` guard in `resolveSwipeNavigation` returns `'none'`; no navigation or animation is started |
| `router.push` throws (route not found) | Expo Router will throw a runtime error; destination route files must exist before this feature ships |
| `useReduceMotion()` unavailable (older Reanimated) | Reanimated v4 always provides this hook; no fallback needed given the pinned version |
| Vertical swipe misidentified as horizontal | Gesture Handler's `activeOffsetX` / `failOffsetY` configuration constrains the pan gesture to primarily horizontal movement, preventing false positives |

---

## Testing Strategy

### Unit / Example Tests

Located next to source files (`*.test.ts` / `*.test.tsx`):

- `gestureNavigation.test.ts` — example-based tests for specific `dx` values at the boundary (exactly ±50, ±49, ±51) and for the `resolveAnimationConfig` duration values
- `DashboardScreen.test.tsx` — render tests asserting "Find Food" and "Find Stuff To Do" labels are present, `accessibilityLabel` props are set on both panels, and font sizes meet the ≥ 24 sp requirement on destination screens
- `FindFoodScreen.test.tsx` — render test asserting "Find Food" label at ≥ 24 sp, centred
- `FindStuffScreen.test.tsx` — render test asserting "Find Stuff To Do" label at ≥ 24 sp, centred

### Property-Based Tests

Located in `client/__tests__/properties/gestureNavigation.property.test.ts`.

Uses **fast-check** with `numRuns: 100` per property.

Each test is tagged with the format: `Feature: dashboard-swipe-navigation, Property N: <description>`

| Property | Generator | Assertion |
|----------|-----------|-----------|
| 1 — Panel height invariant | `fc.integer({ min: 1, max: 4000 })` for screen height | `panelHeight === screenHeight / 2` and `panelHeight * 2 === screenHeight` |
| 2 — Directional gesture routing | `fc.integer({ max: -51 })` for left swipe; `fc.integer({ min: 51 })` for right swipe | `resolveSwipeNavigation` returns `'food'` / `'stuff'` respectively |
| 3 — Sub-threshold ignored | `fc.integer({ min: -50, max: 50 })` for dx | `resolveSwipeNavigation` returns `'none'` |
| 4 — Animation guard | `fc.integer()` for dx, `isAnimating = true` | `resolveSwipeNavigation` returns `'none'` |
| 5 — Reduce Motion config | `fc.boolean()` for reduceMotion | Duration and type constraints per reduceMotion value |

### Smoke Tests

- Verify `client/app/find-food.tsx` and `client/app/find-stuff.tsx` exist (route registration, Req 4.1, 4.2)
- Verify Reanimated worklet-based APIs are used in `DashboardScreen.tsx` (Req 5.1 — code review)

### Integration Tests

- Back navigation from `FindFoodScreen` and `FindStuffScreen` restores the dashboard (Req 4.5) — verified manually or via Detox E2E in a future iteration
