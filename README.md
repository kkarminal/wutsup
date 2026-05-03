# Wutsup

A mobile application that helps users discover food, restaurants, deals, promotions, events, and local activities.

## Project Structure

```
/
├── client/                  # React Native / Expo mobile app (TypeScript)
├── api/                     # C# ASP.NET Core Web API
├── tests/
│   └── Wutsup.Api.Tests/   # API test project (xUnit, FsCheck)
├── db/
│   └── init.sql             # Database seed script
├── docker-compose.yml       # Local dev stack (PostgreSQL + API)
└── .kiro/
    └── steering/            # AI development guidelines
```

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Docker](https://www.docker.com/) and Docker Compose
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo` works without global install)

## Getting Started

### 1. Start the backend (API + Database)

```bash
docker-compose up -d
```

This provisions:
- **PostgreSQL** on `localhost:5432` (database: `wutsup`, user: `wutsup`, password: `wutsup`)
- **API** on `localhost:5000`

The database is seeded with sample data via `db/init.sql`, and EF Core migrations are applied automatically on startup.

Wait a few seconds for the health check to pass, then verify:

```bash
curl http://localhost:5000/health
```

### 2. Start the client

```bash
cd client
npm install
npx expo start
```

The Expo dev server will start. Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the Expo Go app.

The client reads its configuration from `.env.local` by default, which points to `http://localhost:5000`.

### 3. Stop everything

```bash
docker-compose down
```

Add `-v` to also remove the database volume: `docker-compose down -v`

## Running Tests

### Client tests

```bash
cd client
npx jest
```

Runs unit tests, property-based tests (fast-check), and smoke tests.

### API tests

```bash
cd tests/Wutsup.Api.Tests
dotnet test
```

Runs property-based tests (FsCheck), integration tests (using in-memory SQLite), and unit tests.

### Both

```bash
cd client && npx jest && cd ../tests/Wutsup.Api.Tests && dotnet test
```

## Running the API outside Docker

If you prefer running the API directly on your machine (useful for debugging):

```bash
# Start just the database
docker-compose up -d db

# Run the API
cd api
dotnet run
```

The API reads `appsettings.Local.json` by default, which connects to `localhost:5432`.

## Environment Configuration

### Client (`.env.*` files in `/client`)

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Base URL for the API |
| `LOG_LEVEL` | Minimum log severity (`debug`, `info`, `warn`, `error`) |
| `REMOTE_LOGGING_ENABLED` | Send logs to the API (`true` / `false`) |
| `ENVIRONMENT` | Environment name (`local`, `qa`, `staging`, `production`) |

### API (`appsettings.*.json` files in `/api`)

| Key | Description |
|-----|-------------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `App:Environment` | Environment name |
| `App:LogLevel` | Minimum log severity |
| `GrowthBook:ApiHost` | GrowthBook API host |
| `GrowthBook:ClientKey` | GrowthBook client key |

## Useful Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check — returns 200 |
| POST | `/api/logs` | Receive remote log entries from the client |
