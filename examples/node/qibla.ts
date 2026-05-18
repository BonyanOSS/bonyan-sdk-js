import { bonyan, printTitle } from './_client.js';

printTitle('Qibla');

const direction = await bonyan.qibla.getDirection(30.0444, 31.2357);
console.log('Direction:', direction);
