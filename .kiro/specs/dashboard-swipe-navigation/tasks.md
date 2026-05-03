# Implementation Plan: Dashboard Swipe Navigation

## Overview

Transform `client/app/home.tsx` into an interactive split-panel dashboard with horizontal swipe gesture navigation. The implementation is broken into five incremental steps: the pure gesture utility (fully testable without React), the two placeholder destination screens, the `DashboardScreen` component with Reanimated v4 + Gesture Handler v2, wiring everything into the Expo Router layout, and a final validation checkpoint.

All code is TypeScript with `strict: true`. No new dependencies are required — `react-native-reanimated ~4.1.1`, `react-native-gesture-handler ~2.28.0`, and `fast-check ^4.7.0` are already present in `client/package.json`.

## Tasks

- [x] 1. Create the gesture navigation utility
  - Create `client/utils/gestureNavigation.ts` with the following exports:
    - `SWIPE_THRESHOLD = 50` (points)
    - `ANIMATION_DURATION_NORMAL = 350` (ms)
    - `ANIMATION_DURATION_REDUCED = 150` (ms)
    - `SwipeDirection` type: `'food' | 'stuff' | 'none'`
    - `SwipeGesture` interface: `{ dx: number }`
    - `AnimationConfig` interface: `{ duration: number; type: 'slide' | 'fade' }`
    - `resolveSwipeNavigation(gesture: SwipeGesture, isAnimating: boolean): SwipeDirection` — returns `'food'` when `dx < -SWIPE_THRESHOLD` and not animating, `'stuff'` when `dx > SWIPE_THRESHOLD` and not animating, `'none'` otherwise or when `isAnimating` is `true`
    - `resolveAnimationConfig(reduceMotion: boolean): AnimationConfig` — returns `{ duration: ANIMATION_DURATION_REDUCED, type: 'fade' }` when `reduceMotion` is `true`, otherwise `{ duration: ANIMATION_DURATION_NORMAL, type: 'slide' }`
  - This is a pure module with no React or native imports — it must be importable in a plain Jest environment
  - _Requirements: 2.1, 2.4, 3.1, 3.4, 5.2, 5.3, 5.4_

  - [x] 1.1 Write example-based unit tests for the gesture utility
    - Create `client/utils/gestureNavigation.test.ts`
    - Test `resolveSwipeNavigation` at exact boundary values: `dx = -50` (none), `dx = -51` (food), `dx = 50` (none), `dx = 51` (stuff)
    - Test that `isAnimating = true` always returns `'none'` regardless of `dx`
    - Test `resolveAnimationConfig(true)` returns `duration ≤ 200` and `type === 'fade'`
    - Test `resolveAnimationConfig(false)` returns `duration ≤ 400` and `type === 'slide'`
    - _Requirements: 2.1, 2.4, 3.1, 3.4, 5.2, 5.3, 5.4_

  - [x] 1.2 Write property-based tests for the gesture utility
    - Create `client/__tests__/properties/gestureNavigation.property.test.ts`
    - Use `fast-check` with `numRuns: 100` for every property
    - Tag each test with `// Feature: dashboard-swipe-navigation, Property N: <description>`
    - **Property 2: Directional gesture routing** — `fc.integer({ max: -51 })` for left swipe → `resolveSwipeNavigation` returns `'food'`; `fc.integer({ min: 51 })` for right swipe → returns `'stuff'`; `isAnimating = false` in both cases
    - **Property 3: Sub-threshold gestures are ignored** — `fc.integer({ min: -50, max: 50 })` for `dx` → `resolveSwipeNavigation` returns `'none'` regardless of `isAnimating`
    - **Property 4: Animation guard prevents double-navigation** — `fc.integer()` for `dx`, `isAnimating = true` → `resolveSwipeNavigation` always returns `'none'`
    - **Property 5: Reduce Motion animation config** — `fc.boolean()` for `reduceMotion` → when `true`: `duration ≤ 200` and `type === 'fade'`; when `false`: `duration ≤ 400` and `type === 'slide'`
    - _Requirements: 2.1, 2.4, 3.1, 3.4, 5.2, 5.3, 5.4_

- [x] 2. Create placeholder destination screens and route files
  - Create `client/screens/FindFoodScreen.tsx` — stateless component rendering a centred label "Find Food" at font size ≥ 24 sp; no props
  - Create `client/screens/FindStuffScreen.tsx` — stateless component rendering a centred label "Find Stuff To Do" at font size ≥ 24 sp; no props
  - Create `client/app/find-food.tsx` — thin Expo Router route file that renders `<FindFoodScreen />`
  - Create `client/app/find-stuff.tsx` — thin Expo Router route file that renders `<FindStuffScreen />`
  - Both screens must be full-screen, centred layouts using `StyleSheet.create`; use `FONT_SIZE` constants from `client/constants/colors.ts` where available, ensuring the value is ≥ 24
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.1 Write render tests for the destination screens
    - Create `client/screens/FindFoodScreen.test.tsx` — assert "Find Food" label is present and font size ≥ 24
    - Create `client/screens/FindStuffScreen.test.tsx` — assert "Find Stuff To Do" label is present and font size ≥ 24
    - _Requirements: 4.3, 4.4_

- [x] 3. Checkpoint — run the test suite
  - Run `npx jest` from the `client` directory and confirm all tests pass before proceeding to the `DashboardScreen` implementation.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement `DashboardScreen`
  - Create `client/screens/DashboardScreen.tsx`
  - Render two equal-height panels that together fill the full screen height using `flex: 1` on each panel inside a `flex: 1` container (satisfies the panel height invariant — Property 1)
  - Food Panel: distinct background colour, label "Find Food", `accessibilityLabel="Find Food panel — swipe left to explore food options"`
  - Activities Panel: distinct background colour, label "Find Stuff To Do", `accessibilityLabel="Find Stuff To Do panel — swipe right to explore activities"`
  - Use `useSharedValue<boolean>(false)` from Reanimated v4 for the `isAnimating` guard
  - Use `useReduceMotion()` from Reanimated v4 to read the OS accessibility setting
  - Compose a `Gesture.Pan()` from Gesture Handler v2 with `activeOffsetX` and `failOffsetY` configured to constrain to horizontal movement; in `onEnd`, call `resolveSwipeNavigation` from `gestureNavigation.ts`, then branch on the result:
    - `'food'` → set `isAnimating.value = true`, call `resolveAnimationConfig(reduceMotion)` to get duration/type, start the appropriate Reanimated animation, then call `router.push('/find-food')` and reset `isAnimating.value = false` in the animation callback
    - `'stuff'` → same pattern but `router.push('/find-stuff')`
    - `'none'` → no-op
  - Wrap the two panels in `<GestureDetector gesture={panGesture}>` from Gesture Handler v2
  - All animation logic must use Reanimated worklets (runs on the UI thread, satisfying Requirement 5.1)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.1 Write property-based test for the panel height invariant
    - Add to `client/__tests__/properties/gestureNavigation.property.test.ts` (or a new file if preferred)
    - Tag: `// Feature: dashboard-swipe-navigation, Property 1: Panel height invariant`
    - **Property 1: Panel height invariant** — `fc.integer({ min: 1, max: 4000 })` for screen height → `panelHeight === screenHeight / 2` and `panelHeight * 2 === screenHeight`, where `panelHeight` is computed using the same formula used in `DashboardScreen` (extract the height calculation into a pure helper if needed)
    - Use `numRuns: 100`
    - _Requirements: 1.1_

  - [x] 4.2 Write render tests for `DashboardScreen`
    - Create `client/screens/DashboardScreen.test.tsx`
    - Assert "Find Food" label is present
    - Assert "Find Stuff To Do" label is present
    - Assert both panels have the correct `accessibilityLabel` values
    - _Requirements: 1.2, 1.3, 1.5_

- [x] 5. Wire destination routes into the Expo Router layout and update `home.tsx`
  - Update `client/app/_layout.tsx` to register the two new routes:
    - `<Stack.Screen name="find-food" options={{ headerShown: false }} />`
    - `<Stack.Screen name="find-stuff" options={{ headerShown: false }} />`
  - Update `client/app/home.tsx` to replace the current hero layout with `<DashboardScreen />` — import `DashboardScreen` from `@/screens/DashboardScreen` and render it as the sole child
  - Verify back navigation from `FindFoodScreen` and `FindStuffScreen` returns to the dashboard by confirming the Expo Router stack is configured correctly (no `replace` — use `push` so the back gesture restores the dashboard)
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 6. Final checkpoint — run the full test suite
  - Run `npx jest` from the `client` directory and confirm all tests pass.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `numRuns: 100` per property, tagged with `Feature: dashboard-swipe-navigation, Property N: <description>`
- The `resolveSwipeNavigation` and `resolveAnimationConfig` functions are pure and have no React or native dependencies, making them straightforward to test in Jest without mocking
- `isAnimating` is a Reanimated `SharedValue<boolean>` (not React state) so it can be read and written safely inside worklets on the UI thread
- The panel height invariant (Property 1) can be tested by extracting the height calculation into a pure helper function exported from `DashboardScreen.tsx` or `gestureNavigation.ts`
