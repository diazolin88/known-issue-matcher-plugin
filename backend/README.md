# Known Issues Matcher Plugin - Backend

## Prerequisites
- Docker and Docker Compose
- Java 17+ (optional, for local development without Docker)

## How to Run (Recommended)
This is the easiest way as it sets up both the Application and the Database.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start the services:
   ```bash
   docker compose up --build
   ```

The API will be available at `http://localhost:3000`.

## How to Run (Local Java)
If you want to run the Java app locally, you must first start the database.

1. Start just the database:
   ```bash
   docker compose up -d db
   ```

2. Run the application:
   ```bash
   # You need to override the DB host because 'db' is not resolvable locally
   mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:mysql://localhost:3306/known_issues"
   ```

## Running with Remote Backend
If your backend is running on a different server (not localhost), you need to update the frontend configuration to point to the correct address.

1. Open `frontend/api-client.js`.
2. Locate the constant `API_BASE_URL` at the top of the file:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/known-issues';
   ```
3. Change `'http://localhost:3000/known-issues'` to your remote server's URL, for example:
   ```javascript
   const API_BASE_URL = 'http://<your-remote-ip>:3000/known-issues';
   ```
