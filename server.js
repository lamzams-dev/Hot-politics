const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_FILE = path.join(__dirname, 'content.json');
const MONGODB_URI = process.env.MONGODB_URI;

let db = null;
let contentColl = null;
const CONTENT_ID = 'main';

async function getCollection() {
  if (!contentColl && MONGODB_URI) {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    contentColl = db.collection('content');
    const existing = await contentColl.findOne({ _id: CONTENT_ID });
    if (!existing) {
      let seed = defaultContent();
      try {
        const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
        seed = JSON.parse(raw);
      } catch (_) {}
      await contentColl.insertOne({ _id: CONTENT_ID, ...seed });
    }
  }
  return contentColl;
}

function defaultContent() {
  return {
    parties: [
      { id: 'party-1', category: 'Left / Progressive', name: 'Social Democrats & Greens', description: 'Focus on climate, welfare, and public services.' },
      { id: 'party-2', category: 'Centre', name: 'Liberals & Centrists', description: 'Market-friendly with social safety nets.' },
      { id: 'party-3', category: 'Right / Conservative', name: 'Conservatives & Right', description: 'Emphasis on tradition, law and order, lower taxes.' }
    ],
    skills: [
      { id: 'skill-1', order: 1, title: 'Critical thinking', description: 'Weigh policies and form your own views from evidence.' },
      { id: 'skill-2', order: 2, title: 'Civic literacy', description: 'Understand how elections and governments work.' },
      { id: 'skill-3', order: 3, title: 'Informed debate', description: 'Discuss issues clearly with people who disagree.' },
      { id: 'skill-4', order: 4, title: 'Accountability', description: 'Hold representatives to their promises.' }
    ],
    leaders: [
      {
        id: 'leader-1',
        spectrumOrder: 10,
        spectrumLabel: 'Left',
        name: 'Leader Name (Left)',
        partyName: 'Party Name',
        photoUrl: '',
        briefCv: 'Brief CV goes here.',
        motto: 'Party motto goes here.',
        coreValues: ['Value 1', 'Value 2', 'Value 3'],
        officialUrl: ''
      },
      {
        id: 'leader-2',
        spectrumOrder: 50,
        spectrumLabel: 'Centre',
        name: 'Leader Name (Centre)',
        partyName: 'Party Name',
        photoUrl: '',
        briefCv: 'Brief CV goes here.',
        motto: 'Party motto goes here.',
        coreValues: ['Value 1', 'Value 2', 'Value 3'],
        officialUrl: ''
      },
      {
        id: 'leader-3',
        spectrumOrder: 90,
        spectrumLabel: 'Right',
        name: 'Leader Name (Right)',
        partyName: 'Party Name',
        photoUrl: '',
        briefCv: 'Brief CV goes here.',
        motto: 'Party motto goes here.',
        coreValues: ['Value 1', 'Value 2', 'Value 3'],
        officialUrl: ''
      }
    ],
    quizzes: [
      { id: 'quiz-1', question: 'What is the main purpose of voting in a democracy?', options: ['To choose representatives and influence policy', 'To avoid paying taxes', 'To get free public transport'], correct: 0 }
    ]
  };
}

function readContentSync() {
  try {
    const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultContent();
  }
}

function writeContentSync(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const UPLOAD_DIR = path.join(__dirname, 'assets', 'leaders');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname || '') || '').toLowerCase();
      const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.png';
      cb(null, `${crypto.randomUUID()}${safeExt}`);
    }
  }),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  }
});

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/api/leaders/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Missing photo file' });
  const url = `/assets/leaders/${req.file.filename}`;
  res.json({ ok: true, url });
});

app.get('/api/content', async (req, res) => {
  try {
    const coll = await getCollection();
    if (coll) {
      const doc = await coll.findOne({ _id: CONTENT_ID });
      if (doc) {
        const { _id, ...data } = doc;
        return res.json({
          ...defaultContent(),
          ...data,
          leaders: Array.isArray(data.leaders) ? data.leaders : []
        });
      }
      return res.json(defaultContent());
    }
    const data = readContentSync();
    res.json({
      ...defaultContent(),
      ...data,
      leaders: Array.isArray(data.leaders) ? data.leaders : []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read content' });
  }
});

app.put('/api/content', async (req, res) => {
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
    const leaders = Array.isArray(body.leaders) ? body.leaders : [];
    const data = { parties: body.parties, skills: body.skills, quizzes: body.quizzes, leaders };

    const coll = await getCollection();
    if (coll) {
      await coll.updateOne(
        { _id: CONTENT_ID },
        { $set: data },
        { upsert: true }
      );
      return res.json({ ok: true });
    }
    writeContentSync(data);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to write content' });
  }
});

app.listen(PORT, () => {
  const base = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`Hot Politics server at ${base}`);
  console.log(`Landing: ${base}/`);
  console.log(`Admin:   ${base}/admin/`);
});
