import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const { reciters } = await bonyan.reciters.list();
console.log(reciters.slice(0, 5));

const audio = await bonyan.reciters.getSurah(1, 1);
console.log(audio);
