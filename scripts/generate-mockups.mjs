/**
 * Generate interim premium product mockups for Best Man Backup.
 * Run: node scripts/generate-mockups.mjs
 * Output: assets/mockups/*.{jpg,webp}
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'mockups');
const SHIELD = path.join(ROOT, 'assets', 'bmb-shield-512.png');

const NAVY = '#132238';
const NAVY_MID = '#203653';
const NAVY_DEEP = '#0B1524';
const IVORY = '#F7F4EE';
const IVORY_SOFT = '#FBF9F5';
const GOLD = '#D4A84F';
const GOLD_SOFT = '#E6C87A';
const INK = '#1A2433';
const MUTED = '#4A5564';
const RULE = '#D8CFC0';
const TAGLINE = "You've Got His Back, We've Got Yours.";

fs.mkdirSync(OUT, { recursive: true });

const shieldB64 = fs.readFileSync(SHIELD).toString('base64');
const shieldDataUri = `data:image/png;base64,${shieldB64}`;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapLines(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function fontFaceCss() {
  return `
    .serif { font-family: 'Nimbus Roman', 'Times New Roman', Georgia, serif; }
    .sans { font-family: 'Nimbus Sans', 'Helvetica Neue', Arial, sans-serif; }
  `;
}

/** Premium product cover — navy / ivory / gold bands */
function coverSvg({
  width = 760,
  height = 1074,
  titleLines,
  action,
  support,
  bullets,
  startLine,
  insideLabel = 'INSIDE YOUR KIT',
}) {
  const pad = 52;
  const navyH = 560;
  const footH = 72;
  const ivoryY = navyH;
  const ivoryH = height - navyH - footH;

  const titleStartY = 210;
  const titleLh = 58;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${pad}" y="${titleStartY + i * titleLh}" class="serif" font-size="48" font-weight="700" fill="${IVORY}">${esc(line)}</text>`
    )
    .join('\n');

  const afterTitle = titleStartY + titleLines.length * titleLh + 18;
  let bulletY = ivoryY + 78;
  const bulletSvg = bullets
    .map((b) => {
      const lines = wrapLines(b, 42);
      const block = lines
        .map(
          (ln, i) =>
            `<text x="${pad + 28}" y="${bulletY + i * 26}" class="sans" font-size="18" fill="${INK}">${esc(ln)}</text>`
        )
        .join('\n');
      const diamond = `<rect x="${pad + 4}" y="${bulletY - 11}" width="10" height="10" fill="${GOLD}" transform="rotate(45 ${pad + 9} ${bulletY - 6})"/>`;
      const out = `${diamond}\n${block}`;
      bulletY += lines.length * 26 + 18;
      return out;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="navyGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY_MID}"/>
      <stop offset="45%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
    </linearGradient>
    <style><![CDATA[
      ${fontFaceCss()}
    ]]></style>
  </defs>

  <rect width="${width}" height="${height}" fill="${IVORY}"/>
  <rect width="${width}" height="${navyH}" fill="url(#navyGrad)"/>
  <rect width="${width}" height="${navyH}" fill="url(#sheen)"/>

  <!-- Brand mark -->
  <image href="${shieldDataUri}" x="${pad - 4}" y="36" width="54" height="54"/>
  <text x="${pad + 62}" y="72" class="serif" font-size="22" font-weight="700" letter-spacing="2.5" fill="${GOLD}">BEST MAN BACKUP</text>

  ${titleSvg}
  <text x="${pad}" y="${afterTitle}" class="sans" font-size="20" font-weight="700" letter-spacing="3.5" fill="${GOLD}">${esc(action)}</text>
  <text x="${pad}" y="${afterTitle + 36}" class="serif" font-size="22" fill="${IVORY}">${esc(support)}</text>

  <line x1="${pad}" y1="${afterTitle + 68}" x2="${width - pad}" y2="${afterTitle + 68}" stroke="${GOLD}" stroke-width="1.25" stroke-opacity="0.85"/>
  <text x="${pad}" y="${afterTitle + 98}" class="sans" font-size="12" font-weight="700" letter-spacing="2.2" fill="${IVORY}" fill-opacity="0.88">DIGITAL DOWNLOAD  ·  EDITABLE AND PRINTABLE</text>

  <!-- Ivory contents band -->
  <rect y="${ivoryY}" width="${width}" height="${ivoryH}" fill="${IVORY}"/>
  <text x="${pad}" y="${ivoryY + 42}" class="sans" font-size="13" font-weight="700" letter-spacing="2.4" fill="${NAVY}">${esc(insideLabel)}</text>
  ${bulletSvg}
  <line x1="${pad}" y1="${height - footH - 52}" x2="${width - pad}" y2="${height - footH - 52}" stroke="${RULE}" stroke-width="1"/>
  <text x="${pad}" y="${height - footH - 24}" class="sans" font-size="16" font-weight="700" fill="${NAVY}">${esc(startLine)}</text>

  <!-- Footer -->
  <rect y="${height - footH}" width="${width}" height="${footH}" fill="${NAVY}"/>
  <text x="${width / 2}" y="${height - footH / 2 + 5}" text-anchor="middle" class="sans" font-size="14" fill="${IVORY}">${esc(TAGLINE)}</text>
</svg>`;
}

/** Interior page on a soft studio backdrop */
function pageMockupSvg({
  width = 900,
  height = 1273,
  pageContent,
}) {
  const pageW = 720;
  const pageH = 1020;
  const pageX = (width - pageW) / 2;
  const pageY = 96;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="studio" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${NAVY_MID}"/>
      <stop offset="55%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <filter id="pageShadow" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <style><![CDATA[
      ${fontFaceCss()}
    ]]></style>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#studio)"/>
  <circle cx="120" cy="180" r="220" fill="${GOLD}" fill-opacity="0.05"/>
  <circle cx="820" cy="1100" r="280" fill="#ffffff" fill-opacity="0.03"/>

  <g filter="url(#pageShadow)">
    <rect x="${pageX}" y="${pageY}" width="${pageW}" height="${pageH}" rx="4" fill="${IVORY_SOFT}"/>
  </g>
  <!-- subtle paper edge -->
  <rect x="${pageX}" y="${pageY}" width="${pageW}" height="${pageH}" rx="4" fill="none" stroke="${GOLD}" stroke-opacity="0.22" stroke-width="1"/>

  <svg x="${pageX}" y="${pageY}" width="${pageW}" height="${pageH}" viewBox="0 0 ${pageW} ${pageH}">
    ${pageContent(pageW, pageH)}
  </svg>
</svg>`;
}

function speechInsideContent(pw, ph) {
  const pad = 48;
  return `
    <image href="${shieldDataUri}" x="${pw / 2 - 18}" y="28" width="36" height="36"/>
    <text x="${pw / 2}" y="84" text-anchor="middle" class="sans" font-size="12" font-weight="700" letter-spacing="2.4" fill="${NAVY}">BEST MAN BACKUP</text>
    <text x="${pw / 2}" y="104" text-anchor="middle" class="sans" font-size="11" letter-spacing="1.8" fill="${GOLD}">SPEECH KIT  ·  GUIDE</text>

    <text x="${pad}" y="160" class="serif" font-size="36" font-weight="700" fill="${NAVY}">A quieter story</text>
    <text x="${pad}" y="192" class="sans" font-size="15" fill="${MUTED}">Turn an ordinary memory into a passage that sounds like you.</text>
    <line x1="${pad}" y1="214" x2="${pw - pad}" y2="214" stroke="${GOLD}" stroke-width="1.2" stroke-opacity="0.7"/>

    <rect x="${pad}" y="236" width="${pw - pad * 2}" height="118" rx="6" fill="#EEF2F6"/>
    <text x="${pad + 20}" y="266" class="sans" font-size="12" font-weight="700" letter-spacing="1.6" fill="${GOLD}">WORKED EXAMPLE</text>
    <text x="${pad + 20}" y="294" class="serif" font-size="18" fill="${NAVY}">He always brought snacks.</text>
    <text x="${pad + 20}" y="322" class="sans" font-size="14" fill="${MUTED}">One ordinary habit. Enough to open a sincere passage.</text>

    ${section(pad, 390, 'The rough notes', 'Write the facts first: who was there, what happened, why it still matters.')}
    ${section(pad, 470, 'The spoken passage', 'Shape the notes into sentences you can say out loud without rushing.')}
    ${section(pad, 550, 'Make the connection', 'Link the story to the couple — not a punchline, a reason he is trusted.')}
    ${section(pad, 630, 'Cue prompts', 'Cut the passage to short reminders. Keep the names and the toast intact.')}

    <rect x="${pad}" y="720" width="${pw - pad * 2}" height="120" rx="6" fill="${NAVY}"/>
    <text x="${pad + 22}" y="758" class="sans" font-size="12" font-weight="700" letter-spacing="1.8" fill="${GOLD}">REHEARSAL NOTE</text>
    <text x="${pad + 22}" y="790" class="sans" font-size="15" fill="${IVORY}">Practise standing up from your cue cards.</text>
    <text x="${pad + 22}" y="816" class="sans" font-size="14" fill="${IVORY}" fill-opacity="0.85">Look up. Pause. Let the room catch the line.</text>

    <rect y="${ph - 56}" width="${pw}" height="56" fill="${NAVY}"/>
    <text x="${pw / 2}" y="${ph - 24}" text-anchor="middle" class="sans" font-size="12" fill="${IVORY}">${esc(TAGLINE)}</text>
  `;
}

function dutiesInsideContent(pw, ph) {
  const pad = 48;
  const cards = [
    { n: '01', t: 'Confirm the plan', d: 'Ask what is already booked and what still needs a named owner.' },
    { n: '02', t: 'Wedding-day sheet', d: 'One page for timing, names, transport and who holds spare items.' },
    { n: '03', t: 'Carry cards', d: 'Pocket reminders for speeches order, toasts and key contacts.' },
  ];
  const cardSvg = cards
    .map((c, i) => {
      const y = 250 + i * 130;
      return `
        <rect x="${pad}" y="${y}" width="${pw - pad * 2}" height="112" rx="8" fill="#FFFFFF" stroke="${RULE}" stroke-width="1.2"/>
        <rect x="${pad}" y="${y}" width="8" height="112" rx="2" fill="${GOLD}"/>
        <text x="${pad + 28}" y="${y + 38}" class="sans" font-size="12" font-weight="700" letter-spacing="2" fill="${GOLD}">${c.n}</text>
        <text x="${pad + 28}" y="${y + 68}" class="serif" font-size="22" font-weight="700" fill="${NAVY}">${esc(c.t)}</text>
        <text x="${pad + 28}" y="${y + 94}" class="sans" font-size="14" fill="${MUTED}">${esc(c.d)}</text>
      `;
    })
    .join('\n');

  return `
    <image href="${shieldDataUri}" x="${pw / 2 - 18}" y="28" width="36" height="36"/>
    <text x="${pw / 2}" y="84" text-anchor="middle" class="sans" font-size="12" font-weight="700" letter-spacing="2.4" fill="${NAVY}">BEST MAN BACKUP</text>
    <text x="${pw / 2}" y="104" text-anchor="middle" class="sans" font-size="11" letter-spacing="1.8" fill="${GOLD}">DUTIES KIT  ·  PLANNER</text>

    <text x="${pad}" y="160" class="serif" font-size="32" font-weight="700" fill="${NAVY}">When time or circumstances differ</text>
    <text x="${pad}" y="196" class="sans" font-size="15" fill="${MUTED}">Start with the couple’s actual arrangements, whatever the tradition.</text>
    <line x1="${pad}" y1="218" x2="${pw - pad}" y2="218" stroke="${GOLD}" stroke-width="1.2" stroke-opacity="0.7"/>

    ${cardSvg}

    <text x="${pad}" y="670" class="sans" font-size="13" font-weight="700" letter-spacing="1.8" fill="${GOLD}">KEEP THE SHORT VERSION USABLE</text>
    <text x="${pad}" y="700" class="sans" font-size="15" fill="${INK}">Save a local copy of the day sheet on your phone.</text>
    <text x="${pad}" y="726" class="sans" font-size="15" fill="${MUTED}">Confirm names, pronunciations and anything off limits early.</text>
    <text x="${pad}" y="752" class="sans" font-size="15" fill="${MUTED}">Hand one helper a clear job — not a vague “help out”.</text>

    <rect y="${ph - 56}" width="${pw}" height="56" fill="${NAVY}"/>
    <text x="${pw / 2}" y="${ph - 24}" text-anchor="middle" class="sans" font-size="12" fill="${IVORY}">${esc(TAGLINE)}</text>
  `;
}

function playbookInsideContent(pw, ph) {
  const pad = 40;
  const cells = [
    'Group photo retaken',
    'An impression of him',
    'Checks the football',
    'The groom wins a game',
    'A toast to the partner',
    'Someone loses a bet',
    'A story from school',
    'Late arrival apology',
    'Phone on the table',
    'A round of applause',
    'New nickname stuck',
    'Quiet check-in aside',
    'Song request shouted',
    'Jacket left behind',
    'Someone plans next year',
    'Groom looks proud',
  ];

  function grid(label, ox, oy, size) {
    const gap = 4;
    const cell = (size - gap * 3) / 4;
    let out = `
      <text x="${ox}" y="${oy - 12}" class="sans" font-size="11" font-weight="700" letter-spacing="1.6" fill="${GOLD}">${label}</text>
      <text x="${ox + size}" y="${oy - 12}" text-anchor="end" class="sans" font-size="12" fill="${MUTED}">Name: ________</text>
      <rect x="${ox}" y="${oy}" width="${size}" height="${size}" fill="#FFFFFF" stroke="${NAVY}" stroke-width="1.5"/>
    `;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 4 + c;
        const x = ox + c * (cell + gap);
        const y = oy + r * (cell + gap);
        const lines = wrapLines(cells[i], 12);
        out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${IVORY}" stroke="${NAVY}" stroke-width="0.8"/>`;
        lines.forEach((ln, li) => {
          const ty = y + cell / 2 - ((lines.length - 1) * 11) / 2 + li * 11 + 4;
          out += `<text x="${x + cell / 2}" y="${ty}" text-anchor="middle" class="sans" font-size="10" fill="${INK}">${esc(ln)}</text>`;
        });
      }
    }
    return out;
  }

  const size = 280;
  const left = pad;
  const right = pw - pad - size;

  return `
    <text x="${pad}" y="36" class="sans" font-size="11" font-weight="700" letter-spacing="1.8" fill="${GOLD}">STAG BINGO</text>
    <text x="${pw - pad}" y="36" text-anchor="end" class="sans" font-size="11" font-weight="700" letter-spacing="1.8" fill="${GOLD}">BEST MAN BACKUP</text>
    <text x="${pad}" y="78" class="serif" font-size="34" font-weight="700" fill="${NAVY}">Stag Bingo.</text>
    <text x="${pad}" y="108" class="sans" font-size="13" fill="${MUTED}">Mark a square when you see it. Observed, never staged. Shout “Stag!” for a line.</text>
    <line x1="${pad}" y1="126" x2="${pw - pad}" y2="126" stroke="${GOLD}" stroke-width="1" stroke-opacity="0.65"/>

    ${grid('CARD A', left, 160, size)}
    ${grid('CARD B', right, 160, size)}

    <rect x="${pad}" y="480" width="${pw - pad * 2}" height="88" rx="6" fill="${NAVY}"/>
    <text x="${pad + 20}" y="516" class="sans" font-size="12" font-weight="700" letter-spacing="1.6" fill="${GOLD}">HOST TIP</text>
    <text x="${pad + 20}" y="544" class="sans" font-size="14" fill="${IVORY}">Print two cards per guest. Keep scoring simple. Crown the Stag Awards at the end.</text>

    <text x="${pad}" y="620" class="serif" font-size="22" font-weight="700" fill="${NAVY}">Also in the Playbook</text>
    <text x="${pad}" y="656" class="sans" font-size="15" fill="${INK}">· Eight games with clear rules and running order</text>
    <text x="${pad}" y="684" class="sans" font-size="15" fill="${INK}">· Groom quiz and challenge cards</text>
    <text x="${pad}" y="712" class="sans" font-size="15" fill="${INK}">· Stag Awards — UK and US editions</text>

    <line x1="${pad}" y1="${ph - 78}" x2="${pw - pad}" y2="${ph - 78}" stroke="${RULE}" stroke-width="1"/>
    <image href="${shieldDataUri}" x="${pad}" y="${ph - 58}" width="28" height="28"/>
    <text x="${pad + 40}" y="${ph - 38}" class="sans" font-size="11" fill="${NAVY}">BEST MAN BACKUP  ·  PLAYBOOK  ·  GAMES</text>
    <text x="${pw - pad}" y="${ph - 38}" text-anchor="end" class="sans" font-size="14" font-weight="700" fill="${NAVY}">08</text>
  `;
}

function section(x, y, title, body) {
  return `
    <text x="${x}" y="${y}" class="sans" font-size="16" font-weight="700" fill="${NAVY}">${esc(title)}</text>
    <text x="${x}" y="${y + 26}" class="sans" font-size="14" fill="${MUTED}">${esc(body)}</text>
  `;
}

/** Fan of filled cue cards on studio backdrop */
function cueCardsSvg(width = 900, height = 1165) {
  const cards = [
    {
      n: '1',
      label: 'OPENING',
      lines: ['Thank you for being here.', 'I’m [Name], and I’ve known', 'him since we were sixteen.'],
      pause: 'PAUSE / LOOK UP',
      rot: -7,
      x: 100,
      y: 300,
    },
    {
      n: '2',
      label: 'FRIENDSHIP',
      lines: ['The night the car broke down.', 'He turned up with coffee', 'before anyone asked.'],
      pause: 'PAUSE / LOOK UP',
      rot: 2,
      x: 270,
      y: 390,
    },
    {
      n: '3',
      label: 'THE TOAST',
      lines: ['To [Partner] and [Groom] —', 'to ordinary days made better', 'because they have each other.'],
      pause: 'RAISE GLASS',
      rot: 8,
      x: 420,
      y: 320,
    },
  ];

  const cardW = 340;
  const cardH = 200;

  const cardNodes = cards
    .map((c) => {
      const lineSvg = c.lines
        .map(
          (ln, i) =>
            `<text x="28" y="${88 + i * 28}" class="serif" font-size="18" fill="${NAVY}">${esc(ln)}</text>`
        )
        .join('\n');
      return `
      <g transform="translate(${c.x} ${c.y}) rotate(${c.rot})">
        <rect x="6" y="10" width="${cardW}" height="${cardH}" rx="10" fill="#000000" fill-opacity="0.22"/>
        <rect width="${cardW}" height="${cardH}" rx="10" fill="${IVORY_SOFT}" stroke="${GOLD}" stroke-width="2"/>
        <text x="28" y="42" class="sans" font-size="13" font-weight="700" letter-spacing="2.2" fill="${GOLD}">${c.n}  ${c.label}</text>
        <line x1="28" y1="56" x2="${cardW - 28}" y2="56" stroke="${RULE}" stroke-width="1"/>
        ${lineSvg}
        <text x="28" y="${cardH - 24}" class="sans" font-size="12" font-weight="700" letter-spacing="1.5" fill="${MUTED}">${esc(c.pause)}</text>
      </g>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="studio2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY_MID}"/>
      <stop offset="50%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <style><![CDATA[
      ${fontFaceCss()}
    ]]></style>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#studio2)"/>
  <circle cx="80" cy="160" r="200" fill="${GOLD}" fill-opacity="0.06"/>
  <circle cx="820" cy="980" r="260" fill="#fff" fill-opacity="0.03"/>

  <image href="${shieldDataUri}" x="${width / 2 - 28}" y="56" width="56" height="56"/>
  <text x="${width / 2}" y="140" text-anchor="middle" class="sans" font-size="13" font-weight="700" letter-spacing="2.6" fill="${GOLD}">BEST MAN BACKUP</text>
  <text x="${width / 2}" y="168" text-anchor="middle" class="serif" font-size="34" font-weight="700" fill="${IVORY}">Your cue cards</text>
  <text x="${width / 2}" y="202" text-anchor="middle" class="sans" font-size="15" fill="${IVORY}" fill-opacity="0.85">Short reminders. Large type. Ready for the room.</text>

  ${cardNodes}

  <text x="${width / 2}" y="1000" text-anchor="middle" class="sans" font-size="14" fill="${IVORY}" fill-opacity="0.9">Six cards · A4 and US Letter · type or handwrite</text>
  <text x="${width / 2}" y="1070" text-anchor="middle" class="sans" font-size="14" fill="${GOLD}">${esc(TAGLINE)}</text>
</svg>`;
}

async function writeOutputs(name, svg, { width, height }) {
  const input = Buffer.from(svg);
  const jpgPath = path.join(OUT, `${name}.jpg`);
  const webpPath = path.join(OUT, `${name}.webp`);

  // Start a bit lower quality and tighten until under ~200KB
  let quality = 82;
  let jpgBuf;
  for (let i = 0; i < 6; i++) {
    jpgBuf = await sharp(input, { density: 144 })
      .resize(width, height, { fit: 'fill' })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    if (jpgBuf.length <= 195_000 || quality <= 58) break;
    quality -= 6;
  }

  const webpBuf = await sharp(jpgBuf)
    .webp({ quality: Math.max(68, quality - 4) })
    .toBuffer();

  fs.writeFileSync(jpgPath, jpgBuf);
  fs.writeFileSync(webpPath, webpBuf);

  return {
    name,
    width,
    height,
    jpgKB: Math.round(jpgBuf.length / 1024),
    webpKB: Math.round(webpBuf.length / 1024),
    jpgQuality: quality,
  };
}

const covers = [
  {
    name: 'speech-cover',
    titleLines: ['Best Man', 'Speech Kit'],
    action: 'SAY IT.',
    support: 'Your stories. A speech that sounds like you.',
    bullets: [
      'A writing guide with worked examples and editing advice',
      'An editable workbook and final-speech document',
      'Six cue cards and a practical rehearsal checklist',
    ],
    startLine: 'Open the Start Here file in your Speech Kit.',
  },
  {
    name: 'duties-cover',
    titleLines: ['Best Man', 'Duties Kit'],
    action: 'PLAN IT.',
    support: 'Know the role. Own the details.',
    bullets: [
      'A practical guide to the responsibilities that matter',
      'An editable planner for people, tasks and arrangements',
      'A wedding-day sheet and carry cards',
    ],
    startLine: 'Open the Start Here file in your Duties Kit.',
  },
  {
    name: 'playbook-cover',
    titleLines: ['Stag Do & Bachelor', 'Party Playbook'],
    action: 'FOR THE NIGHT.',
    support: 'Run the night. Make him the hero.',
    bullets: [
      'A host guide with the running order, scoring and rules',
      'Eight games, challenge cards and Stag Awards',
      'UK stag do and US bachelor party editions',
    ],
    startLine: 'Open the Start Here file in your Playbook.',
  },
  {
    name: 'bundle-cover',
    titleLines: ['Best Man', 'Bundle'],
    action: 'PLAN IT. OWN IT. SAY IT.',
    support: 'From accepting the role to the final toast.',
    bullets: [
      'Best Man Duties Kit',
      'Stag Do & Bachelor Party Playbook',
      'Best Man Speech Kit',
    ],
    startLine: 'Open the Bundle Start Here before choosing a kit.',
    insideLabel: 'INSIDE YOUR BUNDLE',
  },
];

const interiors = [
  { name: 'speech-inside', content: speechInsideContent, w: 900, h: 1273 },
  { name: 'duties-inside', content: dutiesInsideContent, w: 900, h: 1273 },
  { name: 'playbook-inside', content: playbookInsideContent, w: 900, h: 1273 },
];

async function main() {
  const results = [];

  for (const c of covers) {
    const svg = coverSvg(c);
    results.push(await writeOutputs(c.name, svg, { width: 760, height: 1074 }));
  }

  for (const p of interiors) {
    const svg = pageMockupSvg({
      width: p.w,
      height: p.h,
      pageContent: p.content,
    });
    results.push(await writeOutputs(p.name, svg, { width: p.w, height: p.h }));
  }

  results.push(
    await writeOutputs('cue-cards', cueCardsSvg(900, 1165), {
      width: 900,
      height: 1165,
    })
  );

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
