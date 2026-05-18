import { bonyan, printTitle } from './_client.js';

printTitle('Surah');

const surahs = await bonyan.surah.list();
console.log('Surahs:', surahs.surah.length);

const alFatiha = await bonyan.surah.getById(1);
console.log('Al-Fatiha:', alFatiha);

const search = await bonyan.surah.search('الفاتحة');
console.log('Search results:', search);
