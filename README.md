# Hot Politics — Voting campaign landing page

University campaign landing page for **Hot Politics**, made to be opened via QR code on street posters. Promotes voting with sections on parties, skills, and quizzes.

## Content management platform

You can edit the landing content (parties, skills, quizzes) from an admin UI.

1. **Install and run the server** (from this folder):
   ```bash
   npm install
   npm start
   ```
2. **Open the admin**: [http://localhost:3000/admin/](http://localhost:3000/admin/)
3. **Edit** parties (category, name, description), skills (order, title, description), and quiz questions (question text, options, correct answer).
4. Click **Save all changes** to write updates to `content.json`.

The landing page loads content from `/api/content` when served by this server, or from `content.json` when deployed statically (e.g. GitHub Pages). After saving in the admin, commit and push the updated `content.json` so the public site shows your changes.

## GitHub Pages

This repo is set up for GitHub Pages. After pushing:

1. Open your repo on GitHub → **Settings** → **Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Branch: **main**, Folder: **/ (root)** → Save.
4. Your site will be at `https://<username>.github.io/<repo-name>/`.
