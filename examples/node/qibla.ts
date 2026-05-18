import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const direction = await bonyan.qibla.getDirection(30.0444, 31.2357);
console.log('Direction:', direction);
