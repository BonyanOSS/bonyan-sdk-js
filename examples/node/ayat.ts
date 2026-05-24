import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const allSurahs = await bonyan.ayat.list();
console.log('Surahs with ayat:', allSurahs.length);

const aya = await bonyan.ayat.getById(5);
console.log('Aya by global id:', aya);

const surahAya = await bonyan.ayat.getBySurah(1, 2);
console.log('Aya by surah:', surahAya);

const search = await bonyan.ayat.search('الله', { limit: 5 });
console.log('Search:', search.total, search.results.slice(0, 5));
