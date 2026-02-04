/**
 * Extracts data for a single district (district_id) from the full prayer-times.2026.json.
 * Usage: node scripts/extract-prayer-times.js <input.json> <district_id> [output.json]
 * Example: node scripts/extract-prayer-times.js ~/Downloads/prayer-times.2026.json 15153
 */

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const districtId = process.argv[3];
const outputPath = process.argv[4] || path.join(__dirname, '../assets/data/prayer-times-2026.json');

if (!inputPath || !districtId) {
  console.error('Usage: node scripts/extract-prayer-times.js <input.json> <district_id> [output.json]');
  process.exit(1);
}

console.log('Reading:', inputPath);
const raw = fs.readFileSync(inputPath, 'utf8');
const json = JSON.parse(raw);

const filtered = (json.data || []).filter((r) => String(r.district_id) === String(districtId));
const out = {
  meta: { ...json.meta, district_id: districtId },
  data: filtered,
};

fs.writeFileSync(outputPath, JSON.stringify(out), 'utf8');
console.log('Written:', outputPath, '-', filtered.length, 'records');
process.exit(0);
