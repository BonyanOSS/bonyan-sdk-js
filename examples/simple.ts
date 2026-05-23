import { BonyanClient } from '@bonyanoss/bonyan-api';

const client = new BonyanClient({
  // baseUrl: 'https://api.customdomain.com', // override only if you self-host
  timeoutMs: 10_000,
  retry: 3,
});

const surahs = await client.surah.list();
console.log(`Loaded ${surahs.length} surahs`);

const search = await client.ayat.search('الله', { limit: 10 });
console.log(`Found ${search.total} matches`);

const times = await client.prayer.getTimes({
  date: '18-05-2026',
  city: 'Baghdad',
  country: 'IQ',
});
console.log(times.timings);
