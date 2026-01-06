# CoopManager

**Housing Cooperative Management System** — a full-featured web application for administering buildings, residents, payments, and repairs.

🔗 **Live Demo:** [mariukha.pl/bazy/](https://mariukha.pl/bazy/)
🔑 **Credentials:** `admin` / `admin123`

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│  Oracle Database│
│   React + TS    │     │     FastAPI     │     │     XEPDB1      │
│   Port: 3000    │     │   Port: 8000    │     │   Port: 1521    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## ✨ Features

### 👨‍💼 Admin Panel
- **Dashboard** — charts and statistics overview
- **Buildings** — management of buildings and infrastructure
- **Apartments** — housing stock management
- **Members** — residents database
- **Employees** — staff records
- **Repairs** — repair request tracking
- **Payments** — payment control and billing
- **Services** — tariffs and utility services
- **Reports** — financial analytics
- **PL/SQL Procedures** — execution of database administrative operations

### 🏠 Resident Portal
- View personal payment history
- Track status of repair requests
- View apartment information

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd Klient

# Start all services
docker-compose up -d

# Check container status
docker-compose ps
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📁 Project Structure

```
Klient/
├── frontend/                 # React application (Vite)
│   ├── components/           # UI components
│   ├── pages/                # Application pages
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API client (Axios)
│   ├── config/               # Configuration
│   └── types/                # TypeScript types
├── backend/                  # FastAPI server
│   ├── main.py               # Main application entry point and endpoints
│   ├── db.py                 # Oracle database connection
│   └── requirements.txt      # Python dependencies
├── docker-compose.yml        # Docker services configuration
├── INIT_DB.sql               # Database initialization SQL script
└── README.md                 # Documentation
```

## 🔐 System Access

### Administrator
- **Login:** `admin`
- **Password:** `admin123` (or see `uzytkownicy` table in DB)

### Resident
- Login using First Name, Last Name, and Apartment Number (data from `czlonek` table).

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | FastAPI, Python 3.11 |
| Database | Oracle XE 21c |
| UI/Charts | Lucide React, Recharts |
| HTTP Client | Axios |
| Containerization | Docker |