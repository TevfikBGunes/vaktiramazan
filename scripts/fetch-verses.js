/**
 * Fetches Quran verses (Arabic + Turkish Diyanet translation) from alquran.cloud
 * and generates assets/data/verses.json for bundling.
 *
 * Usage: node scripts/fetch-verses.js
 *
 * Output: assets/data/verses.json — flat Verse[] array (~6236 entries).
 * This script is NOT part of the app bundle; it runs once during development.
 */

const fs = require('fs');
const path = require('path');

const ARABIC_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const TURKISH_URL = 'https://api.alquran.cloud/v1/quran/tr.diyanet';
const OUTPUT = path.join(__dirname, '../assets/data/verses.json');

/** Turkish surah names (Diyanet transliteration, 1-indexed by array position). */
const SURAH_NAMES_TR = [
  'Fâtiha',
  'Bakara',
  'Âl-i İmrân',
  'Nisâ',
  'Mâide',
  "En'âm",
  "A'râf",
  'Enfâl',
  'Tevbe',
  'Yûnus',
  'Hûd',
  'Yûsuf',
  "Ra'd",
  'İbrâhîm',
  'Hicr',
  'Nahl',
  'İsrâ',
  'Kehf',
  'Meryem',
  'Tâhâ',
  'Enbiyâ',
  'Hac',
  "Mü'minûn",
  'Nûr',
  'Furkân',
  'Şuarâ',
  'Neml',
  'Kasas',
  'Ankebût',
  'Rûm',
  'Lokmân',
  'Secde',
  'Ahzâb',
  "Sebe'",
  'Fâtır',
  'Yâsîn',
  'Sâffât',
  'Sâd',
  'Zümer',
  "Mü'min",
  'Fussilet',
  'Şûrâ',
  'Zuhruf',
  'Duhân',
  'Câsiye',
  'Ahkâf',
  'Muhammed',
  'Fetih',
  'Hucurât',
  'Kâf',
  'Zâriyât',
  'Tûr',
  'Necm',
  'Kamer',
  'Rahmân',
  "Vâkı'a",
  'Hadîd',
  'Mücâdele',
  'Haşr',
  'Mümtehine',
  'Saf',
  "Cum'a",
  'Münâfikûn',
  'Teğâbün',
  'Talâk',
  'Tahrîm',
  'Mülk',
  'Kalem',
  'Hâkka',
  'Meâric',
  'Nûh',
  'Cin',
  'Müzzemmil',
  'Müddessir',
  'Kıyâmet',
  'İnsan',
  'Mürselât',
  "Nebe'",
  'Nâziât',
  'Abese',
  'Tekvîr',
  'İnfitâr',
  'Mutaffifîn',
  'İnşikâk',
  'Bürûc',
  'Târık',
  "A'lâ",
  'Gâşiye',
  'Fecr',
  'Beled',
  'Şems',
  'Leyl',
  'Duhâ',
  'İnşirâh',
  'Tîn',
  'Alak',
  'Kadr',
  'Beyyine',
  'Zilzâl',
  'Âdiyât',
  "Kâri'a",
  'Tekâsür',
  'Asr',
  'Hümeze',
  'Fîl',
  'Kureyş',
  'Mâûn',
  'Kevser',
  'Kâfirûn',
  'Nasr',
  'Tebbet',
  'İhlâs',
  'Felak',
  'Nâs',
];

async function fetchJSON(url) {
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(`API error: ${json.status}`);
  return json;
}

async function main() {
  console.log('=== Quran Verse Fetcher ===\n');

  // 1. Fetch both editions in parallel
  console.log('1/3  Downloading Arabic & Turkish editions...');
  const [arabicRes, turkishRes] = await Promise.all([
    fetchJSON(ARABIC_URL),
    fetchJSON(TURKISH_URL),
  ]);

  const arabicSurahs = arabicRes.data.surahs;
  const turkishSurahs = turkishRes.data.surahs;

  if (arabicSurahs.length !== 114 || turkishSurahs.length !== 114) {
    throw new Error(
      `Expected 114 surahs, got Arabic=${arabicSurahs.length} Turkish=${turkishSurahs.length}`
    );
  }

  // 2. Merge into Verse[]
  console.log('\n2/3  Merging verses...');
  const verses = [];
  let id = 0;

  for (let s = 0; s < arabicSurahs.length; s++) {
    const arSurah = arabicSurahs[s];
    const trSurah = turkishSurahs[s];

    if (arSurah.ayahs.length !== trSurah.ayahs.length) {
      throw new Error(
        `Surah ${arSurah.number}: ayah count mismatch (ar=${arSurah.ayahs.length}, tr=${trSurah.ayahs.length})`
      );
    }

    for (let a = 0; a < arSurah.ayahs.length; a++) {
      const arAyah = arSurah.ayahs[a];
      const trAyah = trSurah.ayahs[a];

      id++;
      verses.push({
        id,
        surah_number: arSurah.number,
        verse_number: arAyah.numberInSurah,
        text: trAyah.text,
        arabic_text: arAyah.text,
        juz_number: arAyah.juz,
        page_number: arAyah.page,
        surah_name_turkish: SURAH_NAMES_TR[s],
        surah_name_arabic: arSurah.name,
      });
    }

    // Progress per surah group
    if ((s + 1) % 20 === 0 || s === arabicSurahs.length - 1) {
      console.log(`  Processed ${s + 1}/114 surahs (${verses.length} verses so far)`);
    }
  }

  // 3. Write JSON
  console.log('\n3/3  Writing JSON...');
  fs.writeFileSync(OUTPUT, JSON.stringify(verses), 'utf8');

  const sizeMB = (fs.statSync(OUTPUT).size / (1024 * 1024)).toFixed(2);
  console.log(`\nDone! ${verses.length} verses written to ${OUTPUT} (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error('\nError:', err.message || err);
  process.exit(1);
});
