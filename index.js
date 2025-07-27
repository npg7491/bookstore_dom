// index.js

// API Endpoint for books
const API_URL = 'https://bookstore-api-six.vercel.app/api/books';

// Get references to DOM elements
const booksContainer = document.getElementById('books-container');
const loadingMessage = document.getElementById('loading-message');

// Function to create a single book card HTML
function createBookCard(book) {
    // Use Tailwind CSS classes for styling
    const bookCard = document.createElement('div');
    bookCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between';
    // Store the book ID on the element for future DELETE operations
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

    // We'll add the event listener for the delete button later in a separate step
    // For now, just create the button element.

    return bookCard;
}

// Function to fetch and display books
async function fetchAndDisplayBooks() {
    // Show loading message
    loadingMessage.classList.remove('hidden'); // Ensure it's visible
    booksContainer.innerHTML = ''; // Clear previous books

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            // Handle HTTP errors (e.g., 404, 500)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const books = await response.json();

        // Hide loading message
        loadingMessage.classList.add('hidden');

        if (books.length === 0) {
            booksContainer.innerHTML = '<p class="text-gray-600 text-center col-span-full">No books found. Add one!</p>';
        } else {
            books.forEach(book => {
                const bookCard = createBookCard(book);
                booksContainer.appendChild(bookCard);
            });
        }

    } catch (error) {
        console.error("Error fetching books:", error);
        loadingMessage.classList.add('hidden'); // Hide loading even on error
        booksContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Failed to load books. Please try again later. (${error.message})</p>`;
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayBooks);

// --- Placeholder for other functions (e.g., add book, delete book) ---
// You'll add these here in future steps.