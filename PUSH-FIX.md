# Fix: "failed to push some refs"

This usually means GitHub has an initial commit (e.g. README) that you don't have locally. Merge them and push:

## Option A — Merge remote with yours (recommended)

Run in this folder:

```bash
cd "/Users/l.zampou/Documents/Docs/Cursor coding/hot-politics-landing"

git pull origin main --allow-unrelated-histories --no-edit
git push -u origin main
```

If you get a merge conflict (e.g. on README), keep your version and commit:

```bash
git add .
git commit -m "Merge with GitHub repo"
git push -u origin main
```

## Option B — Overwrite GitHub (only if the repo is empty or you don’t need what’s there)

**Warning:** This replaces everything on GitHub with your local branch.

```bash
git push -u origin main --force
```

Use Option A unless you’re sure Option B is what you want.
