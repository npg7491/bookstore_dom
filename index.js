// index.js

// --- Configuration ---
// API Endpoint for books. This is where we'll make our GET/POST/DELETE requests.
const API_URL = 'https://bookstore-api-six.vercel.app/api/books';

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

    // Note: The delete button is created here, but its functionality
    // (i.e., making a DELETE request) will be added in a future step.

    return bookCard; // Return the created HTML element
}


// --- Main Function: Fetch and Display Books ---
// This asynchronous function will handle the entire process:
// 1. Showing a loading message.
// 2. Making the GET request to the API.
// 3. Parsing the response.
// 4. Hiding the loading message.
// 5. Creating and appending book cards to the DOM.
// 6. Handling potential errors.
async function fetchAndDisplayBooks() {
    // Step 1: Show loading message and clear previous content
    loadingMessage.classList.remove('hidden'); // Make sure the loading message is visible
    booksContainer.innerHTML = ''; // Clear out any existing content or old book cards

    try {
        // Step 2: Make the GET request using fetch()
        const response = await fetch(API_URL);

        // Step 3: Check if the response was successful (status code 200-299)
        if (!response.ok) {
            // If not successful, throw an error with the status code
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Step 4: Parse the JSON response body into a JavaScript array of book objects
        const books = await response.json();

        // Step 5: Hide loading message once data is received
        loadingMessage.classList.add('hidden'); // Hide the loading message

        // Step 6: Display the books or a "no books" message
        if (books.length === 0) {
            // If no books are returned, display a friendly message
            booksContainer.innerHTML = '<p class="text-gray-600 text-center col-span-full">No books found. Add one!</p>';
        } else {
            // Loop through each book object in the array
            books.forEach(book => {
                // Create an HTML card for the current book
                const bookCard = createBookCard(book);
                // Append the created card to the books container in the HTML
                booksContainer.appendChild(bookCard);
            });
        }

    } catch (error) {
        // Step 7: Handle any errors that occurred during the fetch operation
        console.error("Error fetching books:", error);
        loadingMessage.classList.add('hidden'); // Hide loading message even on error
        booksContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Failed to load books. Please try again later. (${error.message})</p>`;
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
        // by re-fetching all books from the API.
        await fetchAndDisplayBooks();

        // Clear the form fields for the next entry
        bookForm.reset(); // This is a convenient built-in method to clear form inputs

    } catch (error) {
        console.error("Error adding book:", error);
        alert(`Failed to add book: ${error.message}. Please try again.`);
    }
}


// --- Event Listeners ---
// Ensures that JavaScript code runs only after the entire HTML document
// (DOM) has been loaded and parsed.
document.addEventListener('DOMContentLoaded', fetchAndDisplayBooks);

// Add event listener for the book submission form
bookForm.addEventListener('submit', handleBookFormSubmit);