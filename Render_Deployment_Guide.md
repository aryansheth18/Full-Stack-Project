# Render Deployment Guide

Follow these simple steps to deploy your **Store Rating Platform** (`https://github.com/aryansheth18/Full-Stack-Project`) to **Render.com** for free.

---

## 📌 Prerequisites & Code Updates Completed
The repository has already been configured with:
1. `render.yaml` Blueprint file for automatic deployment.
2. `VITE_API_URL` support in `frontend/src/api/client.ts` for cross-origin API calls.
3. Automatic Prisma Client generation during backend build (`prisma generate && tsc`).

Before deploying, **make sure to push the latest code changes to your GitHub repository**:
```bash
git add .
git commit -m "Configure Render deployment settings and VITE_API_URL"
git push origin main
```

---

## 🚀 Method 1: Blueprint Deployment (Recommended - Easiest & Fastest)

Render can auto-detect `render.yaml` and provision all 3 components (**PostgreSQL Database**, **Backend Web Service**, and **Frontend Static Site**) automatically:

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and log in.
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub account and select your repository: `Full-Stack-Project`.
4. Render will read `render.yaml` and list 3 resources to create:
   - `store-rating-db` (PostgreSQL Database)
   - `store-rating-backend` (Web Service)
   - `store-rating-frontend` (Static Site)
5. Click **Apply**.
6. Once deployed, note down your Backend URL (e.g. `https://store-rating-backend.onrender.com`) and update `CORS_ORIGIN` in backend environment variables if your Frontend URL differs.

---

## 🛠️ Method 2: Manual Step-by-Step Deployment

If you prefer setting up each component manually on Render:

### Step 1: Create PostgreSQL Database on Render
1. Click **New +** -> **PostgreSQL**.
2. **Name**: `store-rating-db`
3. **Database Name**: `storerating`
4. **User**: `storerating_user`
5. **Region**: Choose closest to you (e.g., Singapore / Oregon).
6. **Plan**: Free.
7. Click **Create Database**.
8. Once created, copy the **Internal Database URL** (or External Database URL).

---

### Step 2: Deploy Backend Web Service
1. Click **New +** -> **Web Service**.
2. Select your GitHub repository (`Full-Stack-Project`).
3. Fill in the configuration:
   - **Name**: `store-rating-backend`
   - **Region**: Same region as database
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx prisma db push && npm run seed && npm start`
   - **Instance Type**: Free

4. Expand **Environment Variables** and add:
   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Paste Internal DB URL from Step 1)* |
   | `JWT_SECRET` | *(Enter a random secret string, e.g. 32+ random characters)* |
   | `JWT_REFRESH_SECRET` | *(Enter another random secret string)* |
   | `CORS_ORIGIN` | `https://store-rating-frontend.onrender.com` *(Or your frontend URL)* |

5. Click **Create Web Service**.
6. Wait for deployment to complete and copy the backend URL (e.g., `https://store-rating-backend.onrender.com`).

---

### Step 3: Deploy Frontend Static Site
1. Click **New +** -> **Static Site**.
2. Select your GitHub repository (`Full-Stack-Project`).
3. Fill in the configuration:
   - **Name**: `store-rating-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Expand **Environment Variables** and add:
   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://store-rating-backend.onrender.com/api` *(Replace with your backend URL)* |

5. Add **Rewrite Rule** (for Single Page Application routing):
   - **Source**: `/*`
   - **Destination**: `/index.html`

6. Click **Create Static Site**.

---

## 🔑 Default Login Credentials (After Auto-Seeding)

Once deployed, the backend automatically seeds the database with test accounts:

- **System Administrator**: `admin@storerating.com` / `AdminPass123!`
- **Store Owner**: `owner@storerating.com` / `OwnerPass123!`
- **Normal User**: `user@storerating.com` / `UserPass123!`

---

## ❓ Troubleshooting Render Deployments

1. **Free Tier Cold Starts**: Render's free tier web services spin down after 15 minutes of inactivity. The first request after spin-down might take 30-50 seconds to respond.
2. **CORS Errors**: If frontend fails to connect to backend, check `CORS_ORIGIN` in backend environment variables and `VITE_API_URL` in frontend environment variables.
3. **Database Connection Issues**: Make sure `DATABASE_URL` in the backend service environment variables ends with `?sslmode=require` if required by Render.
