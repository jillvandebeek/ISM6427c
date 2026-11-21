// Ruimtewacht: checks every NASA endpoint the quiz depends on and writes a report.
// Run with Node 20+ (built-in fetch). No dependencies.
import { appendFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const monthAgo = new Date(today.getTime() - 30 * 86400000);

// Same endpoints and the same response shape checks as app.js uses.
const checks = [
  {
    name: 'APOD (science.nasa.gov)',
    url: `https://science.nasa.gov/wp-json/wp/v2/apod-basic/240101?api_key=${KEY}`,
    ok: (d) => !!(Array.isArray(d) ? d[0] : d)?.title,
  },
  {
    name: 'NeoWs (planetoïden van vandaag)',
    url: `https://api.nasa.gov/neo/rest/v1/feed?start_date=${iso(today)}&end_date=${iso(today)}&api_key=${KEY}`,
    ok: (d) => d && typeof d.near_earth_objects === 'object',
  },
  {
    name: 'DONKI (zonnevlammen, 30 dagen)',
    url: `https://api.nasa.gov/DONKI/FLR?startDate=${iso(monthAgo)}&endDate=${iso(today)}&api_key=${KEY}`,
    ok: (d) => Array.isArray(d),
  },
  {
    name: 'EPIC (foto van de Aarde)',
    url: `https://api.nasa.gov/EPIC/api/natural/images?api_key=${KEY}`,
    ok: (d) => Array.isArray(d) && d.length > 0 && !!d[0].image,
  },
  {
    name: 'NASA Image Library',
    url: 'https://images-api.nasa.gov/search?q=Mars%20rover&media_type=image',
    ok: (d) => Array.isArray(d?.collection?.items) && d.collection.items.length > 0,
  },
];

async function run(check) {
  const started = Date.now();
  try {
    const res = await fetch(check.url, { signal: AbortSignal.timeout(20000) });
    const ms = Date.now() - started;
    if (res.status === 429) return { ...check, status: 'warn', detail: 'Rate limit (429), DEMO_KEY is op', ms };
    if (!res.ok) return { ...check, status: 'fail', detail: `HTTP ${res.status}`, ms };
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json')) return { ...check, status: 'fail', detail: `Geen JSON (${type || 'onbekend'})`, ms };
    const data = await res.json();
    if (!check.ok(data)) return { ...check, status: 'fail', detail: 'Antwoord heeft een onverwachte vorm', ms };
    return { ...check, status: 'ok', detail: 'In orde', ms };
  } catch (err) {
    return { ...check, status: 'fail', detail: err.name === 'TimeoutError' ? 'Time-out na 20 s' : err.message, ms: Date.now() - started };
  }
}

const results = await Promise.all(checks.map(run));
const icon = { ok: '✅', warn: '⚠️', fail: '❌' };
const failed = results.filter((r) => r.status === 'fail');

const report = [
  `## 🛰️ Ruimtewacht rapport (${iso(today)})`,
  '',
  failed.length
    ? `**${failed.length} van de ${results.length} NASA-bronnen werken niet.** Een deel van de quiz toont dan foutmeldingen.`
    : `Alle ${results.length} NASA-bronnen van de quiz werken.`,
  '',
  '| Bron | Status | Detail | Tijd |',
  '| --- | --- | --- | --- |',
  ...results.map((r) => `| ${r.name} | ${icon[r.status]} | ${r.detail} | ${r.ms} ms |`),
  '',
].join('\n');

console.log(report);
writeFileSync('ruimtewacht-report.md', report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed.length > 0}\n`);
