# Requirements Document

## Introduction

The Admin Portal is a separate React web application that provides an administrative interface for the Wutsup platform. It is distinct from the existing React Native mobile client and targets internal operators and administrators. The initial scope covers a login page, a protected dashboard, a new `users` database table, and a `UsersController` in the API that supports login and is designed to accommodate additional user management operations in the future. Authentication is enforced via JWT tokens issued by the API.

## Glossary

- **Admin_Portal**: The React web application located in the `/admin` folder, used by administrators to manage the Wutsup platform.
- **API**: The existing C# ASP.NET Core Web API backend located in the `/api` folder.
- **Database**: The existing PostgreSQL relational database used by the API.
- **User**: A record in the `users` table representing an account that can authenticate with the system.
- **Role**: A string value stored on a User record that classifies the account's permission level (e.g., `user`, `admin`). The role system is extensible and not limited to a fixed boolean.
- **JWT**: A JSON Web Token issued by the API upon successful login, used by the Admin_Portal to authenticate subsequent requests.
- **Protected_Route**: A route in the Admin_Portal that requires a valid JWT to access. Unauthenticated visitors are redirected to the login page.
- **Login_Page**: The entry point of the Admin_Portal where a User submits credentials to obtain a JWT.
- **Dashboard_Page**: The landing page of the Admin_Portal displayed after a successful login. It is a Protected_Route.
- **UsersController**: The ASP.NET Core controller in the API responsible for user-related operations, starting with login.
- **PasswordHasher**: The API component responsible for hashing passwords before storage and verifying hashed passwords during login.

## Requirements

### Requirement 1: Admin Portal Project Scaffolding

**User Story:** As a developer, I want a React web application scaffolded in the `/admin` folder with strict TypeScript, so that I can build admin features on a consistent, isolated foundation separate from the mobile client.

#### Acceptance Criteria

1. THE Admin_Portal SHALL be a React web application located in the `/admin` folder.
2. THE Admin_Portal SHALL enforce strict TypeScript compilation with `strict: true` in `tsconfig.json`.
3. THE Admin_Portal SHALL be a standalone project with its own `package.json`, independent of the `/client` React Native project.
4. WHEN a developer runs the Admin_Portal development server from the `/admin` folder, THE Admin_Portal SHALL start without compilation errors.

---

### Requirement 2: Users Database Table

**User Story:** As a developer, I want a `users` table in the database with username, hashed password, and an extensible role field, so that the system can store and authenticate admin accounts.

#### Acceptance Criteria

1. THE Database SHALL contain a `users` table with the following columns: a surrogate primary key, a `username` column storing an email address, a `password_hash` column storing a hashed password, a `role` column storing a string role value, and `created_at` and `updated_at` timestamp columns.
2. THE `username` column in the `users` table SHALL have a unique constraint to prevent duplicate accounts.
3. THE `role` column in the `users` table SHALL be a variable-length string type to support extensible role values beyond the initial `user` and `admin` values.
4. THE API SHALL create the `users` table via an Entity Framework Core code-first migration.
5. WHEN the Local_Environment is started, THE API SHALL apply the `users` table migration automatically on startup.

---

### Requirement 3: Password Hashing

**User Story:** As a developer, I want passwords stored as secure hashes rather than plaintext, so that user credentials are protected if the database is compromised.

#### Acceptance Criteria

1. THE PasswordHasher SHALL hash passwords using a secure, adaptive hashing algorithm before storing them in the `users` table.
2. WHEN a login attempt is made, THE PasswordHasher SHALL verify the submitted password against the stored hash without requiring the plaintext password to be retrievable.
3. THE API SHALL never store or log a plaintext password at any point during account creation or login.

---

### Requirement 4: UsersController — Login Endpoint

**User Story:** As an administrator, I want to submit my email and password to the API and receive a JWT, so that I can authenticate and access protected admin features.

#### Acceptance Criteria

1. THE UsersController SHALL expose a `POST /api/users/login` endpoint that accepts a username (email) and password in the request body.
2. WHEN valid credentials are submitted to `POST /api/users/login`, THE UsersController SHALL return an HTTP 200 response containing a signed JWT.
3. WHEN invalid credentials are submitted to `POST /api/users/login`, THE UsersController SHALL return an HTTP 401 response with no information that distinguishes between an unknown username and an incorrect password.
4. WHEN a request body with a missing or empty username or password is submitted to `POST /api/users/login`, THE UsersController SHALL return an HTTP 400 response.
5. THE JWT issued by THE UsersController SHALL include the user's role as a claim.
6. THE JWT issued by THE UsersController SHALL have a configurable expiry duration sourced from the API's environment configuration.
7. THE UsersController SHALL be structured to support additional user management endpoints in the future without requiring architectural changes.

---

### Requirement 5: JWT Configuration

**User Story:** As a developer, I want JWT signing and expiry settings managed through environment configuration, so that secrets are not hardcoded and can differ per environment.

#### Acceptance Criteria

1. THE API SHALL read the JWT signing secret from environment configuration under a dedicated key (e.g., `Jwt:Secret`).
2. THE API SHALL read the JWT expiry duration from environment configuration under a dedicated key (e.g., `Jwt:ExpiryMinutes`).
3. IF the JWT signing secret is missing or empty at startup, THEN THE API SHALL fail to start and log a descriptive error identifying the missing configuration key.
4. THE API's existing ConfigValidator SHALL be extended to include the JWT configuration keys as required values.

---

### Requirement 6: Admin Portal — Login Page

**User Story:** As an administrator, I want a login page where I can enter my email and password, so that I can authenticate and access the admin dashboard.

#### Acceptance Criteria

1. THE Login_Page SHALL display an email input field, a password input field, and a submit button.
2. WHEN the submit button is activated with a non-empty email and non-empty password, THE Login_Page SHALL send a login request to the `POST /api/users/login` endpoint.
3. WHEN the API returns a successful response, THE Login_Page SHALL store the received JWT and navigate the user to the Dashboard_Page.
4. WHEN the API returns an authentication failure response, THE Login_Page SHALL display an error message indicating that the credentials are invalid.
5. WHEN the submit button is activated with an empty email or empty password, THE Login_Page SHALL display a validation error and SHALL NOT submit a request to the API.
6. WHILE a login request is in progress, THE Login_Page SHALL disable the submit button to prevent duplicate submissions.
7. THE Login_Page SHALL be accessible to unauthenticated users and SHALL NOT require a JWT to render.

---

### Requirement 7: JWT Storage and Persistence

**User Story:** As an administrator, I want my session to persist across page refreshes, so that I do not have to log in again after reloading the browser.

#### Acceptance Criteria

1. THE Admin_Portal SHALL store the JWT in the browser's `localStorage` after a successful login.
2. WHEN the Admin_Portal is loaded or refreshed, THE Admin_Portal SHALL read the JWT from `localStorage` and restore the authenticated session if a valid token is present.
3. WHEN the stored JWT is absent or expired, THE Admin_Portal SHALL treat the session as unauthenticated and redirect the user to the Login_Page.

---

### Requirement 8: Protected Dashboard Route

**User Story:** As an administrator, I want the dashboard to be accessible only after login, so that unauthenticated users cannot access admin pages.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL be a Protected_Route that requires a valid JWT to access.
2. WHEN an unauthenticated user navigates directly to the Dashboard_Page URL, THE Admin_Portal SHALL redirect the user to the Login_Page.
3. WHEN an authenticated user navigates to the Dashboard_Page, THE Admin_Portal SHALL display the dashboard content without redirecting.
4. THE Dashboard_Page SHALL display a placeholder layout indicating it is the admin dashboard (content to be expanded in future requirements).
5. THE Dashboard_Page SHALL provide a logout action that clears the stored JWT and redirects the user to the Login_Page.

---

### Requirement 9: API CORS Configuration

**User Story:** As a developer, I want the API to accept requests from the Admin Portal's origin, so that the browser does not block cross-origin requests from the admin web app.

#### Acceptance Criteria

1. THE API SHALL include a CORS policy that permits requests from the Admin_Portal's configured origin.
2. THE API's CORS policy SHALL allow the HTTP methods and headers required by the `POST /api/users/login` endpoint.
3. THE Admin_Portal origin permitted by the CORS policy SHALL be sourced from environment configuration and SHALL NOT be hardcoded.

---

### Requirement 10: Admin Portal Environment Configuration

**User Story:** As a developer, I want the Admin Portal to load its API base URL from environment configuration, so that it can target different API environments without code changes.

#### Acceptance Criteria

1. THE Admin_Portal SHALL load the API base URL from an environment variable (e.g., `VITE_API_BASE_URL`).
2. IF the API base URL environment variable is missing or empty at startup, THEN THE Admin_Portal SHALL display a descriptive error identifying the missing variable and SHALL NOT attempt to render the application.
3. THE Admin_Portal SHALL support at minimum a local development configuration and a production configuration via separate environment files.

---

### Requirement 11: Docker Compose Integration

**User Story:** As a developer, I want the Admin Portal to start automatically when I run `docker-compose up` from the project root, so that the full local stack is available with a single command.

#### Acceptance Criteria

1. THE root `docker-compose.yml` SHALL include a service definition for the Admin_Portal.
2. WHEN `docker-compose up` is run from the project root, THE Admin_Portal service SHALL build and start alongside the API and database services.
3. THE Admin_Portal service SHALL be accessible on a dedicated local port (e.g., `3001`) that does not conflict with other services.
4. THE Admin_Portal Docker image SHALL be built from a `Dockerfile` located in the `/admin` folder.
5. THE Admin_Portal service in Docker Compose SHALL receive its required environment variables (e.g., `VITE_API_BASE_URL`) via the Docker Compose configuration.
