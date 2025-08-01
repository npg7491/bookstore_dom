// index.js

// --- Configuration ---
// API Endpoint for books. This is where we'll make our GET/POST/DELETE requests.
const API_URL = 'https://bookstore-api-six.vercel.app/api/books';
// Key for storing/retrieving book data from localStorage
const LOCAL_STORAGE_KEY = 'cachedBooks';

// --- DOM Element References ---
// Get references to the HTML elements we'll interact with.
const booksContainer = document.getElementById('books-container');
const loadingMessage = document.getElementById('loading-message');

// References to form elements
const bookForm = document.getElementById('book-form');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const yearInput = document.getElementById('year');
const genreInput = document.getElementById('genre');

// References to header elements for interactivity
const mainHeader = document.getElementById('mainHeader'); // The entire header element
const headerTitle = document.getElementById('headerTitle'); // The h1 title inside the header


// --- Helper Function: Create a single book card HTML element ---
// This function takes a book object as input and returns an HTML div element
// representing that book, styled with Tailwind CSS classes.
function createBookCard(book) {
    const bookCard = document.createElement('div');
    // Apply Tailwind CSS classes for styling the card
    bookCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between';
    
    // Store the unique book ID directly on the HTML element.
    // This is crucial for later steps when we implement deleting a book.
    bookCard.dataset.bookId = book.id; // Using dataset is a clean way to store custom data

    // Populate the card's inner HTML using a template literal for readability
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

    return bookCard; // Return the created HTML element
}


// --- Function to Render Books to the DOM ---
// This function takes an array of book objects and renders them into the booksContainer.
function renderBooks(booksToRender) {
    booksContainer.innerHTML = ''; // Clear out any existing content or old book cards
    if (booksToRender.length === 0) {
        // If no books are returned, display a friendly message
        booksContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full">No books found. Add one!</p>';
    } else {
        // Loop through each book object in the array
        booksToRender.forEach(book => {
            // Create an HTML card for the current book
            const bookCard = createBookCard(book);
            // Append the created card to the books container in the HTML
            booksContainer.appendChild(bookCard);
        });
    }
}


// --- Main Function: Fetch and Display Books ---
// This asynchronous function will handle the entire process of fetching books:
// 1. Attempts to load from localStorage first for instant display.
// 2. Always fetches fresh data from the API in the background.
// 3. Compares fresh data with cached data and updates the DOM/localStorage if necessary.
// 4. Handles loading states and potential errors.
async function fetchAndDisplayBooks() {
    // 1. Try to load from localStorage first for immediate display
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
        // If no cache, show loading message while waiting for API
        loadingMessage.classList.remove('hidden');
        booksContainer.innerHTML = ''; // Ensure container is empty before loading
    }

    // 2. Always fetch fresh data from the API in the background
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            // If not successful, throw an error with the status code
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const freshBooks = await response.json();

        // 3. Compare fresh data with cached data and update if different
        // Simple comparison: check length and if any book ID is different.
        // For a more robust comparison, you'd deep compare arrays or use a hash.
        const areBooksDifferent = freshBooks.length !== cachedBooks.length ||
                                  freshBooks.some((book, index) => cachedBooks[index] && book.id !== cachedBooks[index].id);

        if (areBooksDifferent || !cachedBooksJSON) { // If books are different or no cache was loaded initially
            renderBooks(freshBooks); // Re-render with fresh data
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshBooks)); // Update localStorage
            console.log('Books updated from API and localStorage refreshed.');
        } else {
            console.log('Books from API are identical to cached books. No re-render needed.');
        }

        loadingMessage.classList.add('hidden'); // Ensure loading message is hidden after API call completes

    } catch (error) {
        // 4. Handle any errors that occurred during the fetch operation from API
        console.error("Error fetching books from API:", error);
        loadingMessage.classList.add('hidden'); // Hide loading message even on API error

        // If API call fails AND there was no valid cache, display an error message
        if (!cachedBooksJSON || cachedBooks.length === 0) {
            booksContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Failed to load books. Please try again later. (${error.message})</p>`;
        }
        // If API call fails but cached books were displayed, they remain visible.
    }
}


// --- Function: Handle Book Form Submission (POST Request) ---
// This asynchronous function handles the form submission for adding a new book.
async function handleBookFormSubmit(event) {
    event.preventDefault(); // Prevent the default form submission (which would refresh the page)

    // Get values from the input fields, trimming whitespace
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const year = parseInt(yearInput.value, 10); // Convert year to an integer
    const genre = genreInput.value.trim();

    // Basic validation: ensure required fields are not empty or invalid
    if (!title || !author || isNaN(year) || year === null) {
        alert('Please fill in all required fields (Title, Author, and a valid Publication Year).');
        return; // Stop the function if validation fails
    }

    // Create the new book object using ES6 shorthand for properties
    const newBook = {
        title,
        author,
        year,
        genre: genre || 'Unknown' // Use 'Unknown' if genre is left empty
    };

    try {
        // Make the POST request to the API
        const response = await fetch(API_URL, {
            method: 'POST', // Specify the HTTP method
            headers: {
                'Content-Type': 'application/json', // Inform the server we're sending JSON
            },
            body: JSON.stringify(newBook), // Convert the JavaScript object to a JSON string
        });

        if (!response.ok) {
            // If the server response indicates an error
            const errorData = await response.json(); // Try to parse error message from body
            throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || 'Unknown error.'}`);
        }

        const addedBook = await response.json(); // The API usually returns the newly created item
        console.log('Book added successfully:', addedBook);

        // After successfully adding a book, refresh the displayed list
        // This will also update the localStorage cache via fetchAndDisplayBooks
        await fetchAndDisplayBooks();

        // Clear the form fields for the next entry
        bookForm.reset(); // This is a convenient built-in method to clear form inputs

    } catch (error) {
        console.error("Error adding book:", error);
        alert(`Failed to add book: ${error.message}. Please try again.`);
    }
}


// --- Function: Handle Book Deletion (DELETE Request) ---
// This asynchronous function will send a DELETE request to the API
// and then remove the book's card from the DOM if successful.
async function deleteBook(bookId, bookCardElement) {
    try {
        // Construct the DELETE URL with the specific book ID
        const deleteURL = `${API_URL}/${bookId}`;

        const response = await fetch(deleteURL, {
            method: 'DELETE', // Specify the HTTP method as DELETE
            // No headers or body typically needed for a simple DELETE by ID for this API
        });

        if (!response.ok) {
            // If the server response indicates an error
            // The API might return an error message, try to parse it.
            let errorMessage = `HTTP error! Status: ${response.status}.`;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage += ` Message: ${errorData.message}`;
                }
            } catch (parseError) {
                // Ignore if response body isn't JSON, just use generic error
            }
            throw new Error(errorMessage);
        }

        // If deletion was successful, remove the book card from the DOM
        bookCardElement.remove();
        console.log(`Book with ID ${bookId} deleted successfully.`);

        // Update localStorage after deletion to keep cache consistent
        const currentBooksJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (currentBooksJSON) {
            let currentBooks = JSON.parse(currentBooksJSON);
            currentBooks = currentBooks.filter(book => book.id !== bookId); // Remove the deleted book from the array
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentBooks)); // Save updated array to localStorage
            console.log('LocalStorage updated after deletion.');
        }

        // Check if booksContainer is empty after deletion and display "no books" message
        if (booksContainer.children.length === 0) {
            booksContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full">No books found. Add one!</p>';
        }

    } catch (error) {
        console.error(`Error deleting book with ID ${bookId}:`, error);
        alert(`Failed to delete book: ${error.message}. Please try again.`);
    }
}


// --- Event Listeners ---
// Ensures that JavaScript code runs only after the entire HTML document
// (DOM) has been loaded and parsed.
document.addEventListener('DOMContentLoaded', fetchAndDisplayBooks);

// Add event listener for the book submission form
bookForm.addEventListener('submit', handleBookFormSubmit);

// Event listener for delete buttons using Event Delegation
// Instead of adding a listener to each button, we add one to the parent container (booksContainer).
// This is more efficient, especially when books are added/removed dynamically.
booksContainer.addEventListener('click', (event) => {
    // Check if the clicked element (or one of its ancestors) has the 'delete-book-btn' class
    const deleteButton = event.target.closest('.delete-book-btn');

    if (deleteButton) {
        // Find the closest parent element that represents the whole book card
        const bookCard = deleteButton.closest('[data-book-id]');

        if (bookCard) {
            const bookId = bookCard.dataset.bookId;
            // Confirm with the user before deleting to prevent accidental removal
            if (confirm(`Are you sure you want to delete "${bookCard.querySelector('h3').textContent}"?`)) {
                deleteBook(bookId, bookCard); // Call the delete function
            }
        }
    }
});

// New: Event listener for the entire header click (background shift effect)
if (mainHeader) { // Ensure the header element exists before adding listener
    mainHeader.addEventListener('click', () => {
        // Define the original and new gradient classes
        const originalGradientClasses = ['from-blue-700', 'via-indigo-700', 'to-purple-800'];
        const newGradientClasses = ['from-green-600', 'via-teal-600', 'to-cyan-700'];

        // Remove original classes and add new ones for the shift
        mainHeader.classList.remove(...originalGradientClasses);
        mainHeader.classList.add(...newGradientClasses);

        // Revert to original gradient after a short delay (300ms, matching transition duration)
        setTimeout(() => {
            mainHeader.classList.remove(...newGradientClasses);
            mainHeader.classList.add(...originalGradientClasses);
        }, 300);
    });
}