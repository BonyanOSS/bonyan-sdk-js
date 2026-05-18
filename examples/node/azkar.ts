import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const categories = await bonyan.azkar.categories();
console.log('Categories:', categories.categories.slice(0, 5));

const firstCategory = categories.categories[0]?.apiName;
if (firstCategory) {
  const azkar = await bonyan.azkar.getByCategory(firstCategory);
  console.log('First category:', azkar.category, azkar.items.slice(0, 3));
}

const search = await bonyan.azkar.search('الله', { limit: 5 });
console.log('Search results:', search.total, search.data.slice(0, 5));

const random = await bonyan.azkar.random();
console.log('Random item:', random);
