<div align="center">

# 🌟 Store Rating Platform

**Full-stack, enterprise-grade multi-tenant web application for store discovery, rating submissions, and administrative governance.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

### 🌐 Localhost Direct Access Links

Run `npm run dev` in your terminal and open these links directly in your browser:

| Service | Localhost Direct Link | Description |
| :--- | :--- | :--- |
| 💻 **Frontend Web App** | [**http://localhost:5173**](http://localhost:5173) | Main React Web Application |
| ⚙️ **Backend REST API** | [**http://localhost:5000**](http://localhost:5000) | Node.js / Express Server |
| 📖 **Interactive Swagger Docs** | [**http://localhost:5000/api/docs**](http://localhost:5000/api/docs) | OpenAPI Interactive Documentation |
| 🟢 **Health Check** | [**http://localhost:5000/health**](http://localhost:5000/health) | Process Liveness & DB Status |

---

### 🔑 Pre-Seeded Login Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@storerating.com` | `AdminPass123!` | Full System Governance, Add/Delete Users |
| **Store Owner** | `owner@storerating.com` | `OwnerPass123!` | Owner Dashboard, Store Analytics & Reviews |
| **Normal User** | `user@storerating.com` | `UserPass123!` | Store Search, Filter, 1-5 Star Ratings |

</div>

---

## 📌 Table of Contents
- [⚡ Quickstart: How to Run Locally](#-quickstart-how-to-run-locally)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
- [📐 Database ERD Diagram](#-database-erd-diagram)
- [🧪 Running Tests & Verification](#-running-tests--verification)
- [🛡️ Security Implementation](#️-security-implementation)
- [📖 VS Code Run Guide](./VS_Code_Setup_and_Run_Guide.md)

---

## ⚡ Quickstart: How to Run Locally

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/aryansheth18/Full-Stack-Project.git
cd Full-Stack-Project
npm install
```

### Step 2: Configure Local Environment Variables
Create a `.env` file in `backend/` directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/storerating?schema=public"
JWT_SECRET="super-secret-jwt-access-key-production-grade-32-chars"
JWT_REFRESH_SECRET="super-secret-jwt-refresh-key-production-grade-32-chars"
CORS_ORIGIN="http://localhost:5173"
```

### Step 3: Setup Database Schema & Seed Data
```bash
# Push Prisma schema to PostgreSQL database
npm run prisma:push

# Seed default admin, owner, user accounts & store data
npm run seed
```

### Step 4: Start Dev Server & Launch Web App
```bash
npm run dev
```

👉 Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## ✨ Key Features

### 👑 System Administrator
- **Dashboard Overview**: Metrics displaying total users, registered stores, and submitted ratings.
- **User Governance**: Create, edit, inspect, and delete users (Admin, Owner, Normal User).
- **Store Governance**: Register stores, assign store owners, and edit store details.
- **Audit Logs**: Immutable database audit records tracking administrative actions.

### 🏪 Store Owner
- **Owner Dashboard**: Displays owned stores, overall ratings, and user feedback reviews.
- **Performance Analytics**: View star rating breakdowns per store.

### 👤 Normal User
- **Store Discovery**: Search, filter, and sort stores by name, address, or overall rating.
- **Rating Submissions**: Submit or update 1-to-5 star ratings for stores.
- **Concurrency Protection**: Single active rating per user per store enforced via unique database indexes.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack React Query v5, React Router v6
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Pino Logger, Swagger UI
- **Database**: PostgreSQL
- **Testing**: Jest + Supertest (Backend), Vitest + React Testing Library (Frontend), Playwright (E2E)

---

## 📐 Database ERD Diagram

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

## 🧪 Running Tests & Verification

```bash
# Run all test suites (Backend Jest + Frontend Vitest)
npm run test

# Run Backend Integration Tests (34 Jest tests)
npm run test:backend

# Run Frontend Component Tests (7 Vitest tests)
npm run test:frontend

# Run End-to-End Tests (Playwright)
npm run test:e2e

# Production Build Check
npm run build
```

---

## 🛡️ Security Implementation
- 🔒 **Dual-Token Auth**: 15m in-memory access token + 7d `httpOnly` refresh token with automatic rotation.
- 🛡️ **Double-Submit CSRF Cookie**: Protects state-changing HTTP requests.
- 🔑 **Account Lockout**: 5-strike failed attempt lockout protection (15 minutes).
- 📜 **Audit Trail**: Logs administrative actions into `audit_logs` database table.

---

## 📄 VS Code Run & Setup Guide
For step-by-step VS Code terminal instructions, see [`VS_Code_Setup_and_Run_Guide.md`](./VS_Code_Setup_and_Run_Guide.md).

Distributed under the MIT License.
