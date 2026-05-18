import { bonyan, printTitle } from './_client.js';

printTitle('Tafsir');

const editions = await bonyan.tafsir.listEditions();
console.log('Editions:', editions.slice(0, 5));

const edition = editions[0]?.id ?? 'ar';
const surahTafsir = await bonyan.tafsir.forSurah(edition, 1);
console.log('Surah tafsir:', Array.isArray(surahTafsir) ? surahTafsir.slice(0, 3) : surahTafsir);

const ayaTafsir = await bonyan.tafsir.forAya(edition, 1, 1);
console.log('Aya tafsir:', ayaTafsir);