# Wutsup — Technology Stack

## Client

- **Framework:** React Native with Expo (managed workflow, latest SDK)
- **Language:** TypeScript with `strict: true` enforced in `tsconfig.json`
- **Routing:** Expo Router (file-based routing)
- **Icons:** `@expo/vector-icons` — use the **Ionicons** set exclusively (`import { Ionicons } from '@expo/vector-icons'`). Do not install or use any other icon library (react-native-vector-icons, lucide-react-native, etc.) unless a required icon is genuinely absent from Ionicons and no reasonable alternative exists.
- **Buttons:** Always use `ThemedButton` from `client/components/ThemedButton.tsx` — never use a raw `Pressable` + `Text` pair as a button. See the [ThemedButton standard](#themedbutton-standard) below.
- **UI Components:** `@expo/ui` — use native Expo UI components wherever available before reaching for plain React Native primitives or third-party libraries
- **State & data fetching:** Keep dependencies minimal during foundation; add libraries as features require them
- **Testing:** Jest (unit tests), fast-check (property-based tests, minimum 100 iterations per property)

### Expo UI Guidelines

`@expo/ui` renders true native components — SwiftUI on iOS and Jetpack Compose on Android. Always prefer it over JS-based equivalents when a component is available.

**Installation:**
```sh
npx expo install @expo/ui
```

**Import paths:**
- iOS (SwiftUI): `@expo/ui/swift-ui`
- Android (Jetpack Compose): `@expo/ui/jetpack-compose`
- Modifiers: `@expo/ui/swift-ui/modifiers`

**Available components (both platforms unless noted):**
| Component | Notes |
|-----------|-------|
| `CircularProgress` | Native loading spinner |
| `LinearProgress` | Native progress bar |
| `Text` | Native text (use inside `Host`) |
| `HStack` / `VStack` | Native layout stacks |
| `DateTimePicker` | Drop-in for `@react-native-community/datetimepicker` |
| `SegmentedControl` | Drop-in for `@react-native-segmented-control/segmented-control` |

**Usage rules:**
- SwiftUI and Jetpack Compose components must be wrapped in a `Host` component, which bridges the React Native (UIKit) boundary
- Use `matchContents` on `Host` when the native content should size itself rather than fill the parent
- Apply SwiftUI modifiers (e.g., `padding`, `glassEffect`) via the `modifiers` prop, imported from `@expo/ui/swift-ui/modifiers`
- For components not yet available in `@expo/ui`, fall back to React Native core primitives — do not introduce a third-party UI library just to fill a gap

**Example:**
```tsx
import { CircularProgress, Host, HStack, LinearProgress } from '@expo/ui/swift-ui';

export function LoadingView() {
  return (
    <Host style={{ flex: 1, margin: 32 }}>
      <HStack spacing={16}>
        <CircularProgress />
        <LinearProgress progress={0.5} />
      </HStack>
    </Host>
  );
}
```

### ThemedButton Standard

All interactive buttons in the client **must** use `ThemedButton` from `client/components/ThemedButton.tsx`. Never use a raw `Pressable` + `Text` pair as a standalone button.

**Import:**
```tsx
import { ThemedButton } from '@/components/ThemedButton';
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Button text |
| `onPress` | `() => void` | required | Press handler |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding and font size |
| `iconLeft` | Ionicons name | — | Icon rendered left of label |
| `iconRight` | Ionicons name | — | Icon rendered right of label |
| `disabled` | `boolean` | `false` | Disables interaction |
| `loading` | `boolean` | `false` | Shows spinner, disables interaction |
| `fullWidth` | `boolean` | `false` | Stretches to parent width |
| `accessibilityLabel` | `string` | `label` | Override for screen readers |

**Variants:**
- `primary` — filled brand-blue background; use for the main call-to-action
- `secondary` — outlined with a brand-blue border; use for secondary actions
- `ghost` — no border or background, text only; use for low-emphasis actions
- `danger` — filled error-red background; use for destructive actions

**Border radius:** `4 px` (slightly rounded — `RADIUS.sm`) on all variants.

**Examples:**
```tsx
// Primary action
<ThemedButton label="Save" onPress={handleSave} />

// Secondary with icon
<ThemedButton
  label="Cancel"
  onPress={handleCancel}
  variant="secondary"
  iconLeft="close-outline"
/>

// Full-width danger
<ThemedButton
  label="Delete account"
  onPress={handleDelete}
  variant="danger"
  fullWidth
/>

// Loading state
<ThemedButton label="Submitting…" onPress={() => {}} loading />
```

## Admin

- **Framework:** React with Vite
- **Language:** TypeScript with `strict: true`
- **Routing:** React Router DOM
- **UI Components:** Material UI (MUI) — use `@mui/material` components throughout; do not use plain HTML elements or custom CSS where MUI equivalents exist
- **Testing:** Jest (unit tests), fast-check (property-based tests, minimum 100 iterations per property)

## API

- **Framework:** ASP.NET Core Web API (latest .NET LTS)
- **Language:** C#
- **ORM:** Entity Framework Core with code-first migrations
- **Database:** PostgreSQL (via Npgsql provider)
- **Feature flags:** GrowthBook for runtime behavior control (e.g., log-level toggling in production)
- **Testing:** xUnit (unit tests), FsCheck with xUnit adapter (property-based tests, minimum 100 iterations per property)

## Logging Strategy

### Client Logging

- All log output goes through a centralized `Logger` module — never use `console.log` directly
- The Logger exposes four severity methods: `debug`, `info`, `warn`, `error`
- Every log entry includes an ISO 8601 timestamp, the log level, and a source identifier
- **Remote logging enabled:** entries are sent to the API via HTTP POST to the `/logs` endpoint
- **Remote logging disabled:** entries are written to the device console only
- If the remote endpoint is unreachable, the Logger silently falls back to console-only output

### API Logging

- A centralized `LoggingService` writes structured log entries to a `logs` table in PostgreSQL
- Each entry includes: timestamp, level, message, source, and correlation identifier
- A `LogLevelFilter` controls which entries are persisted based on environment and feature flags:
  - **Local, QA, Staging:** all log levels are persisted
  - **Production (verbose flag off):** only `warn` and `error` are persisted
  - **Production (verbose flag on via GrowthBook):** all log levels are persisted
- If the database is unreachable, the LoggingService falls back to console logging
- If GrowthBook is unreachable, the filter defaults to production-safe behavior (warn and error only)

## Environment Strategy

The application supports four environments. Each environment has its own configuration files.

| Environment | Purpose | Client Config | API Config |
|-------------|---------|---------------|------------|
| **Local** | Developer machine; full stack via Docker Compose | `.env.local` | `appsettings.Local.json` |
| **QA** | Shared testing and quality assurance | `.env.qa` | `appsettings.QA.json` |
| **Staging** | Pre-production mirror for final validation | `.env.staging` | `appsettings.Staging.json` |
| **Production** | Live environment serving end users | `.env.production` | `appsettings.Production.json` |

### Client Configuration Keys

- `API_BASE_URL` — Base URL for the API
- `LOG_LEVEL` — Minimum log severity (`debug`, `info`, `warn`, `error`)
- `REMOTE_LOGGING_ENABLED` — Whether to send logs to the API (`true` / `false`)
- `ENVIRONMENT` — Current environment name

### API Configuration Keys

- `ConnectionStrings:DefaultConnection` — PostgreSQL connection string
- `App:Environment` — Current environment name
- `App:LogLevel` — Minimum log severity
- `GrowthBook:ApiHost` — GrowthBook API host URL
- `GrowthBook:ClientKey` — GrowthBook client key

### Configuration Validation

- The API validates all required keys on startup and fails with a descriptive error naming any missing keys
- The Client validates all required environment variables on load and throws an error listing any missing variable names

## Local Development

- **Docker Compose** at the project root provisions PostgreSQL (port 5432) and the API (port 5000)
- The Client runs outside Docker via Expo CLI on the host machine for faster hot reload
- EF Core migrations are applied automatically on API startup in the Local environment
- The database is ready to accept connections within 30 seconds of `docker-compose up`
