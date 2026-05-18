import BonyanClient from '@bonyanoss/bonyan-api';

const client = new BonyanClient({
  baseUrl: 'https://api.customdomain.com', // your custom domain or host, if any :)
  timeoutMs: 10_000, // optional timeout for requests in milliseconds, default is 10 seconds
  retry: 3, // optional number of retries for failed requests, default is 3
});

const surahs = await client.surah.list();
console.log(`Loaded ${surahs.surah.length} surahs`);

const search = await client.ayat.search('الله', { limit: 10 });
console.log(`Found ${search.total} ayat`);

const times = await client.prayer.getTimes({
  date: '18-05-2026',
  city: 'Baghdad',
  country: 'IQ',
});
console.log(times.timings);