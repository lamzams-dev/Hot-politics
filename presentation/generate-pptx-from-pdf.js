#!/usr/bin/env node
'use strict';

/**
 * Generates a redesigned PPTX from a source PDF by extracting page text.
 * Focus: keep slide order + content, restyle to match the site's look.
 *
 * Usage:
 *   node presentation/generate-pptx-from-pdf.js "/abs/path/to/Go Vote.pdf" "Go Vote - Hot Politics.pptx"
 */

const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function normalizeSpaces(s) {
  return String(s || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitPages(text) {
  // The Read tool output shows separators like: "-- 1 of 16 --"
  // pdf-parse typically returns those as well when the PDF has page headers/footers,
  // but we handle both cases:
  const t = normalizeSpaces(text);
  const re = /--\s*\d+\s+of\s+\d+\s*--/gi;
  if (!re.test(t)) {
    // fallback: treat whole doc as 1 page
    return [t];
  }
  return t
    .split(re)
    .map(s => normalizeSpaces(s))
    .filter(Boolean);
}

function parseBullets(lines) {
  const bullets = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^•\s*(.+)$/);
    if (m) bullets.push(m[1].trim());
  }
  return bullets;
}

function stripBulletPrefix(line) {
  return line.replace(/^•\s*/, '').trim();
}

function isAllCapsish(s) {
  const t = s.replace(/[^A-Za-z]/g, '');
  if (!t) return false;
  const upper = t.replace(/[^A-Z]/g, '').length;
  return upper / t.length > 0.9;
}

function pickTitle(lines) {
  // Prefer first non-empty line; if it’s authors block (names spaced out), skip to next.
  const cleaned = lines.map(l => l.trim()).filter(Boolean);
  if (!cleaned.length) return '';
  const first = cleaned[0];
  // Heuristic: title slide has "Go Vote" then several author lines with spaced letters.
  return first;
}

function looksLikeAuthorsLine(line) {
  // e.g. "L A M P R I N I Z A M P O U"
  const t = line.trim();
  if (!t) return false;
  if (t.includes(' ')) {
    const letters = t.replace(/ /g, '');
    const spaces = (t.match(/ /g) || []).length;
    if (spaces >= 6 && letters.length >= 10 && isAllCapsish(letters)) return true;
  }
  return false;
}

function chunkTextIntoLines(text) {
  return normalizeSpaces(text)
    .split('\n')
    .map(l => l.trimEnd());
}

function buildSlideModel(pages) {
  return pages.map((pageText, idx) => {
    const lines = chunkTextIntoLines(pageText).filter(l => l.trim().length > 0);
    const title = pickTitle(lines);
    const bullets = parseBullets(lines);
    const bodyLines = lines
      .slice(1)
      .filter(l => !looksLikeAuthorsLine(l))
      .map(stripBulletPrefix);

    return {
      index: idx + 1,
      title,
      bullets,
      bodyLines
    };
  });
}

function siteTheme() {
  // Inspired by index.html :root
  return {
    bg: '0B0B0C',
    ink: '111113',
    white: 'F5F5F5',
    cream: 'CFCFCF', // approximated
    border: '2A2A2E',
    surface: '141417',
    blue: '2254D8'
  };
}

function addTopBar(slide, ShapeType, theme, deckTitle) {
  // subtle top bar + deck title (like eyebrow)
  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.35,
    fill: { color: theme.ink },
    line: { color: theme.ink }
  });
  slide.addText(deckTitle || 'Hot Politics', {
    x: 0.6,
    y: 0.1,
    w: 12.2,
    h: 0.2,
    fontFace: 'Inter',
    fontSize: 10,
    color: theme.cream,
    bold: true,
    letterSpacing: 1,
    // PptxGenJS uses "align" not "textAlign"
    align: 'left'
  });
}

function addFooter(slide, ShapeType, theme, left, right) {
  slide.addShape(ShapeType.line, {
    x: 0.6,
    y: 7.1,
    w: 12.1,
    h: 0,
    line: { color: theme.border, width: 1 }
  });
  slide.addText(left || '', {
    x: 0.6,
    y: 7.15,
    w: 8.0,
    h: 0.3,
    fontFace: 'Inter',
    fontSize: 10,
    color: theme.cream,
    align: 'left'
  });
  slide.addText(right || '', {
    x: 8.6,
    y: 7.15,
    w: 4.1,
    h: 0.3,
    fontFace: 'Inter',
    fontSize: 10,
    color: theme.cream,
    align: 'right'
  });
}

function addTitle(slide, theme, title, subtitle) {
  slide.addText(title || '', {
    x: 0.9,
    y: 1.4,
    w: 11.6,
    h: 1.2,
    fontFace: 'Instrument Serif',
    fontSize: 54,
    color: theme.white,
    bold: false,
    align: 'left'
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.9,
      y: 2.75,
      w: 11.6,
      h: 0.6,
      fontFace: 'Instrument Serif',
      fontSize: 28,
      italic: true,
      color: theme.cream,
      align: 'left'
    });
  }
}

function addContentCard(slide, ShapeType, theme, title, bullets, bodyLines) {
  // Card container
  slide.addShape(ShapeType.roundRect, {
    x: 0.9,
    y: 1.15,
    w: 11.6,
    h: 5.6,
    fill: { color: theme.surface, transparency: 10 },
    line: { color: theme.border, width: 1 },
    radius: 12
  });

  // Title
  slide.addText(title || '', {
    x: 1.25,
    y: 1.35,
    w: 11.0,
    h: 0.7,
    fontFace: 'Instrument Serif',
    fontSize: 34,
    color: theme.white,
    align: 'left'
  });

  // Bullets (prefer if present)
  const contentY = 2.2;
  const contentH = 4.3;
  const fontFace = 'Inter';
  const fontSize = 18;

  if (bullets && bullets.length) {
    slide.addText(
      bullets.map(t => ({ text: t, options: { bullet: { indent: 22 }, hanging: 6 } })),
      {
        x: 1.25,
        y: contentY,
        w: 11.0,
        h: contentH,
        fontFace,
        fontSize,
        color: theme.white,
        valign: 'top',
        paraSpaceAfter: 8
      }
    );
    return;
  }

  const text = (bodyLines || []).join('\n');
  slide.addText(text, {
    x: 1.25,
    y: contentY,
    w: 11.0,
    h: contentH,
    fontFace,
    fontSize,
    color: theme.white,
    valign: 'top',
    lineSpacingMultiple: 1.15
  });
}

function isDividerSlide(model) {
  // e.g. "Affective Polarization", "Nostalgia", "Website Content"
  const t = (model.title || '').trim();
  const rest = (model.bodyLines || []).filter(Boolean);
  return t.length > 0 && rest.length === 0 && (!model.bullets || model.bullets.length === 0);
}

function addDivider(slide, ShapeType, theme, title) {
  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: theme.bg }
  });
  // soft blue glow
  slide.addShape(ShapeType.ellipse, {
    x: -1.2,
    y: -1.0,
    w: 6.5,
    h: 6.5,
    fill: { color: theme.blue, transparency: 78 },
    line: { color: theme.blue, transparency: 100 }
  });
  slide.addShape(ShapeType.ellipse, {
    x: 8.8,
    y: 3.5,
    w: 6.0,
    h: 6.0,
    fill: { color: theme.white, transparency: 88 },
    line: { color: theme.white, transparency: 100 }
  });
  slide.addText(title || '', {
    x: 0.9,
    y: 2.9,
    w: 11.6,
    h: 1.4,
    fontFace: 'Instrument Serif',
    fontSize: 60,
    color: theme.white,
    align: 'left'
  });
}

async function main() {
  const inputPdf = process.argv[2];
  const outputName = process.argv[3] || 'Go Vote - Hot Politics.pptx';
  if (!inputPdf) die('Missing input PDF path.\nUsage: node presentation/generate-pptx-from-pdf.js "/abs/path/to/Go Vote.pdf" "Go Vote - Hot Politics.pptx"');
  if (!fs.existsSync(inputPdf)) die(`PDF not found: ${inputPdf}`);

  const buf = fs.readFileSync(inputPdf);

  // pdfjs-dist is ESM; use dynamic import from CJS.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const pdf = await loadingTask.promise;

  async function extractPageText(pageIndex1) {
    const page = await pdf.getPage(pageIndex1);
    const tc = await page.getTextContent();
    // tc.items entries usually include { str, transform }
    // We'll rebuild lines by grouping close Y values.
    const items = (tc.items || [])
      .map(it => {
        const str = String(it.str || '').trimEnd();
        const y = Array.isArray(it.transform) ? it.transform[5] : 0;
        const x = Array.isArray(it.transform) ? it.transform[4] : 0;
        return { str, x, y };
      })
      .filter(it => it.str.trim().length > 0);

    // Sort top-to-bottom, then left-to-right
    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

    const lines = [];
    const yThreshold = 3; // tweak for typical PDF text scale
    for (const it of items) {
      const last = lines[lines.length - 1];
      if (!last || Math.abs(last.y - it.y) > yThreshold) {
        lines.push({ y: it.y, parts: [it] });
      } else {
        last.parts.push(it);
      }
    }

    const textLines = lines.map(l => {
      // restore left-to-right inside a line
      l.parts.sort((a, b) => a.x - b.x);
      // join with spaces, then normalize
      return l.parts.map(p => p.str).join(' ').replace(/\s+/g, ' ').trim();
    });

    return normalizeSpaces(textLines.join('\n'));
  }

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    pages.push(await extractPageText(i));
  }
  const models = buildSlideModel(pages);

  const theme = siteTheme();
  const pptx = new pptxgen();
  const { ShapeType } = pptx;
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
  pptx.author = 'Hot Politics';
  pptx.company = 'Hot Politics';
  pptx.subject = 'Go Vote — redesigned deck';

  // Theme fonts (PowerPoint will substitute if not installed)
  pptx.theme = {
    headFontFace: 'Instrument Serif',
    bodyFontFace: 'Inter',
    lang: 'en-US'
  };

  const deckTitle = 'Hot Politics — Go Vote';

  models.forEach((m, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: theme.bg };

    // Slide 1: title slide special-case
    if (i === 0) {
      addTopBar(slide, ShapeType, theme, deckTitle);
      // Gather authors from remaining lines on page 1
      const authors = chunkTextIntoLines(pages[0])
        .slice(1)
        .filter(looksLikeAuthorsLine)
        .map(l => l.replace(/\s+/g, ' ').trim())
        .join('\n');

      addTitle(slide, theme, m.title || 'Go Vote', 'Don’t let others decide your future.');
      if (authors) {
        slide.addShape(ShapeType.roundRect, {
          x: 0.9,
          y: 4.35,
          w: 6.2,
          h: 2.0,
          fill: { color: theme.surface, transparency: 8 },
          line: { color: theme.border, width: 1 },
          radius: 12
        });
        slide.addText(authors, {
          x: 1.2,
          y: 4.6,
          w: 5.6,
          h: 1.6,
          fontFace: 'Inter',
          fontSize: 14,
          color: theme.cream,
          valign: 'top'
        });
      }
      addFooter(slide, ShapeType, theme, 'Presentation', '1');
      return;
    }

    // Divider slides
    if (isDividerSlide(m)) {
      addDivider(slide, ShapeType, theme, (m.title || '').trim());
      addFooter(slide, ShapeType, theme, 'Go Vote', String(m.index));
      return;
    }

    addTopBar(slide, ShapeType, theme, deckTitle);
    addContentCard(slide, ShapeType, theme, m.title, m.bullets, m.bodyLines);
    addFooter(slide, ShapeType, theme, 'Go Vote', String(m.index));
  });

  const outPath = path.resolve(process.cwd(), 'presentation', outputName);
  await pptx.writeFile({ fileName: outPath });
  process.stdout.write(`Wrote ${outPath}\n`);
}

main().catch(err => {
  process.stderr.write(`${err && err.stack ? err.stack : String(err)}\n`);
  process.exit(1);
});

