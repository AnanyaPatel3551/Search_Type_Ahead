# Search Typeahead System - Phase 1 Foundation

This is the production-ready foundation for the **Search Typeahead System**, designed under strict software architecture standards. 

Phase 1 lays down the containerized infrastructure (PostgreSQL & Redis), the database mapping layout (Prisma ORM schema), the server app setup (Express with Custom Middlewares & TypeScript), and the client status dashboard (React & Vite).

---

## 📂 Project Structure

```text
c:\Search_Type_Ahead
├── backend/                       # Node.js Express Backend
│   ├── prisma/                    # Database ORM Configuration
│   │   └── schema.prisma          # Database models, connections, and indices
│   ├── src/
│   │   ├── config/                # Centralized environment configs
│   │   │   └── index.ts
│   │   ├── db/                    # DB connection pools & Redis clients
│   │   │   ├── prisma.ts          # PostgreSQL connection singleton
│   │   │   └── redis.ts           # Redis Client connector
│   │   ├── middleware/            # Global Express Middlewares
│   │   │   ├── error.ts           # Central error catching & standard formats
│   │   │   └── logging.ts         # Structured JSON logging middleware
│   │   ├── routes/                # Endpoint routing registries
│   │   │   ├── health.ts          # GET /health check (checks DB & Redis)
│   │   │   └── index.ts           # Root API router mapping
│   │   ├── app.ts                 # Express Application middleware setup
│   │   └── server.ts              # Express Server entry & graceful shutdown
│   ├── .env                       # Backend local configuration variables
│   ├── package.json               # Node Package description & commands
│   └── tsconfig.json              # TypeScript compilation specifications
│
├── frontend/                      # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── App.css                # Standard fallback styling (cleared)
│   │   ├── App.tsx                # Health monitor visual interface
│   │   ├── index.css              # Glassmorphic responsive styling tokens
│   │   └── main.tsx               # Client bootstrap entry point
│   ├── package.json               # Client Node package manager commands
│   └── vite.config.ts             # Vite configuration files
│
└── docker-compose.yml             # Local database & caching infrastructure
```

---

## 🛠️ Tech Stack & Dependencies

### Backend
* **Express & Node.js:** Scalable network routing framework.
* **TypeScript:** Strong type safety, preventing common runtime bugs.
* **Prisma ORM:** Database abstractions, schema definitions, and automated migrations.
* **ioredis:** Fast and robust client library for caching.
* **morgan:** Express logging utility (pre-installed, used custom middleware).

### Frontend
* **React & Vite:** Ultra-fast hot-reloading dev environment and lightweight production asset builder.
* **TypeScript:** Secure props, state, and client-side models.
* **Vanilla CSS (Plus Jakarta Sans Google Font):** Clean, premium dark mode glassmorphism interface.

### Infrastructure
* **Docker Compose:** Spins up PostgreSQL 15 and Redis 7 as isolated local container containers.

---

## 🚀 Setup & Installation

Follow these steps to initialize and start the project locally:

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running to use containerized PostgreSQL and Redis)

---

### Step 1: Boot the Infrastructure Containers
From the root workspace folder, launch PostgreSQL and Redis:
```bash
docker compose up -d
```
*This starts a PostgreSQL instance on port `5432` and a Redis instance on port `6379`.*

---

### Step 2: Set up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Prisma schema migrations to create the database tables:
   ```bash
   npx prisma migrate dev --name init_search_query
   ```
   *This commands creates the SQL migrations, runs them on the Postgres container, and updates the local Prisma Client types.*
4. Start the backend developer hot-reload server:
   ```bash
   npm run dev
   ```
   *The server starts listening on `http://localhost:5000`.*

---

### Step 3: Set up the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite developer client server:
   ```bash
   npm run dev
   ```
   *Open your browser to `http://localhost:5173` to see the dashboard.*

---

## 🩺 Health Check & Verification

### GET `/health` Endpoint
To verify database and caching connections directly, run:
```bash
curl http://localhost:5000/health
```

#### Expected Success Output (HTTP 200)
```json
{
  "status": "OK",
  "timestamp": "2026-06-21T23:25:00.000Z",
  "services": {
    "database": "UP",
    "redis": "UP"
  }
}
```

#### Expected Degraded Output (HTTP 500)
If PostgreSQL is running but Redis is down, or vice versa, the server remains alive but reports a degraded status:
```json
{
  "status": "DEGRADED",
  "timestamp": "2026-06-21T23:25:00.000Z",
  "services": {
    "database": "UP",
    "redis": "DOWN"
  }
}
```

---

## ⚠️ Common Errors & Fixes

### 1. `unable to get image ... failed to connect to the docker API`
* **Cause:** The Docker Desktop daemon is not running on your host machine.
* **Fix:** Open Docker Desktop, wait for the engine state to read "running", and execute `docker compose up -d` again.

### 2. `Environment variable DATABASE_URL is missing!`
* **Cause:** Node cannot resolve the `.env` file path or the file was deleted.
* **Fix:** Ensure the `.env` file exists inside the `backend` folder and contains a valid connection string:
  ```env
  DATABASE_URL="postgresql://postgres:postgres_secure_pass@localhost:5432/search_typeahead?schema=public"
  ```

### 3. `Prisma Client has not been generated yet`
* **Cause:** The `@prisma/client` types are missing in `node_modules`.
* **Fix:** Run the generator command manually in the `backend` folder:
  ```bash
  npx prisma generate
  ```
