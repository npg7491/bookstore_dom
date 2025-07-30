// index.js

// --- Configuration ---
const API_URL = 'https://bookstore-api-six.vercel.app/api/books';
const LOCAL_STORAGE_KEY = 'cachedBooks'; // Define a key for localStorage

// --- DOM Element References ---
const booksContainer = document.getElementById('books-container');
const loadingMessage = document.getElementById('loading-message');
const bookForm = document.getElementById('book-form');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const yearInput = document.getElementById('year');
const genreInput = document.getElementById('genre');


// --- Helper Function: Create a single book card HTML element ---
function createBookCard(book) {
    const bookCard = document.createElement('div');
    bookCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between';
    bookCard.dataset.bookId = book.id; 

    bookCard.innerHTML = `
        <div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">${book.title}</h3>
            <p class="text-gray-600 text-sm italic mb-2">by ${book.author}</p>
            <p class="text-gray-700 text-sm mb-1"><span class="font-semibold">Year:</span> ${book.year}</p>
            <p class="text-gray-700 text-sm mb-3"><span class="font-semibold">Genre:</span> ${book.genre || 'N/A'}</p>
        </div>
        <div class="text-right mt-4">
            <button class="delete-book-btn bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors duration-200">
                Delete
            </button>
        </div>
    `;
    return bookCard;
}


// --- Function to Render Books to the DOM ---
// Extracted rendering logic into a separate function for reusability
function renderBooks(booksToRender) {
    booksContainer.innerHTML = ''; // Clear existing books
    if (booksToRender.length === 0) {
        booksContainer.innerHTML = '<p class="text-gray-600 text-center col-span-full">No books found. Add one!</p>';
    } else {
        booksToRender.forEach(book => {
            const bookCard = createBookCard(book);
            booksContainer.appendChild(bookCard);
        });
    }
}


// --- Main Function: Fetch and Display Books ---
async function fetchAndDisplayBooks() {
    // 1. Try to load from localStorage first
    const cachedBooksJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    let cachedBooks = [];

    if (cachedBooksJSON) {
        try {
            cachedBooks = JSON.parse(cachedBooksJSON);
            renderBooks(cachedBooks); // Display cached books immediately
            console.log('Books loaded from localStorage.');
            loadingMessage.classList.add('hidden'); // Hide loading message as content is shown
        } catch (e) {
            console.error('Error parsing cached books from localStorage:', e);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted cache
        }
    } else {
        // If no cache, show loading message
        loadingMessage.classList.remove('hidden');
        booksContainer.innerHTML = ''; // Ensure container is empty before loading
    }

    // 2. Always fetch fresh data from the API in the background
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const freshBooks = await response.json();

        // 3. Compare and update if fresh data is different or if no cache was initially loaded
        // Simple comparison: check length and if any book ID is different.
        // For a more robust comparison, you'd deep compare arrays.
        const areBooksDifferent = freshBooks.length !== cachedBooks.length ||
                                  freshBooks.some((book, index) => cachedBooks[index] && book.id !== cachedBooks[index].id);

        if (areBooksDifferent || !cachedBooksJSON) { // If books are different or no cache was loaded
            renderBooks(freshBooks); // Re-render with fresh data
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshBooks)); // Update localStorage
            console.log('Books updated from API and localStorage refreshed.');
        } else {
            console.log('Books from API are identical to cached books. No re-render needed.');
        }

        loadingMessage.classList.add('hidden'); // Ensure loading message is hidden after API call completes

    } catch (error) {
        console.error("Error fetching books from API:", error);
        loadingMessage.classList.add('hidden'); // Hide loading message even on API error

        // If API call fails AND there was no valid cache, show an error message
        if (!cachedBooksJSON || cachedBooks.length === 0) {
            booksContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Failed to load books. Please try again later. (${error.message})</p>`;
        }
        // If API call fails but cached books were displayed, they remain visible.
    }
}


// --- Function: Handle Book Form Submission (POST Request) ---
async function handleBookFormSubmit(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const year = parseInt(yearInput.value, 10);
    const genre = genreInput.value.trim();

    if (!title || !author || isNaN(year) || year === null) {
        alert('Please fill in all required fields (Title, Author, and a valid Publication Year).');
        return;
    }

    const newBook = {
        title,
        author,
        year,
        genre: genre || 'Unknown'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newBook),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || 'Unknown error.'}`);
        }

        const addedBook = await response.json();
        console.log('Book added successfully:', addedBook);

        // After successfully adding a book, refresh the displayed list
        // This will also update the localStorage cache via fetchAndDisplayBooks
        await fetchAndDisplayBooks();

        bookForm.reset();

    } catch (error) {
        console.error("Error adding book:", error);
        alert(`Failed to add book: ${error.message}. Please try again.`);
    }
}


// --- Function: Handle Book Deletion (DELETE Request) ---
async function deleteBook(bookId, bookCardElement) {
    try {
        const deleteURL = `${API_URL}/${bookId}`;

        const response = await fetch(deleteURL, {
            method: 'DELETE',
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}.`;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage += ` Message: ${errorData.message}`;
                }
            } catch (parseError) {
                // Ignore if response body isn't JSON
            }
            throw new Error(errorMessage);
        }

        // If deletion was successful, remove the book card from the DOM
        bookCardElement.remove();
        console.log(`Book with ID ${bookId} deleted successfully.`);

        // Update localStorage after deletion
        const currentBooksJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (currentBooksJSON) {
            let currentBooks = JSON.parse(currentBooksJSON);
            currentBooks = currentBooks.filter(book => book.id !== bookId);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentBooks));
            console.log('LocalStorage updated after deletion.');
        }

        // Check if booksContainer is empty after deletion and display "no books" message
        if (booksContainer.children.length === 0) {
            booksContainer.innerHTML = '<p class="text-gray-600 text-center col-span-full">No books found. Add one!</p>';
        }

    } catch (error) {
        console.error(`Error deleting book with ID ${bookId}:`, error);
        alert(`Failed to delete book: ${error.message}. Please try again.`);
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', fetchAndDisplayBooks);
bookForm.addEventListener('submit', handleBookFormSubmit);

booksContainer.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete-book-btn');

    if (deleteButton) {
        const bookCard = deleteButton.closest('[data-book-id]');

        if (bookCard) {
            const bookId = bookCard.dataset.bookId;
            if (confirm(`Are you sure you want to delete "${bookCard.querySelector('h3').textContent}"?`)) {
                deleteBook(bookId, bookCard);
            }
        }
    }
});