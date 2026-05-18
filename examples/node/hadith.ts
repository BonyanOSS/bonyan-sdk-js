import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const books = await bonyan.hadith.listBooks();
console.log('Books:', books.slice(0, 5));

const bookId = books[0]?.id ?? 'bukhari';
const book = await bonyan.hadith.getBook(bookId, { from: 1, to: 3 });
console.log('Book sample:', book);

const hadith = await bonyan.hadith.getByNumber(bookId, 1);
console.log('Hadith by number:', hadith);

const random = await bonyan.hadith.random({ book: bookId });
console.log('Random hadith:', random);
