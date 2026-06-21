# Search Typeahead System

### 🌐 Live Production Deployments
* **Frontend Client (Vercel):** [https://search-type-ahead.vercel.app](https://search-type-ahead.vercel.app)
* **Backend API Server (Render):** [https://search-typeahead-backend.onrender.com](https://search-typeahead-backend.onrender.com)

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

---

## 🎯 Phase 4 & Final HLD Optimization Specifications

This project implements a fully optimized production-grade Search Typeahead Autocomplete System with a scaled dataset, telemetry debugging, and dynamic ranking.

### 1. Scaled Dataset (100,000+ Queries)
On startup, a dataset checker checks if the PostgreSQL table size is under 100,000. If underpopulated, it generates a unique, realistic pool of **100,000 technical search queries** using combinations of search verbs, technical subjects, and environments. These are bulk-inserted in highly optimized batches of 10,000. Warm-up loading of the Trie with all 114,000+ database records takes **approx. 1.0 second**, keeping boot times extremely fast.

### 2. API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/suggest?q=<prefix>` | Returns the top 10 autocompleted suggestion terms. |
| **GET** | `/autocomplete?prefix=<prefix>` | Alias endpoint for suggestion lookups. |
| **POST** | `/search` | Posts a new search query (normalizes, pushes to the batch write buffer, and logs trending events). |
| **GET** | `/cache/debug?prefix=<prefix>` | Diagnostics endpoint to inspect caching status, selected consistent hash ring node, and size. |
| **GET** | `/trending` | Compiles top 10 dynamic trending queries of the last hour. |
| **GET** | `/metrics` | Exposes performance metrics (average/P95 latencies, hits/misses, DB reads/writes counters). |
| **GET** | `/consistent-hash/simulate` | Simulates adding/removing nodes and key distributions on the partition ring. |

### 3. Dynamic Trending Scoring Formula
Trending queries are ranked based on a combination of recency and historical significance. The score is calculated as:
$$\text{Score} = 0.7 \times C_{\text{recent}} + 0.3 \times C_{\text{historical}}$$
* $C_{\text{recent}}$: Search count in the last hour sliding window (maintained via a Redis Sorted Set `ZSET`).
* $C_{\text{historical}}$: Total lifetime search query frequency retrieved directly from the in-memory Trie.

### 4. Telemetry Metrics & DB Write Reduction
By routing search entries to an in-memory buffer and flushing them to PostgreSQL every 5 seconds, database write IOPS is minimized:
* **Batch Write Reduction:** Computes the saving ratio of database writes relative to user requests. For example, 100 search requests resulting in 1 batch write achieves a **99.0% write reduction**.
* Exposes `p95LatencyMs`, cache hits and misses ratios, raw `database.reads` and `database.writes` counts, and `avgBatchSize` under `GET /metrics`.

---

## 🧪 Manual Testing Verification Checklist

Use the following endpoints to verify the system behavior:

1. **Verify Autocomplete Suggestions:**
   `GET http://localhost:5000/suggest?q=iph`
   Verify it returns the top 10 suggestions starting with `iph` (e.g. `iphone 15 pro max`, `iphone 16 release date`...).

2. **Verify Cache Diagnostics:**
   `GET http://localhost:5000/cache/debug?prefix=iph`
   Verify it returns:
   * `cacheNodeSelected` (e.g., `Redis Node 2`)
   * `consistentHashValue`
   * `cacheHit` (true on second request)
   * `ttlRemainingSeconds` (if cached)
   * `cachedValueSizeBytes`

3. **Verify Advanced Telemetry Metrics:**
   `GET http://localhost:5000/metrics`
   Verify it returns a structured JSON payload with:
   * `autocomplete` (avgLatencyMs, p95LatencyMs, cacheHitRate, cacheMissRate)
   * `database` (reads, writes, searchSubmissions, batchWriteReduction)
   * `batchWrites` (avgBatchSize, totalBatchesFlushed)

