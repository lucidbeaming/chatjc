const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const LIVE_DIR = path.join(__dirname, '..', 'context', 'live');
const files = fs.readdirSync(LIVE_DIR).filter(f => f.endsWith('.html'));

function dedup(text) {
  const lines = text.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
      continue;
    }
    const prev = result.length > 0 ? result[result.length - 1].trim() : '';
    if (trimmed !== prev) result.push(trimmed);
  }
  return result.join('\n').trim();
}

function extractContent($) {
  $('script, style, noscript, svg, img, link, meta, iframe').remove();
  $('.visually-hidden, .sr-only, [class*="a11y-text"]').remove();
  $('[class*="artdeco-button"]').remove();
  $('[class*="feed-identity"], [class*="msg-overlay"]').remove();
  const section = $('main > section').first();
  if (!section.length) return '';
  return section.text();
}

function getLines(raw) {
  return dedup(raw.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n'))
    .split('\n')
    .filter(l => l.trim());
}

// LinkedIn UI noise patterns
const NOISE = [
  /^(Show (fewer|more|all)|See (more|less))$/i,
  /^\d+ profile views?$/,
  /^Open to work$/,
  /^(Message|Connect|Follow|More|Edit|Pending)$/,
  /^Report \/ Block$/,
  /^· \d+(st|nd|rd|th)$/,
  /^All LinkedIn members$/,
  /^(On|Off)$/,
  /^(Received|Given)$/,
  /^Sent$/,
  /^· 1st$/,
  /^Show \d+/,
  /^Honors & awards$/,
];

function isNoise(line) {
  return NOISE.some(p => p.test(line.trim()));
}

// ---- EXPERIENCE ----
function formatExperience(raw) {
  const lines = getLines(raw);
  const output = ['# Experience', ''];
  let i = lines[0] === 'Experience' ? 1 : 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (isNoise(line)) { i++; continue; }

    if (line.startsWith('Skills:')) {
      output.push('- **Skills**: ' + line.replace('Skills: ', ''));
      output.push('');
    } else if (/^\w{3} \d{4}/.test(line) || /^\d{4} -/.test(line)) {
      output.push('*' + line + '*');
    } else if (/\b(Remote|On-site|Hybrid)\b/.test(line) && line.length < 80) {
      output.push('*' + line + '*');
      output.push('');
    } else if (line.includes(' · ') && line.length < 100) {
      output.push('**' + line + '**');
    } else {
      output.push(line);
    }
    i++;
  }
  return output.join('\n');
}

// ---- SKILLS ----
function formatSkills(raw) {
  const lines = getLines(raw);
  const seen = new Set();
  const skills = [];
  let i = lines[0] === 'Skills' ? 1 : 0;

  // Skip category tabs
  while (i < lines.length && /^(All|Industry Knowledge|Tools & Technologies|Other Skills)$/.test(lines[i].trim())) i++;

  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (isNoise(line)) continue;
    // Skip LinkedIn metadata lines
    if (/^\d+ experience/.test(line)) continue;
    if (/^\d+ endorsement/.test(line)) continue;
    if (/^Passed LinkedIn/.test(line)) continue;
    if (/^Learn /.test(line)) continue;
    if (/at (Self-employed|Berliner|Deed|Chegg|Oath|DreamFactory|Charleston|Contract)/.test(line)) continue;
    if (/experiences? across/.test(line)) continue;
    // Skip project references appearing in skills
    if (/^(Art Review Generator|AI-assisted computer|Skulls:|Berlin Art|Berliner Zeitung|Svelte 5 &)/.test(line)) continue;

    // Deduplicate
    const normalized = line.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    skills.push(line);
  }

  return '# Skills\n\n' + skills.map(s => '- ' + s).join('\n');
}

// ---- RECOMMENDATIONS ----
function formatRecommendations(raw) {
  const lines = getLines(raw);
  const output = ['# Recommendations', ''];
  let i = lines[0] === 'Recommendations' ? 1 : 0;

  // Track when we hit "Sent" section to stop (those are outgoing requests, not received recs)
  let inSentSection = false;

  while (i < lines.length) {
    const line = lines[i].trim();
    i++;

    if (isNoise(line)) continue;
    if (line === '· 1st') continue;

    // Detect the transition to sent/pending recommendations
    if (/^(Vishal Patel|Noel Mermer|Carla Clark|Ken Kobre)$/.test(line)) {
      // Check if next lines indicate this is a sent request
      const lookahead = lines.slice(i, i + 5).join(' ');
      if (/Sent|can you write me|recommendation\?|Dear |Hey /.test(lookahead)) {
        inSentSection = true;
      }
    }
    if (inSentSection) continue;

    // Skip LinkedIn URL artifacts
    if (line.includes('linkedin.com')) continue;
    if (/^(Write|Hi |Dear |Hey )/.test(line) && line.includes('recommendation')) continue;

    // Person's name + title line
    if (i < lines.length) {
      const nextLine = lines[i] ? lines[i].trim() : '';
      // If this looks like a name and next is a title/role
      if (/^\w+ \w+$/.test(line) && (nextLine.startsWith('· 1st') || /^(CTO|CEO|CFO|Director|Senior|Media|Executive|Content|Independent)/.test(nextLine))) {
        output.push('## ' + line);
        continue;
      }
    }

    // Date and relationship context
    if (/^\w+ \d+, \d{4},/.test(line)) {
      output.push('*' + line + '*');
      output.push('');
      continue;
    }

    // Role/title descriptions
    if (/^(CTO|CEO|CFO|Director|Senior|Media|Executive|Content|Independent|Proactive)/.test(line) && line.length < 200) {
      output.push('*' + line + '*');
      continue;
    }

    output.push(line);
  }
  return output.join('\n');
}

// ---- GENERIC (awards, projects, volunteering) ----
function formatGeneric(raw, title) {
  const lines = getLines(raw);
  const output = ['# ' + title, ''];
  let i = lines[0] && lines[0].toLowerCase() === title.toLowerCase() ? 1 : 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (isNoise(line)) { i++; continue; }
    if (line === 'Other contributors') { i++; continue; }
    output.push(line);
    i++;
  }
  return output.join('\n');
}

for (const file of files) {
  const html = fs.readFileSync(path.join(LIVE_DIR, file), 'utf-8');
  const $ = cheerio.load(html);

  const raw = extractContent($).replace(/[ \t]+/g, ' ');
  const basename = path.basename(file, '.html');
  const title = basename.charAt(0).toUpperCase() + basename.slice(1);

  let markdown;
  switch (basename) {
    case 'experience': markdown = formatExperience(raw); break;
    case 'skills': markdown = formatSkills(raw); break;
    case 'recommendations': markdown = formatRecommendations(raw); break;
    case 'endorsements':
      // Endorsements page contains same recs as recommendations - skip generating a separate file
      // but still generate it for completeness
      markdown = formatRecommendations(raw);
      break;
    default: markdown = formatGeneric(raw, title); break;
  }

  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  const mdPath = path.join(LIVE_DIR, basename + '.md');
  fs.writeFileSync(mdPath, markdown, 'utf-8');
  console.log(`${file} -> ${basename}.md (${markdown.length} chars)`);
}

console.log('\nDone.');
