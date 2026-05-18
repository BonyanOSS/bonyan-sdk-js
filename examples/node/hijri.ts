import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const today = await bonyan.hijri.today();
console.log('Today:', today);

const hijri = await bonyan.hijri.fromGregorian('18-05-2026');
console.log('Gregorian to Hijri:', hijri);

const gregorian = await bonyan.hijri.toGregorian('01-12-1447');
console.log('Hijri to Gregorian:', gregorian);
