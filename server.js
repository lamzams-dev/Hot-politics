const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_FILE = path.join(__dirname, 'content.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

// CORS for local dev (admin may be on different port if needed)
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function readContent() {
  const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeContent(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET content (for landing page and admin)
app.get('/api/content', (req, res) => {
  try {
    const data = readContent();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

// PUT content (admin saves)
app.put('/api/content', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid body' });
    }
    const hasParties = Array.isArray(body.parties);
    const hasSkills = Array.isArray(body.skills);
    const hasQuizzes = Array.isArray(body.quizzes);
    if (!hasParties || !hasSkills || !hasQuizzes) {
      return res.status(400).json({ error: 'content must have parties, skills, and quizzes arrays' });
    }
    writeContent({
      parties: body.parties,
      skills: body.skills,
      quizzes: body.quizzes
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write content' });
  }
});

app.listen(PORT, () => {
  console.log(`Hot Politics server at http://localhost:${PORT}`);
  console.log(`Landing: http://localhost:${PORT}/`);
  console.log(`Admin:   http://localhost:${PORT}/admin/`);
});
