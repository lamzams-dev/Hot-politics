# Deploy Hot Politics (landing + admin) for remote team access

Deploy the app to **Render** and store content in **MongoDB Atlas** so your whole group can edit the site from anywhere. You’ll get one public URL for both the landing page and the admin.

---

## 1. Create a free MongoDB database (MongoDB Atlas)

1. Go to **https://www.mongodb.com/cloud/atlas** and sign up (or log in).
2. Create a **free** cluster (e.g. M0).
3. Click **Database Access** → **Add New Database User**:
   - Username and password (save the password).
   - Role: **Atlas Admin** (or **Read and write to any database**).
4. Click **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) so Render can connect.
5. In **Database** → **Connect** → **Connect your application**, copy the connection string. It looks like:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `USER` and `PASSWORD` with your DB user and password. Add a database name (e.g. `hotpolitics`):
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hotpolitics?retryWrites=true&w=majority
   ```
7. Save this as your **MONGODB_URI** (you’ll paste it into Render in step 3).

---

## 2. Push the repo to GitHub (if not already)

From your project folder:

```bash
cd "/Users/l.zampou/Documents/Docs/Cursor coding/hot-politics-landing"
git add .
git commit -m "Add MongoDB and deployment support"
git push origin main
```

Use your existing repo (e.g. `lamzams-dev/Hot-politics`) or create a new one and push.

---

## 3. Deploy on Render

1. Go to **https://render.com** and sign up (or log in with GitHub).
2. **New** → **Web Service**.
3. Connect your **GitHub** account and select the repo that contains this project (e.g. `Hot-politics`).
4. Settings:
   - **Name:** e.g. `hot-politics`
   - **Region:** choose one close to you.
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Under **Environment**:
   - Add a variable:
     - **Key:** `MONGODB_URI`
     - **Value:** paste your full MongoDB connection string from step 1.
6. Click **Create Web Service**. Render will build and deploy.
7. When it’s live, you’ll get a URL like: **https://hot-politics-xxxx.onrender.com**

---

## 4. Your public URLs

| Use | URL |
|-----|-----|
| **Landing page** (share / QR code) | `https://hot-politics-xxxx.onrender.com/` |
| **Content management (admin)** | `https://hot-politics-xxxx.onrender.com/admin/` |

Share the **admin** URL with your group so they can edit parties, skills, and quizzes from anywhere. Changes are saved in MongoDB and appear on the landing page immediately.

---

## 5. Optional: use a custom name

In Render, after the first deploy: **Settings** → **Custom Domain** to add your own domain, or keep the default `*.onrender.com` URL.

---

## Local development (no MongoDB)

- Run `npm install` and `npm start` without setting `MONGODB_URI`.
- The app will use the local `content.json` file. Good for offline work; deploy to Render + Atlas when you want the team to edit remotely.
