<div align="center">

# 🌟 Store Rating Platform

**A full-stack, enterprise-grade multi-tenant web application for store discovery, rating submissions, and administrative governance.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com/)

</div>

---

## 📌 Table of Contents
- [✨ Key Features](#-key-features)
- [👤 Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [🔑 Default Test Credentials](#-default-test-credentials)
- [🛠️ Tech Stack](#️-tech-stack)
- [📐 Database Schema & Architecture](#-database-schema--architecture)
- [🚀 Quickstart & Local Setup](#-quickstart--local-setup)
- [🐳 Docker Setup](#-docker-setup)
- [☁️ Deploy to Render ($0 Free)](#️-deploy-to-render-0-free)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🛡️ Security Features](#️-security-features)

---

## ✨ Key Features

### 👑 System Administrator
- **Dashboard Metrics**: Real-time overview of total users, registered stores, and submitted ratings.
- **User Governance**: Create, edit, inspect, and delete users (System Admins, Store Owners, Normal Users).
- **Store Governance**: Add new stores, assign store owners, and edit store information.
- **Audit Logging**: Immutable database logs tracking all administrative operations with admin IDs and timestamps.

### 🏪 Store Owner
- **Owner Portal**: Private dashboard displaying owned stores, user feedback, and rating breakdowns.
- **Performance Analytics**: View total ratings count, average star rating, and user breakdown per store.

### 👤 Normal User
- **Store Discovery**: Search, filter, and sort stores by name, address, or overall rating.
- **Rating Submissions**: Submit or modify 1-to-5 star ratings for stores.
- **Smart Concurrency Guardrails**: Single active rating per user per store enforced at the database layer using composite unique constraints.

---

## 🔑 Default Test Credentials

Pre-seeded database accounts available immediately upon launch:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@storerating.com` | `AdminPass123!` | Full Governance, User Deletion, Audit Logs |
| **Store Owner** | `owner@storerating.com` | `OwnerPass123!` | Owner Dashboard, Store Analytics |
| **Normal User** | `user@storerating.com` | `UserPass123!` | Store Discovery, 1-5 Star Ratings |

---

## 🛠️ Tech Stack

### Backend Architecture
- **Runtime**: Node.js & Express (TypeScript)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: Dual-token JWT (15m in-memory access token + 7d `httpOnly` refresh token with rotation)
- **Security & Middleware**: Helmet, CORS, Express Rate Limit, Double-Submit Cookie CSRF protection
- **Logging & Docs**: Pino Logger, Pino HTTP, Swagger / OpenAPI interactive docs (`/api/docs`)

### Frontend Architecture
- **Framework & Build**: React 18, Vite, TypeScript
- **Styling & UI**: Tailwind CSS, Lucide React Icons
- **State & Data Fetching**: TanStack React Query v5, Axios (with automatic token refresh interceptors)
- **Routing**: React Router v6

---

## 📐 Database Schema & Architecture

```mermaid
erDiagram
    User ||--o{ Store : "owns (StoreOwner)"
    User ||--o{ Rating : "submits"
    User ||--o{ RefreshToken : "has"
    User ||--o{ AuditLog : "creates (Admin)"
    Store ||--o{ Rating : "receives"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        string address
        Role role
        datetime createdAt
    }

    Store {
        string id PK
        string name
        string email UK
        string address
        string ownerId FK
        datetime createdAt
    }

    Rating {
        string id PK
        string userId FK
        string storeId FK
        int ratingValue
        datetime createdAt
    }

    AuditLog {
        string id PK
        string adminId FK
        string action
        string targetType
        string targetId
        datetime createdAt
    }
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher (or Docker)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/aryansheth18/Full-Stack-Project.git
cd Full-Stack-Project

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```

Ensure `backend/.env` contains your PostgreSQL connection string:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/storerating?schema=public"
JWT_SECRET="supersecretjwtkey123456789012345"
JWT_REFRESH_SECRET="supersecretrefreshkey1234567890123"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Push Database Schema & Seed Initial Data
```bash
# Generate Prisma Client & push schema to database
npm run prisma:push

# Seed database with default admin, owner, and user accounts
npm run seed
```

### 4. Run Development Servers
```bash
# Runs frontend (http://localhost:5173) and backend (http://localhost:5000) concurrently
npm run dev
```

---

## 🐳 Docker Setup

Run the full stack (PostgreSQL + Express Backend + React Frontend) with 1 command:

```bash
docker compose up --build
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Swagger OpenAPI Documentation**: `http://localhost:5000/api/docs`
- **Deep Health Check**: `http://localhost:5000/health`

---

## ☁️ Deploy to Render ($0 Free)

This repository includes a pre-configured `render.yaml` Blueprint for **100% Free** deployment on Render.

### Method 1: Blueprint Deployment (1-Click)
1. Go to [Render Dashboard](https://dashboard.render.com) -> Click **New +** -> **Blueprint**.
2. Connect your GitHub repository: `aryansheth18/Full-Stack-Project`.
3. Render automatically provisions:
   - 🗄️ PostgreSQL Database (`store-rating-db`)
   - ⚙️ Express Backend Web Service (`store-rating-backend`)
   - 🌐 React Frontend Static Site (`store-rating-frontend`)
4. Click **Apply**.

### Method 2: Single Web Service Deployment
See the detailed step-by-step guide in [`Render_Deployment_Guide.md`](./Render_Deployment_Guide.md).

---

## 🧪 Testing & Quality Assurance

```bash
# Run complete test suite (Jest + Vitest)
npm run test

# Run Backend Integration & API Tests (34 Jest tests)
npm run test:backend

# Run Frontend Component Tests (7 Vitest tests)
npm run test:frontend

# Run End-to-End Tests (Playwright)
npm run test:e2e

# Production Typecheck & Build Validation
npm run typecheck
```

---

## 🛡️ Security Features
- 🔒 **Dual-Token Auth**: 15-minute access token (stored in memory) + 7-day `httpOnly` refresh token with automatic rotation.
- 🛡️ **Double-Submit CSRF Cookie**: Prevents Cross-Site Request Forgery attacks across state-changing HTTP requests.
- 🔑 **Password Hashing**: Strong bcrypt hashing with salt factor of 12.
- 🚫 **Account Lockout**: 5-strike failed attempt lockout protection.
- 📜 **Audit Logging**: Mandatory database audit trail for administrative creation and deletion actions.

---

## 📄 License & Guides
- 📖 [VS Code Setup & Local Guide](./VS_Code_Setup_and_Run_Guide.md)
- ☁️ [Render Deployment Guide](./Render_Deployment_Guide.md)

Distributed under the MIT License.
