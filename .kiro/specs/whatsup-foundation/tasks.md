# Implementation Plan: Wutsup Foundation

## Overview

This plan scaffolds the Wutsup mobile application foundation: a React Native/Expo client, a C# ASP.NET Core Web API, a PostgreSQL database, centralized logging for both tiers, multi-environment configuration, a Docker Compose local development stack, and AI steering files. Tasks are ordered so each step builds on the previous, ending with integration wiring and smoke tests.

## Tasks

- [x] 1. Create steering files for AI-assisted development
  - [x] 1.1 Create product overview steering file at `.kiro/steering/product.md`
    - Describe the product purpose: helping users discover food, restaurants, deals, promotions, events, and local activities
    - Define target users and key features
    - Describe filtering and personalization objectives based on user preferences
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 1.2 Create technology stack steering file at `.kiro/steering/tech.md`
    - Document Client stack: React Native, Expo, strict TypeScript
    - Document API stack: C#, ASP.NET Core, Entity Framework Core, PostgreSQL
    - Document logging strategy for both Client and API
    - Document environment strategy: Local, QA, Staging, Production
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 1.3 Create project structure steering file at `.kiro/steering/structure.md`
    - Define Client folder structure: `/app`, `/components`, `/hooks`, `/screens`, `/services`, `/utils`, `/constants`
    - Define API folder structure: Controllers, Services, Models, Data, Configuration
    - Define naming conventions for files, components, and modules
    - Define import ordering and grouping conventions
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Scaffold the Expo Client project
  - [x] 2.1 Bootstrap React Native/Expo project in `/client`
    - Initialize a new Expo project using the latest Expo SDK in the `/client` folder
    - Configure `tsconfig.json` with `strict: true`
    - Create top-level directories: `/app`, `/components`, `/hooks`, `/screens`, `/services`, `/utils`, `/constants`
    - Verify the project launches without compilation errors via `npx expo start`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 Implement Client configuration loader at `/client/services/config.ts`
    - Create `ClientConfig` interface with fields: `apiBaseUrl`, `logLevel`, `remoteLoggingEnabled`, `environment`
    - Implement `loadConfig()` function that reads from environment variables
    - Throw a descriptive error listing all missing variable names if any required value is absent
    - _Requirements: 6.2, 6.3, 6.5_
  - [x] 2.3 Write property test for Client configuration validation (Property 5)
    - **Property 5: Client configuration validation identifies missing values**
    - Use `fast-check` with minimum 100 iterations
    - For any non-empty subset of required env vars removed, `loadConfig()` throws an error whose message contains all missing variable names
    - **Validates: Requirements 6.5**
  - [x] 2.4 Create environment-specific config files for the Client
    - Create `.env.local`, `.env.qa`, `.env.staging`, `.env.production` in `/client`
    - Each file must include: `API_BASE_URL`, `LOG_LEVEL`, `REMOTE_LOGGING_ENABLED`, `ENVIRONMENT`
    - _Requirements: 6.2, 6.3_
  - [x] 2.5 Implement centralized Client Logger at `/client/services/logger.ts`
    - Create `LogEntry`, `Logger`, and `LoggerConfig` interfaces per design
    - Implement `debug`, `info`, `warn`, `error` methods
    - Each entry must include ISO 8601 timestamp, log level, and source identifier
    - When remote logging is enabled, send entries to the API via HTTP POST
    - When remote logging is disabled, write to device console only
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 2.6 Write property test for Client log entry metadata (Property 1)
    - **Property 1: Client log entries contain required metadata**
    - Use `fast-check` with minimum 100 iterations
    - For any valid log level and any non-empty source string, the formatted log entry contains a valid ISO 8601 timestamp, the log level, and the source identifier
    - **Validates: Requirements 4.5**
  - [x] 2.7 Implement API client at `/client/services/api.ts`
    - Create HTTP client configured with `apiBaseUrl` from config
    - Provide methods for sending remote log entries to the API
    - _Requirements: 4.3_

- [x] 3. Checkpoint — Client project
  - Ensure all client tests pass, ask the user if questions arise.

- [x] 4. Scaffold the C# Web API project
  - [x] 4.1 Create ASP.NET Core Web API project in `/api`
    - Initialize a new ASP.NET Core Web API project targeting the latest .NET LTS version
    - Add Entity Framework Core with the Npgsql (PostgreSQL) provider
    - Add a health-check endpoint at `GET /health` returning HTTP 200
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 4.2 Create EF Core data model and DbContext at `/api/Data/AppDbContext.cs`
    - Define `LogEntry` entity with fields: Id, Timestamp, Level, Message, Source, CorrelationId, CreatedAt
    - Configure the `logs` table with indexes on timestamp (DESC), level, and correlation_id
    - Create initial EF Core migration
    - _Requirements: 5.1, 5.2_
  - [x] 4.3 Implement API configuration and validation
    - Create environment-specific settings files: `appsettings.Local.json`, `appsettings.QA.json`, `appsettings.Staging.json`, `appsettings.Production.json`
    - Each file must include: `ConnectionStrings:DefaultConnection`, `App:Environment`, `App:LogLevel`, `GrowthBook:ApiHost`, `GrowthBook:ClientKey`
    - Implement `ConfigValidator` at `/api/Configuration/ConfigValidator.cs` per design interface
    - On startup, validate configuration and fail with a descriptive error naming missing keys
    - _Requirements: 6.1, 6.3, 6.4_
  - [x] 4.4 Write property test for API configuration validation (Property 4)
    - **Property 4: API configuration validation identifies missing keys**
    - Use `FsCheck` with xUnit adapter, minimum 100 iterations
    - For any non-empty subset of required config keys removed, `ConfigValidator.Validate()` returns a list containing exactly the removed key names
    - **Validates: Requirements 6.4**
  - [x] 4.5 Implement LogLevelFilter at `/api/Services/LogLevelFilter.cs`
    - Implement `ILogLevelFilter` interface per design
    - Non-production environments: all levels pass
    - Production with verbose flag enabled: all levels pass
    - Production with verbose flag disabled: only Warn and Error pass
    - Default to production-safe behavior (warn/error only) when GrowthBook is unreachable
    - _Requirements: 5.3, 5.4, 5.5_
  - [x] 4.6 Write property test for log level filtering (Property 3)
    - **Property 3: Log level filtering correctness**
    - Use `FsCheck` with xUnit adapter, minimum 100 iterations
    - For any log level, any environment, any verbose-flag state: entry passes filter iff environment is non-production, OR level is warn/error, OR verbose flag is enabled
    - **Validates: Requirements 5.3, 5.4, 5.5**
  - [x] 4.7 Implement LoggingService at `/api/Services/LoggingService.cs`
    - Write structured log entries to the `logs` table via EF Core
    - Apply `LogLevelFilter` before persisting
    - Each entry must include: timestamp, level, message, source, correlation identifier
    - Fall back to console logging if the database is unreachable
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 4.8 Write property test for API log entry fields (Property 2)
    - **Property 2: API log entries contain required fields**
    - Use `FsCheck` with xUnit adapter, minimum 100 iterations
    - For any log entry created by the API Logger, the resulting LogEntry has non-null/non-empty values for Timestamp, Level, Message, Source, and the CorrelationId field exists
    - **Validates: Requirements 5.2**
  - [x] 4.9 Implement LogsController at `/api/Controllers/LogsController.cs`
    - Create POST endpoint to receive remote log entries from the Client
    - Validate incoming log entries and persist via LoggingService
    - _Requirements: 4.3, 5.1_

- [x] 5. Checkpoint — API project
  - Ensure all API tests pass, ask the user if questions arise.

- [x] 6. Set up Docker Compose local development environment
  - [x] 6.1 Create Docker Compose file at project root
    - Define PostgreSQL service on port 5432 with database name `wutsup`
    - Define API service on port 5000 with dependency on PostgreSQL
    - Configure health checks so the database is ready before the API starts
    - Database must be ready to accept connections within 30 seconds
    - _Requirements: 3.1, 3.2, 3.3, 7.1, 7.2, 7.3_
  - [x] 6.2 Create API Dockerfile at `/api/Dockerfile`
    - Multi-stage build: restore, build, publish, run
    - Configure to apply EF Core migrations on startup in Local environment
    - _Requirements: 3.4, 7.1_
  - [x] 6.3 Create optional database seed script at `/db/init.sql`
    - Provide seed data or migration scripts so the database is usable after first startup
    - _Requirements: 7.4_

- [x] 7. Integration wiring and smoke tests
  - [x] 7.1 Wire Client to API
    - Ensure the Client API client uses the config-loaded base URL to communicate with the API
    - Verify the Client Logger remote transport sends entries to the LogsController endpoint
    - _Requirements: 4.3, 6.2, 6.3_
  - [x] 7.2 Write integration tests
    - Test health-check endpoint returns HTTP 200
    - Test database connectivity: API can write and read from PostgreSQL
    - Test EF Core migrations table exists after stack startup
    - Test remote logging round-trip: Client sends log to API, verify row in logs table
    - _Requirements: 2.4, 3.1, 3.4, 4.3, 5.1_
  - [x] 7.3 Write smoke tests
    - Verify expected directories exist in `/client` and `/api`
    - Verify `tsconfig.json` has `strict: true`
    - Verify `docker-compose config` succeeds
    - Verify all three steering files exist with expected content sections
    - _Requirements: 1.2, 1.3, 2.1, 7.1, 8.1, 9.1, 10.1_

- [x] 8. Final checkpoint — Full stack validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major tier is complete
- Property tests use `fast-check` (TypeScript) and `FsCheck` (C#) with minimum 100 iterations each
- The Client runs outside Docker via Expo CLI for faster hot reload; only the API and DB run in Docker Compose
