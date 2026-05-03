# Requirements Document

## Introduction

The dashboard swipe navigation feature transforms the Wutsup home screen (dashboard) into an interactive split-panel entry point. The screen is divided into two visually distinct vertical sections — one for "Find Food" and one for "Find Stuff To Do". Users can swipe left to navigate to the Find Food screen or swipe right to navigate to the Find Stuff To Do screen. Each navigation is accompanied by a smooth, purposeful animation. The two destination screens are placeholder screens with labels for now, ready to be built out in future iterations.

## Glossary

- **Dashboard**: The main home screen of the Wutsup mobile app, currently rendered by `client/app/home.tsx`.
- **Split_Panel**: The two-section layout on the Dashboard, where each section occupies half the screen vertically and is styled distinctly.
- **Food_Panel**: The upper or lower section of the Split_Panel associated with the "Find Food" destination.
- **Activities_Panel**: The other section of the Split_Panel associated with the "Find Stuff To Do" destination.
- **Swipe_Gesture**: A horizontal swipe gesture detected on the Dashboard.
- **Find_Food_Screen**: The destination screen reached by swiping left from the Dashboard.
- **Find_Stuff_Screen**: The destination screen reached by swiping right from the Dashboard.
- **Navigation_Animation**: The animated transition played when navigating from the Dashboard to a destination screen.
- **Gesture_Handler**: The React Native gesture detection layer responsible for recognising swipe direction and distance.

---

## Requirements

### Requirement 1: Split-Panel Dashboard Layout

**User Story:** As a user, I want the dashboard to show two visually distinct sections, so that I can immediately understand my two main discovery options.

#### Acceptance Criteria

1. THE Dashboard SHALL render two equal-height panels that together fill the full screen height.
2. THE Food_Panel SHALL display a label identifying it as the "Find Food" option.
3. THE Activities_Panel SHALL display a label identifying it as the "Find Stuff To Do" option.
4. THE Food_Panel and THE Activities_Panel SHALL each use a distinct background colour, typography style, or visual treatment so that the two sections are clearly differentiated from one another.
5. THE Split_Panel layout SHALL be accessible, with each panel providing an `accessibilityLabel` that describes its purpose to screen readers.

---

### Requirement 2: Swipe-Left Navigates to Find Food

**User Story:** As a user, I want to swipe left on the dashboard, so that I can navigate to the Find Food screen.

#### Acceptance Criteria

1. WHEN the user performs a left swipe gesture on the Dashboard, THE Gesture_Handler SHALL detect the gesture and trigger navigation to the Find_Food_Screen.
2. WHEN navigation to the Find_Food_Screen is triggered, THE Navigation_Animation SHALL play a slide-left transition that completes within 400 ms.
3. WHEN the Find_Food_Screen is displayed, THE Find_Food_Screen SHALL render a visible label reading "Find Food".
4. IF the swipe gesture does not travel at least 50 points horizontally, THEN THE Gesture_Handler SHALL ignore the gesture and leave the Dashboard in its current state.

---

### Requirement 3: Swipe-Right Navigates to Find Stuff To Do

**User Story:** As a user, I want to swipe right on the dashboard, so that I can navigate to the Find Stuff To Do screen.

#### Acceptance Criteria

1. WHEN the user performs a right swipe gesture on the Dashboard, THE Gesture_Handler SHALL detect the gesture and trigger navigation to the Find_Stuff_Screen.
2. WHEN navigation to the Find_Stuff_Screen is triggered, THE Navigation_Animation SHALL play a slide-right transition that completes within 400 ms.
3. WHEN the Find_Stuff_Screen is displayed, THE Find_Stuff_Screen SHALL render a visible label reading "Find Stuff To Do".
4. IF the swipe gesture does not travel at least 50 points horizontally, THEN THE Gesture_Handler SHALL ignore the gesture and leave the Dashboard in its current state.

---

### Requirement 4: Destination Screen Placeholder Content

**User Story:** As a developer, I want the two destination screens to exist as labelled placeholders, so that future feature work can build on them without needing to restructure navigation.

#### Acceptance Criteria

1. THE Find_Food_Screen SHALL be registered as a navigable route within the Expo Router file-based routing system.
2. THE Find_Stuff_Screen SHALL be registered as a navigable route within the Expo Router file-based routing system.
3. THE Find_Food_Screen SHALL display its label in a legible font size of at least 24 sp, centred on the screen.
4. THE Find_Stuff_Screen SHALL display its label in a legible font size of at least 24 sp, centred on the screen.
5. WHEN the user navigates back from either destination screen, THE Dashboard SHALL be restored to its previous visual state.

---

### Requirement 5: Animation Quality and Performance

**User Story:** As a user, I want the swipe navigation animations to feel smooth and native, so that the app feels polished and responsive.

#### Acceptance Criteria

1. THE Navigation_Animation SHALL run on the native UI thread using React Native's Animated API or Reanimated, so that the animation is not blocked by JavaScript execution.
2. WHILE a Navigation_Animation is in progress, THE Gesture_Handler SHALL ignore additional swipe gestures to prevent double-navigation.
3. THE Navigation_Animation SHALL complete within 400 ms under normal device load conditions.
4. WHERE the device has enabled the "Reduce Motion" accessibility setting, THE Dashboard SHALL substitute the Navigation_Animation with a cross-fade transition of no more than 200 ms.
