import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const byCity = await bonyan.prayer.getTimes({
  date: '18-05-2026',
  city: 'Cairo',
  country: 'EG',
});
console.log('By city:', byCity);

const byCoordinates = await bonyan.prayer.getTimes({
  date: '18-05-2026',
  latitude: 30.0444,
  longitude: 31.2357,
});
console.log('By coordinates:', byCoordinates);
