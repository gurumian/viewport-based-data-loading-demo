const fs = require('fs');
const path = require('path');


export function genMockBooks() {
    const mockBooks = [];
    for (let i = 1; i <= 100; i++) {
      const book = {
        id: i,
        title: `Book Title ${i}`,
        author: `Author ${Math.floor(Math.random() * 50) + 1}`,
        genre: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Biography'][Math.floor(Math.random() * 6)],
        published_year: Math.floor(Math.random() * (2023 - 1900 + 1)) + 1900
      };
      mockBooks.push(book);
    }
    
    fs.writeFileSync(path.join(__dirname, 'mock_books.json'), JSON.stringify(mockBooks, null, 2));    
}


