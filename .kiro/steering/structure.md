# Wutsup — Project Structure

## Repository Layout

```
/
├── client/          # React Native/Expo mobile application
├── api/             # C# ASP.NET Core Web API
├── db/              # Database seed scripts and utilities
├── docker-compose.yml
└── .kiro/
    └── steering/    # AI steering files
```

## Client Folder Structure

All client source code lives under `/client`. The following top-level directories organize the codebase by responsibility:

| Directory      | Purpose                                                                 |
|----------------|-------------------------------------------------------------------------|
| `/app`         | Expo Router file-based routes and layouts                               |
| `/components`  | Reusable UI components shared across screens                            |
| `/hooks`       | Custom React hooks for shared stateful logic                            |
| `/screens`     | Full-page screen components rendered by routes                          |
| `/services`    | Business logic, API clients, and platform abstractions (e.g., Logger, Config) |
| `/utils`       | Pure utility functions with no side effects                             |
| `/constants`   | Static values, enums, and configuration constants                       |

### Client File Examples

```
client/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── home.tsx
│       └── explore.tsx
├── components/
│   ├── DealCard.tsx
│   └── EventList.tsx
├── hooks/
│   ├── useLocation.ts
│   └── useAuth.ts
├── screens/
│   ├── HomeScreen.tsx
│   └── SettingsScreen.tsx
├── services/
│   ├── logger.ts
│   ├── config.ts
│   └── api.ts
├── utils/
│   ├── formatDate.ts
│   └── formatDate.test.ts
├── constants/
│   └── colors.ts
└── __tests__/
    └── properties/
        └── logger.property.test.ts
```

## API Folder Structure

All API source code lives under `/api`. The project follows standard ASP.NET Core conventions:

| Directory          | Purpose                                                        |
|--------------------|----------------------------------------------------------------|
| `/Controllers`     | HTTP endpoint handlers (thin — delegate to services)           |
| `/Services`        | Business logic and domain operations                           |
| `/Models`          | Request/response DTOs and domain models                        |
| `/Data`            | EF Core DbContext, entity configurations, and migrations       |
| `/Configuration`   | Startup configuration, validation, and dependency registration |

### API File Examples

```
api/
├── Controllers/
│   ├── HealthController.cs
│   └── LogsController.cs
├── Services/
│   ├── LoggingService.cs
│   ├── ILoggingService.cs
│   ├── LogLevelFilter.cs
│   └── ILogLevelFilter.cs
├── Models/
│   ├── LogEntry.cs
│   └── CreateLogEntryRequest.cs
├── Data/
│   ├── AppDbContext.cs
│   └── Migrations/
├── Configuration/
│   ├── ConfigValidator.cs
│   └── IConfigValidator.cs
├── Program.cs
├── appsettings.json
├── appsettings.Local.json
├── appsettings.QA.json
├── appsettings.Staging.json
└── appsettings.Production.json
```

## Naming Conventions

### Client (TypeScript)

| Element              | Convention         | Example                        |
|----------------------|--------------------|--------------------------------|
| React components     | PascalCase         | `DealCard.tsx`, `EventList.tsx`|
| Component files      | PascalCase `.tsx`  | `HomeScreen.tsx`               |
| Non-component files  | camelCase `.ts`    | `logger.ts`, `formatDate.ts`  |
| Custom hooks         | camelCase, `use` prefix | `useLocation.ts`, `useAuth.ts` |
| Test files           | `<name>.test.ts`   | `formatDate.test.ts`           |
| Property test files  | `<name>.property.test.ts` | `logger.property.test.ts` |
| Constants            | camelCase file, UPPER_SNAKE_CASE values | `colors.ts` → `export const PRIMARY_COLOR = ...` |
| Interfaces/types     | PascalCase, no `I` prefix | `LogEntry`, `ClientConfig` |
| Directories          | camelCase (except `/app` which follows Expo Router) | `components`, `services` |

### API (C#)

| Element              | Convention         | Example                        |
|----------------------|--------------------|--------------------------------|
| Classes              | PascalCase         | `LoggingService`, `LogEntry`   |
| Interfaces           | PascalCase, `I` prefix | `ILoggingService`, `IConfigValidator` |
| Files                | PascalCase, one class per file | `LoggingService.cs`    |
| Methods              | PascalCase         | `ShouldLog()`, `Validate()`    |
| Properties           | PascalCase         | `CorrelationId`, `Timestamp`   |
| Private fields       | `_camelCase`       | `_dbContext`, `_logger`        |
| Constants            | PascalCase         | `MaxRetryCount`                |
| Controllers          | PascalCase, `Controller` suffix | `HealthController.cs` |
| DTOs / request models| PascalCase, descriptive suffix | `CreateLogEntryRequest.cs` |
| Test files           | `<Class>Tests.cs`  | `LogLevelFilterTests.cs`       |
| Property test files  | `<Class>PropertyTests.cs` | `LogLevelFilterPropertyTests.cs` |
| Directories          | PascalCase         | `Controllers`, `Services`      |

## Import Ordering and Grouping

### Client (TypeScript)

Imports are organized into groups separated by a blank line, in this order:

```typescript
// 1. React and React Native core
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { useRouter } from 'expo-router';
import * as fc from 'fast-check';

// 3. Internal modules — services, hooks, utils, constants
import { logger } from '@/services/logger';
import { useLocation } from '@/hooks/useLocation';
import { formatDate } from '@/utils/formatDate';
import { PRIMARY_COLOR } from '@/constants/colors';

// 4. Relative imports — sibling components, local types
import { DealCard } from './DealCard';
import type { DealCardProps } from './DealCard';
```

- Use the `@/` path alias for imports from the project root (e.g., `@/services/logger`)
- Use relative paths only for sibling or closely related files in the same directory
- Place `type` imports after value imports from the same group, or use `import type` syntax

### API (C#)

`using` directives are organized into groups separated by a blank line, in this order:

```csharp
// 1. System namespaces
using System;
using System.Collections.Generic;

// 2. Microsoft / ASP.NET namespaces
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// 3. Third-party namespaces
using GrowthBook;

// 4. Project namespaces
using Wutsup.Api.Data;
using Wutsup.Api.Models;
using Wutsup.Api.Services;
```

- Sort alphabetically within each group
- Place `global using` directives in a dedicated `GlobalUsings.cs` file if needed
- Do not use wildcard or static imports unless there is a clear readability benefit
