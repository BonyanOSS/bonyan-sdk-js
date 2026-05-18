import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const allAyat = await bonyan.ayat.list();
console.log('Surahs with ayat:', allAyat.surahs.length);

const aya = await bonyan.ayat.getById(5);
console.log('Aya by global id:', aya);

const surahAya = await bonyan.ayat.getBySurah(1, 2);
console.log('Aya by surah:', surahAya);

const search = await bonyan.ayat.search('الله', { limit: 5 });
console.log('Search results:', search.total, search.data.slice(0, 5));
