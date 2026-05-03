# Wutsup — Testing Standards

## Core Rule

Every new test must pass before the change is considered complete. After writing or modifying tests, always run the full test suite for the affected project to confirm nothing is broken.

## Running Tests

### Client

```bash
cd client
npx jest          # run all client tests
npx jest --watch  # watch mode during development (manual only)
```

### API

```bash
cd tests/Wutsup.Api.Tests
dotnet test       # run all API tests
```

### Full Suite (both projects)

```bash
cd client && npx jest && cd ../tests/Wutsup.Api.Tests && dotnet test
```

Always run the full suite for the affected project after making changes. If both projects are touched, run both.

## Test Organization

### Client (TypeScript / Jest)

| Type | Location | Naming |
|------|----------|--------|
| Unit tests | Next to source file | `<name>.test.ts` |
| Property tests | `client/__tests__/properties/` | `<name>.property.test.ts` |
| Smoke tests | `client/__tests__/` | `smoke.test.ts` |

### API (C# / xUnit)

| Type | Location | Naming |
|------|----------|--------|
| Property tests | `tests/Wutsup.Api.Tests/` | `<Class>PropertyTests.cs` |
| Integration tests | `tests/Wutsup.Api.Tests/` | `IntegrationTests.cs` |
| Unit tests | `tests/Wutsup.Api.Tests/` | `<Class>Tests.cs` |

## Property-Based Testing

- **Client**: Use `fast-check` with a minimum of 100 iterations per property (`numRuns: 100`)
- **API**: Use `FsCheck` with xUnit adapter and a minimum of 100 iterations per property (`MaxTest = 100`)
- Tag every property test with a comment: `Feature: <feature-name>, Property <number>: <description>`

## Workflow

1. Write or modify code
2. Write or update tests for the change
3. Run the new/changed tests to confirm they pass
4. Run the full test suite for the affected project(s) to catch regressions
5. Only consider the task done when all tests are green
