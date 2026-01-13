# CoopManager

**Housing Cooperative Management System** — a full-featured web application for administering buildings, residents, payments, and repairs.

**Live Demo:** [mariukha.pl/bazy/](https://mariukha.pl/bazy/)  
**Credentials:** `admin` / `admin123`

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│  Oracle Database│
│   React + TS    │     │     FastAPI     │     │     XEPDB1      │
│   Port: 3000    │     │   Port: 8000    │     │   Port: 1521    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Features

### Admin Panel
- **Dashboard** — statistics overview with dynamic record counting
- **Buildings** — management of buildings and infrastructure
- **Apartments** — housing stock management
- **Members** — residents database with audit triggers
- **Employees** — staff records
- **Repairs** — repair request tracking
- **Payments** — payment control and billing
- **Services** — tariffs and utility services
- **Reports** — financial analytics with views (Lab 9)
- **PL/SQL Procedures** — execution of database procedures and package functions

### Resident Portal
- View personal payment history
- Track status of repair requests
- View apartment and contract information

## Quick Start

### Prerequisites
- **Docker** and **Docker Compose** (required)
- 8GB+ RAM recommended (Oracle XE needs ~2GB)
- ~10GB disk space

### Run with Docker

```bash
# 1. Clone the repository
git clone <repo-url>
cd Klient

# 2. Start all services (database + backend + frontend)
docker compose up -d

# 3. Wait for Oracle database initialization (~2-3 minutes on first run)
docker compose logs -f oracle-db

# 4. Check if all containers are running
docker compose ps
```

**First startup takes 2-3 minutes** because Oracle XE needs to initialize. The `INIT_DB.sql` script runs automatically and creates:
- All tables (budynek, mieszkanie, czlonek, pracownik, naprawa, uslugi, oplata, umowa, etc.)
- Sample data
- Views (v_oplaty_summary, v_naprawy_status, v_mieszkania_info)
- Procedures and Functions (zwieksz_oplaty, dodaj_oplate_fn, pobierz_czlonkow_budynku)
- Package coop_pkg with suma_oplat_mieszkania and policz_naprawy_pracownika
- Triggers (trg_audit_czlonek)

### Access Points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |

### Verify Database Initialization

```bash
# Check Oracle logs for "INIT_DB.sql executed"
docker compose logs oracle-db | grep -i "init"

# Or connect to Oracle and verify tables
docker exec -it oracle-xe-prod sqlplus system/oracle@XEPDB1
SQL> SELECT table_name FROM user_tables;
```

### Common Commands

```bash
# Stop all services
docker compose down

# Restart with fresh database (removes all data)
docker compose down -v
docker compose up -d

# Rebuild frontend after code changes
docker compose build --no-cache frontend
docker compose up -d frontend

# Rebuild backend after code changes
docker compose build --no-cache backend
docker compose up -d backend

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

## Local Development (without Docker)

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** For local development, you still need Oracle running (via Docker or installed locally).

## Project Structure

```
Klient/
├── frontend/                 # React application (Vite + TypeScript)
│   ├── components/           # Reusable UI components
│   ├── pages/                # Dashboard, Reports, Procedures
│   ├── hooks/                # useAuth, useTheme, useNotification
│   ├── services/             # API client (Axios)
│   ├── config/               # Table configs, constants
│   └── types/                # TypeScript interfaces
├── backend/                  # FastAPI REST API
│   ├── main.py               # All endpoints
│   ├── db.py                 # Oracle connection (oracledb)
│   └── requirements.txt      # Python dependencies
├── init-db/                  # Oracle initialization scripts
├── docker-compose.yml        # Docker services configuration
├── INIT_DB.sql               # Database schema + sample data + PL/SQL
└── README.md                 # This file
```

## PL/SQL Features (Labs 7-13)

| Feature | Lab | Description |
|---------|-----|-------------|
| `policz_rekordy(table)` | 13 | Dynamic SQL — counts records in any table |
| `pobierz_czlonkow_budynku(id)` | 11 | Returns CURSOR with building members |
| `dodaj_oplate_fn(apt, svc, usage)` | 11 | Function to add payment |
| `zwieksz_oplaty(percent)` | 11 | Procedure to increase service prices |
| `coop_pkg.suma_oplat_mieszkania(id)` | 12 | Package function — apartment payment sum |
| `coop_pkg.policz_naprawy_pracownika(id)` | 12 | Package function — worker repairs count |
| `trg_audit_czlonek` | 13 | Trigger logging INSERT/UPDATE/DELETE |
| `v_oplaty_summary` | 9 | View — payments by apartment |
| `v_naprawy_status` | 9 | View — repairs with CASE status |

## System Access

### Administrator
- **Login:** `admin`
- **Password:** `admin123`

### Resident
- Login using **First Name**, **Last Name**, and **Apartment Number**
- Data from `czlonek` table (e.g., Jan Kowalski, apt 101)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | FastAPI, Python 3.11, oracledb |
| Database | Oracle XE 21c |
| Icons | Lucide React |
| HTTP Client | Axios |
| Containerization | Docker, Docker Compose |

## Troubleshooting

### "Connection refused" on backend
Oracle might still be starting. Wait 2-3 minutes and check:
```bash
docker compose logs oracle-db | tail -20
```

### "Table does not exist"
INIT_DB.sql hasn't run yet. Either wait or manually execute:
```bash
docker exec -it oracle-xe-prod sqlplus system/oracle@XEPDB1 @/docker-entrypoint-initdb.d/INIT_DB.sql
```

### Frontend shows blank page
Check browser console for errors. Rebuild if needed:
```bash
docker compose build --no-cache frontend && docker compose up -d frontend
```

## License

MIT License — use freely for educational purposes.
