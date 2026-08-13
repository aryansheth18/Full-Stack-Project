# Store Rating Platform — Complete VS Code Setup & Execution Guide 📘

This comprehensive step-by-step guide walks you through setting up, configuring, seeding, and running the **Store Rating Platform** full-stack application from scratch in **Visual Studio Code (VS Code)**.

---

## 🛠️ Section 1: System Prerequisites

Before opening the project in VS Code, ensure the following software is installed on your computer:

1. **Node.js**: Version `v18.0.0` or higher (Includes `npm`).
   - Verify by running `node -v` in terminal.
2. **PostgreSQL Database**: Version `14.0` or higher (running locally on port `5432` or via Docker / cloud instance).
   - Verify Postgres is running.
3. **Visual Studio Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/).

---

## 🧩 Section 2: Recommended VS Code Extensions

For the best developer experience, syntax highlighting, formatting, and type support, install these extensions in VS Code:

| Extension Name | Extension Identifier | Description |
| :--- | :--- | :--- |
| **Prisma** | `Prisma.prisma` | Official Prisma extension for syntax highlighting, auto-completion, and formatting for `schema.prisma`. |
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Intelligent Tailwind CSS class completion, linting, and hover previews. |
| **ESLint** | `dbaeumer.vscode-eslint` | Integrates ESLint into VS Code to highlight code style and error issues in real-time. |
| **Prettier - Code formatter** | `esbenp.prettier-vscode` | Formats TypeScript, React, HTML, CSS, and JSON files on save. |
| **Console Ninja** (Optional) | `WallabyJs.console-ninja` | Displays `console.log` values directly inline in your editor. |

*To install an extension in VS Code:* Press `Ctrl + Shift + X` (or `Cmd + Shift + X` on macOS), search for the extension name, and click **Install**.

---

## 🚀 Section 3: Step-by-Step Installation & Launch Guide

### Step 1: Open the Project in VS Code
1. Launch **Visual Studio Code**.
2. Click **File** → **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the folder: `c:\Users\gulav\OneDrive\Desktop\Full-Stack Project` and click **Select Folder**.

### Step 2: Open the Integrated Terminal in VS Code
1. Press `Ctrl + ~` (tilde key) or click **Terminal** → **New Terminal** in the top menu bar.
2. Ensure your terminal prompt points to the project root: `Full-Stack Project`.

### Step 3: Configure Environment Variables
1. In the VS Code file explorer (left sidebar), navigate to `backend/`.
2. Ensure there is a `.env` file present (if not, copy `.env.example` to `.env`).
3. Open `backend/.env` and update the PostgreSQL connection string with your database username and password:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/storerating_db?schema=public"
   JWT_SECRET="super-secret-jwt-access-key-production-grade-32-chars"
   JWT_REFRESH_SECRET="super-secret-jwt-refresh-key-production-grade-32-chars"
   CORS_ORIGIN="http://localhost:5173"
   ```

### Step 4: Install Dependencies
Run the following command in the VS Code terminal to install packages for root, backend, and frontend:
```bash
npm install && npm --prefix backend install && npm --prefix frontend install
```

### Step 5: Push Database Schema & Run Seed Data
Run the Prisma schema sync and seed script:
```bash
# Push database schema tables to PostgreSQL
npm run prisma:push

# Generate Prisma Client TypeScript types
npm run prisma:generate

# Populate initial admin, store owners, users, stores, and ratings
npm run seed
```

### Step 6: Start Development Servers
Run both Backend (Port 5000) and Frontend (Port 5173) concurrently with a single command:
```bash
npm run dev
```
You will see output in the VS Code terminal:
- 🚀 **Backend**: `Server listening on port 5000 in development mode`
- 💻 **Frontend**: `Vite ready at http://localhost:5173/`

---

## 🔑 Section 4: Accessing the Application & Test Credentials

Open your web browser (Chrome, Edge, Firefox) and navigate to:
👉 **`http://localhost:5173`**

You can sign in using any of the default pre-seeded accounts:

| Role | Email | Password | Dashboard Features Available |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@storerating.com` | `Admin@12345` | Total metrics counters, Add User modal, Add Store modal, Users listing, Stores listing, User detail profile modal. |
| **Store Owner** | `owner.eleanor@apextech.com` | `Owner@12345` | Store analytics, average store rating, real-time customer ratings list. |
| **Normal User** | `benjamin.roosevelt@example.com` | `User@12345` | Browse registered stores, search by name/address, 1-5 star interactive rating submission. |

---

## 🧪 Section 5: Running Tests & Building for Production

### Running Automated Test Suites in VS Code:
Open a new terminal tab in VS Code and execute:
```bash
# Run all test suites (Backend Jest + Frontend Vitest)
npm run test

# Or run backend tests individually:
npm run test:backend

# Or run frontend tests individually:
npm run test:frontend
```

### Building for Production:
```bash
npm run build
```
This compiles the backend TypeScript into `backend/dist/` and builds the frontend production bundle into `frontend/dist/`.

---

## 📄 Note on Exporting to PDF
To convert this guide file to a PDF inside VS Code:
1. Install the extension **Markdown PDF** (`yzane.markdown-pdf`).
2. Right-click on `VS_Code_Setup_and_Run_Guide.md` in the VS Code Explorer.
3. Click **Markdown PDF: Export (pdf)**.
