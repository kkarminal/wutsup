# Requirements Document

## Introduction

Wutsup is a mobile application that helps users discover food, restaurants, deals, promotions, events, and local activities. The foundation spec covers the initial project scaffolding: a React Native/Expo client, a C# Web API backend, a PostgreSQL database, multi-environment support (local, QA, staging, production), centralized logging, and workspace steering files for consistent development practices.

## Glossary

- **Client**: The React Native/Expo mobile application located in the `/client` folder.
- **API**: The C# ASP.NET Core Web API backend located in the `/api` folder.
- **Database**: The PostgreSQL relational database used by the API for persistent storage.
- **Local_Environment**: A development environment running entirely on the developer's machine, including a local PostgreSQL instance and local API server.
- **QA_Environment**: A shared testing environment used for quality assurance validation before staging.
- **Staging_Environment**: A pre-production environment that mirrors production configuration for final validation.
- **Production_Environment**: The live environment serving end users.
- **Logger**: A centralized logging abstraction used by both the Client and the API to produce structured log output.
- **Log_Level**: A severity classification for log entries: debug, info, warn, or error.
- **GrowthBook**: A feature-flagging service used to control runtime behavior such as log-level filtering in production.
- **Steering_File**: A markdown document in `.kiro/steering/` that provides development guidance and conventions to AI-assisted tooling.
- **Environment_Configuration**: A set of environment-specific variables and settings that control how the Client and API connect to services and behave at runtime.

## Requirements

### Requirement 1: Expo Client Project Scaffolding

**User Story:** As a developer, I want a React Native/Expo client project scaffolded in the `/client` folder with strict TypeScript and a well-defined folder structure, so that I can begin building mobile features on a consistent foundation.

#### Acceptance Criteria

1. THE Client SHALL be a React Native application bootstrapped with the latest version of Expo in the `/client` folder.
2. THE Client SHALL enforce strict TypeScript compilation with `strict: true` in `tsconfig.json`.
3. THE Client SHALL organize source code into the following top-level directories: `/app`, `/components`, `/hooks`, `/screens`, `/services`, `/utils`, and `/constants`.
4. WHEN a developer runs the Expo start command from the `/client` folder, THE Client SHALL launch without compilation errors.

### Requirement 2: C# Web API Project Scaffolding

**User Story:** As a developer, I want a C# ASP.NET Core Web API project scaffolded in the `/api` folder, so that I can begin building backend endpoints on a consistent foundation.

#### Acceptance Criteria

1. THE API SHALL be an ASP.NET Core Web API project located in the `/api` folder.
2. THE API SHALL target the latest LTS version of .NET.
3. THE API SHALL include Entity Framework Core configured to use PostgreSQL as its database provider.
4. WHEN a developer runs the API from the `/api` folder, THE API SHALL start and respond to a health-check endpoint with an HTTP 200 status code.

### Requirement 3: PostgreSQL Database Setup

**User Story:** As a developer, I want a PostgreSQL database provisioned for local development, so that the API can persist and retrieve data from the start.

#### Acceptance Criteria

1. THE Local_Environment SHALL include a PostgreSQL instance accessible to the API.
2. THE Database SHALL be provisionable via a Docker Compose file located at the project root.
3. WHEN the Docker Compose stack is started, THE Database SHALL be ready to accept connections within 30 seconds.
4. THE API SHALL apply Entity Framework Core migrations to the Database on startup in the Local_Environment.

### Requirement 4: Centralized Client Logging

**User Story:** As a developer, I want all client-side logging routed through a centralized Logger component, so that log output is consistent and controllable.

#### Acceptance Criteria

1. THE Client SHALL provide a centralized Logger module that exposes debug, info, warn, and error methods.
2. THE Client SHALL route all log output through the Logger module instead of using direct `console.log` calls.
3. WHEN remote logging is enabled, THE Logger SHALL send log entries to the API via an HTTP endpoint.
4. WHEN remote logging is disabled, THE Logger SHALL write log entries to the local device console only.
5. THE Logger SHALL include a timestamp, Log_Level, and source identifier with each log entry.

### Requirement 5: API Logging with Database Storage

**User Story:** As a developer, I want API logs stored in a database table, so that I can query and analyze backend behavior across environments.

#### Acceptance Criteria

1. THE API SHALL provide a centralized Logger that writes structured log entries to a dedicated `logs` table in the Database.
2. THE API SHALL include the following fields in each log entry: timestamp, Log_Level, message, source, and correlation identifier.
3. WHILE the Production_Environment is active, THE API SHALL log only warn and error level entries by default.
4. WHEN the GrowthBook feature flag for verbose logging is enabled in the Production_Environment, THE API SHALL log all Log_Level entries.
5. WHILE the Local_Environment, QA_Environment, or Staging_Environment is active, THE API SHALL log all Log_Level entries.

### Requirement 6: Multi-Environment Configuration

**User Story:** As a developer, I want environment-specific configuration for local, QA, staging, and production, so that each environment connects to the correct services with appropriate settings.

#### Acceptance Criteria

1. THE API SHALL load Environment_Configuration from environment-specific settings files (e.g., `appsettings.Local.json`, `appsettings.QA.json`, `appsettings.Staging.json`, `appsettings.Production.json`).
2. THE Client SHALL load Environment_Configuration from environment-specific configuration (e.g., `.env.local`, `.env.qa`, `.env.staging`, `.env.production`).
3. THE Environment_Configuration SHALL include at minimum: API base URL, database connection string (API only), and log level.
4. IF an expected Environment_Configuration value is missing at startup, THEN THE API SHALL fail to start and log a descriptive error message identifying the missing value.
5. IF an expected Environment_Configuration value is missing at startup, THEN THE Client SHALL display a descriptive error identifying the missing value.

### Requirement 7: Local Development Environment

**User Story:** As a developer, I want a single command to spin up the full local development stack, so that I can start working without manual setup steps.

#### Acceptance Criteria

1. THE Local_Environment SHALL be startable via a Docker Compose file at the project root that provisions the Database and the API.
2. WHEN the Docker Compose stack is started, THE API SHALL be accessible on a documented local port.
3. WHEN the Docker Compose stack is started, THE Database SHALL be accessible on a documented local port.
4. THE Local_Environment SHALL include seed data or migration scripts so that the Database is in a usable state after first startup.

### Requirement 8: Product Overview Steering File

**User Story:** As a developer, I want a product overview steering file, so that AI-assisted tooling understands the product's purpose, target users, and business objectives.

#### Acceptance Criteria

1. THE Steering_File located at `.kiro/steering/product.md` SHALL describe the product's purpose as helping users discover food, restaurants, deals, promotions, events, and local activities.
2. THE Steering_File located at `.kiro/steering/product.md` SHALL define the target users and key features of the application.
3. THE Steering_File located at `.kiro/steering/product.md` SHALL describe the filtering and personalization objectives based on user preferences.

### Requirement 9: Technology Stack Steering File

**User Story:** As a developer, I want a technology stack steering file, so that AI-assisted tooling uses the correct frameworks, libraries, and conventions.

#### Acceptance Criteria

1. THE Steering_File located at `.kiro/steering/tech.md` SHALL document the Client technology stack including React Native and Expo.
2. THE Steering_File located at `.kiro/steering/tech.md` SHALL document the API technology stack including C#, ASP.NET Core, Entity Framework Core, and PostgreSQL.
3. THE Steering_File located at `.kiro/steering/tech.md` SHALL enforce strict TypeScript for the Client.
4. THE Steering_File located at `.kiro/steering/tech.md` SHALL document the logging strategy for both Client and API.
5. THE Steering_File located at `.kiro/steering/tech.md` SHALL document the environment strategy covering Local, QA, Staging, and Production.

### Requirement 10: Project Structure Steering File

**User Story:** As a developer, I want a project structure steering file, so that AI-assisted tooling follows consistent file organization and naming conventions.

#### Acceptance Criteria

1. THE Steering_File located at `.kiro/steering/structure.md` SHALL define the Client folder structure including `/app`, `/components`, `/hooks`, `/screens`, `/services`, `/utils`, and `/constants`.
2. THE Steering_File located at `.kiro/steering/structure.md` SHALL define the API folder structure including controllers, services, models, data access, and configuration directories.
3. THE Steering_File located at `.kiro/steering/structure.md` SHALL define naming conventions for files, components, and modules in both Client and API.
4. THE Steering_File located at `.kiro/steering/structure.md` SHALL define import ordering and grouping conventions.
