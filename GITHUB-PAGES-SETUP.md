# GitHub Pages setup — step by step

## 1. Create the repository on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** e.g. `hot-politics` or `hot-politics-landing`
3. **Public**, leave "Add a README" **unchecked** (you already have files)
4. Click **Create repository**

## 2. Push your code

In a terminal, from this folder (`hot-politics-landing`), run (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

```bash
cd "/Users/l.zampou/Documents/Docs/Cursor coding/hot-politics-landing"

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If GitHub asks for login, use a **Personal Access Token** as password (Settings → Developer settings → Personal access tokens) or sign in with GitHub CLI (`gh auth login`).

## 3. Turn on GitHub Pages

1. On GitHub, open your repo → **Settings** → **Pages** (left sidebar).
2. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / **Folder:** `/ (root)`
3. Click **Save**.

## 4. Your live site

After a minute or two, the site will be at:

**https://YOUR_USERNAME.github.io/YOUR_REPO/**

Use that URL for your QR code on the posters.
