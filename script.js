// Smart Library Assistant - Main Script (User Interface)
class LibrarySystem {
    constructor() {
        this.books = [];
        this.borrowings = [];
        this.currentBook = null;
        this.currentFilter = 'all';
        this.currentGenre = '';
        this.speechSynthesis = window.speechSynthesis;
        this.voiceRecognition = null;
        
        this.init();
    }

    async init() {
        // Load data
        await this.loadBooks();
        this.loadBorrowings();
        
        // Setup UI
        this.setupEventListeners();
        this.updateStats();
        this.displayBooks(this.books);
        this.updateRecommendations();
        
        // Initialize voice recognition if available
        this.initVoiceRecognition();
    }

    async loadBooks() {
        try {
            const response = await fetch('books.json');
            if (response.ok) {
                const data = await response.json();
                this.books = data.map(book => ({
                    ...book,
                    available: Math.random() > 0.3,
                    copies: Math.floor(Math.random() * 5) + 1,
                    addedDate: new Date().toISOString()
                }));
            } else {
                this.books = this.getSampleBooks();
            }
        } catch (error) {
            console.log('Using sample data:', error);
            this.books = this.getSampleBooks();
        }
        
        // Save to localStorage
        localStorage.setItem('library_books', JSON.stringify(this.books));
    }

    loadBorrowings() {
        const saved = localStorage.getItem('library_borrowings');
        if (saved) {
            this.borrowings = JSON.parse(saved);
        } else {
            this.borrowings = this.generateSampleBorrowings();
            this.saveBorrowings();
        }
    }

    saveBorrowings() {
        localStorage.setItem('library_borrowings', JSON.stringify(this.borrowings));
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('clear-search').addEventListener('click', () => this.clearSearch());
        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Filters
        document.getElementById('genre-filter').addEventListener('change', (e) => {
            this.currentGenre = e.target.value;
            this.applyFilters();
        });

        document.getElementById('availability-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFilters();
        });

        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => this.handleVoiceCommand());

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.view-btn').classList.add('active');
                const view = e.target.closest('.view-btn').dataset.view;
                const container = document.getElementById('books-container');
                container.className = view === 'grid' ? 'books-grid' : 'books-list';
            });
        });

        // Genre tabs for recommendations
        document.querySelectorAll('.genre-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
                e.target.closest('.genre-tab').classList.add('active');
                const genre = e.target.closest('.genre-tab').dataset.genre;
                this.updateRecommendations(genre);
            });
        });

        // Refresh recommendations
        document.getElementById('refresh-recommendations').addEventListener('click', () => {
            this.updateRecommendations();
        });

        // Modal controls
        document.querySelectorAll('.close-modal, .close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Borrow form
        document.getElementById('borrow-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.borrowBook();
        });

        // Read aloud
        document.querySelector('.read-aloud-btn').addEventListener('click', () => this.readAloud());

        // Close success modal
        document.querySelector('.close-success').addEventListener('click', () => {
            document.getElementById('success-modal').classList.remove('active');
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    performSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.toLowerCase().trim();
        
        if (!query) {
            this.displayBooks(this.books);
            return;
        }

        const filtered = this.books.filter(book => 
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.genre.toLowerCase().includes(query) ||
            (book.synopsis && book.synopsis.toLowerCase().includes(query))
        );

        this.displayBooks(filtered);
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.currentGenre = '';
        this.currentFilter = 'all';
        document.getElementById('genre-filter').value = '';
        document.getElementById('availability-filter').value = 'all';
        this.displayBooks(this.books);
    }

    applyFilters() {
        let filtered = [...this.books];

        if (this.currentGenre) {
            filtered = filtered.filter(book => book.genre === this.currentGenre);
        }

        if (this.currentFilter === 'available') {
            filtered = filtered.filter(book => book.available);
        } else if (this.currentFilter === 'borrowed') {
            filtered = filtered.filter(book => !book.available);
        }

        this.displayBooks(filtered);
    }

    displayBooks(books) {
        const container = document.getElementById('books-container');
        const noBooks = document.getElementById('no-books');
        
        if (books.length === 0) {
            container.innerHTML = '';
            noBooks.style.display = 'block';
            document.getElementById('results-count').textContent = '0 books found';
            return;
        }

        noBooks.style.display = 'none';
        container.innerHTML = '';

        books.forEach(book => {
            const bookCard = this.createBookCard(book);
            container.appendChild(bookCard);
        });

        document.getElementById('results-count').textContent = 
            `${books.length} book${books.length !== 1 ? 's' : ''} found`;
    }

    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.id = book.id;

        const status = book.available ? 'Available' : 'Borrowed';
        const statusClass = book.available ? 'available' : 'borrowed';

        card.innerHTML = `
            <div class="book-image">
                <i class="fas fa-book"></i>
                <span class="book-status ${statusClass}">${status}</span>
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">
                    <i class="fas fa-user-edit"></i>
                    ${book.author}
                </p>
                <p class="book-synopsis">${book.synopsis.substring(0, 120)}...</p>
                <div class="book-meta">
                    <span class="book-genre">${book.genre}</span>
                    <div class="book-actions">
                        <button class="book-action-btn view-btn" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="book-action-btn borrow-btn" title="Borrow Book" 
                                ${!book.available ? 'disabled' : ''}>
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        card.querySelector('.view-btn').addEventListener('click', () => this.showBookDetails(book));
        if (book.available) {
            card.querySelector('.borrow-btn').addEventListener('click', () => this.showBookDetails(book));
        }

        return card;
    }

    showBookDetails(book) {
        this.currentBook = book;
        
        // Update modal content
        document.getElementById('modal-title').textContent = book.title;
        document.getElementById('modal-author').textContent = `by ${book.author}`;
        document.getElementById('modal-genre').textContent = book.genre;
        document.getElementById('modal-status').textContent = book.available ? 'Available' : 'Borrowed';
        document.getElementById('modal-status').className = `book-status ${book.available ? 'available' : 'borrowed'}`;
        document.getElementById('modal-synopsis').textContent = book.synopsis;

        // Calculate dates
        const today = new Date();
        const returnDate = new Date(today);
        returnDate.setDate(today.getDate() + 14);

        document.getElementById('borrow-date').textContent = this.formatDate(today);
        document.getElementById('return-date').textContent = this.formatDate(returnDate);

        // Show/hide borrow section
        const borrowSection = document.querySelector('.borrow-section');
        borrowSection.style.display = book.available ? 'block' : 'none';

        // Show modal
        document.getElementById('book-modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('book-modal').classList.remove('active');
        document.getElementById('borrow-form').reset();
    }

    borrowBook() {
        const name = document.getElementById('borrower-name').value.trim();
        const email = document.getElementById('borrower-email').value.trim();

        if (!name || !email) {
            this.showNotification('Please enter your name and email', 'error');
            return;
        }

        if (!this.currentBook) return;

        // Create borrowing record
        const borrowing = {
            id: Date.now(),
            bookId: this.currentBook.id,
            bookTitle: this.currentBook.title,
            borrowerName: name,
            borrowerEmail: email,
            borrowDate: new Date().toISOString(),
            returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };

        // Update book availability
        const bookIndex = this.books.findIndex(b => b.id === this.currentBook.id);
        if (bookIndex !== -1) {
            this.books[bookIndex].available = false;
            this.books[bookIndex].copies = Math.max(0, this.books[bookIndex].copies - 1);
            localStorage.setItem('library_books', JSON.stringify(this.books));
        }

        // Add to borrowings
        this.borrowings.push(borrowing);
        this.saveBorrowings();

        // Update UI
        this.updateStats();
        this.displayBooks(this.books);
        this.closeModal();

        // Show success message
        this.showNotification(`Successfully borrowed "${this.currentBook.title}"! Return date: ${this.formatDate(new Date(borrowing.returnDate))}`, 'success');
        
        // Update success modal
        document.getElementById('success-message').textContent = `You have successfully borrowed "${this.currentBook.title}". Please return it by ${this.formatDate(new Date(borrowing.returnDate))}.`;
        document.getElementById('success-modal').classList.add('active');
    }

    readAloud() {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            return;
        }

        const synopsis = document.getElementById('modal-synopsis').textContent;
        const utterance = new SpeechSynthesisUtterance(synopsis);
        
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        const btn = document.querySelector('.read-aloud-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-stop"></i> Stop Reading';

        utterance.onend = () => {
            btn.innerHTML = originalText;
        };

        utterance.onerror = () => {
            btn.innerHTML = originalText;
        };

        this.speechSynthesis.speak(utterance);
    }

    updateStats() {
        const totalBooks = this.books.length;
        const availableBooks = this.books.filter(book => book.available).length;
        const borrowedBooks = totalBooks - availableBooks;

        // Calculate popular genre
        const genreCounts = {};
        this.books.forEach(book => {
            genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        });

        let popularGenre = '-';
        let maxCount = 0;
        for (const [genre, count] of Object.entries(genreCounts)) {
            if (count > maxCount) {
                maxCount = count;
                popularGenre = genre;
            }
        }

        // Update UI
        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('available-books').textContent = availableBooks;
        document.getElementById('borrowed-books').textContent = borrowedBooks;
        document.getElementById('popular-genre').textContent = popularGenre;
    }

    updateRecommendations(genre = 'Fantasy') {
        const recommendations = this.books
            .filter(book => book.genre === genre && book.available)
            .slice(0, 3);

        const container = document.getElementById('recommendations-container');
        container.innerHTML = '';

        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>No ${genre} books available at the moment.</p>
                </div>
            `;
            return;
        }

        recommendations.forEach(book => {
            const card = document.createElement('div');
            card.className = 'rec-card';
            card.innerHTML = `
                <h4>${book.title}</h4>
                <p><i class="fas fa-user-edit"></i> ${book.author}</p>
                <p class="rec-synopsis">${book.synopsis.substring(0, 100)}...</p>
                <div style="margin-top: 15px;">
                    <span class="book-genre">${book.genre}</span>
                </div>
            `;
            card.addEventListener('click', () => this.showBookDetails(book));
            container.appendChild(card);
        });
    }

    // Voice Assistant Functions
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';
        }
    }

    handleVoiceCommand() {
        if (!this.voiceRecognition) {
            this.showNotification('Voice recognition not supported in your browser', 'error');
            return;
        }

        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');

        // Update UI
        voiceBtn.disabled = true;
        statusText.textContent = 'Listening...';
        statusIndicator.className = 'status-indicator listening';
        statusIndicator.style.background = '#f59e0b';

        // Show listening indicator
        this.showVoiceResponse('Listening... Please speak your command.');

        this.voiceRecognition.start();

        this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceCommand(transcript);
        };

        this.voiceRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showVoiceResponse('Sorry, I could not understand. Please try again.');
            this.resetVoiceUI();
        };

        this.voiceRecognition.onend = () => {
            this.resetVoiceUI();
        };
    }

    processVoiceCommand(command) {
        const lowerCommand = command.toLowerCase();
        let response = '';
        let foundBook = null;

        // Show user command
        this.showVoiceResponse(`You said: "${command}"`);

        // Check for specific book titles
        foundBook = this.findBookByVoiceCommand(lowerCommand);
        
        if (foundBook) {
            // If a specific book was mentioned, show it
            this.showBookDetails(foundBook);
            response = `Showing details for "${foundBook.title}"`;
        } 
        // Process other commands
        else if (lowerCommand.includes('find') || lowerCommand.includes('search') || lowerCommand.includes('show')) {
            if (lowerCommand.includes('fantasy')) {
                document.getElementById('genre-filter').value = 'Fantasy';
                this.currentGenre = 'Fantasy';
                this.applyFilters();
                response = 'Showing fantasy books.';
            } else if (lowerCommand.includes('science')) {
                document.getElementById('genre-filter').value = 'Science';
                this.currentGenre = 'Science';
                this.applyFilters();
                response = 'Showing science books.';
            } else if (lowerCommand.includes('mystery')) {
                document.getElementById('genre-filter').value = 'Mystery';
                this.currentGenre = 'Mystery';
                this.applyFilters();
                response = 'Showing mystery books.';
            } else if (lowerCommand.includes('biography')) {
                document.getElementById('genre-filter').value = 'Biography';
                this.currentGenre = 'Biography';
                this.applyFilters();
                response = 'Showing biography books.';
            } else if (lowerCommand.includes('available')) {
                document.getElementById('availability-filter').value = 'available';
                this.currentFilter = 'available';
                this.applyFilters();
                response = 'Showing available books.';
            } else if (lowerCommand.includes('by') && lowerCommand.includes('rowling')) {
                document.getElementById('search-input').value = 'J.K. Rowling';
                this.performSearch();
                response = 'Searching for books by J.K. Rowling.';
            } else if (lowerCommand.includes('by') && lowerCommand.includes('hawking')) {
                document.getElementById('search-input').value = 'Stephen Hawking';
                this.performSearch();
                response = 'Searching for books by Stephen Hawking.';
            } else if (lowerCommand.includes('all')) {
                document.getElementById('search-input').value = '';
                document.getElementById('genre-filter').value = '';
                document.getElementById('availability-filter').value = 'all';
                this.currentGenre = '';
                this.currentFilter = 'all';
                this.applyFilters();
                response = 'Showing all books.';
            } else {
                // Try to search for the mentioned text
                const searchTerm = this.extractSearchTerm(lowerCommand);
                if (searchTerm) {
                    document.getElementById('search-input').value = searchTerm;
                    this.performSearch();
                    response = `Searching for "${searchTerm}"`;
                } else {
                    response = 'What would you like me to search for?';
                }
            }
        } else if (lowerCommand.includes('recommend')) {
            if (lowerCommand.includes('fantasy')) {
                document.querySelector('[data-genre="Fantasy"]').click();
                response = 'Here are some fantasy recommendations.';
            } else if (lowerCommand.includes('science')) {
                document.querySelector('[data-genre="Science"]').click();
                response = 'Here are some science recommendations.';
            } else if (lowerCommand.includes('mystery')) {
                document.querySelector('[data-genre="Mystery"]').click();
                response = 'Here are some mystery recommendations.';
            } else if (lowerCommand.includes('biography')) {
                document.querySelector('[data-genre="Biography"]').click();
                response = 'Here are some biography recommendations.';
            } else {
                response = 'What genre would you like recommendations for?';
            }
        } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('hey')) {
            response = 'Hello! How can I help you find books today?';
        } else if (lowerCommand.includes('help')) {
            response = 'I can help you: 1) Search for books by saying "find [book title]" or "search for [author]" 2) Browse by genre 3) Get recommendations 4) Check book availability. Try saying "find Harry Potter" or "show me fantasy books".';
        } else if (lowerCommand.includes('thank')) {
            response = "You're welcome! Is there anything else I can help you with?";
        } else {
            // Try to find any book mentioned
            const possibleBook = this.findAnyBook(lowerCommand);
            if (possibleBook) {
                this.showBookDetails(possibleBook);
                response = `Found "${possibleBook.title}" by ${possibleBook.author}`;
            } else {
                response = 'Sorry, I did not understand that. Try saying "find books" or "get recommendations".';
            }
        }

        // Show assistant response
        setTimeout(() => {
            this.showVoiceResponse(`Assistant: ${response}`);
        }, 500);
    }

    findBookByVoiceCommand(command) {
        // Common book title variations
        const bookPatterns = [
            { pattern: /harry potter|sorcerer[']?s stone/, bookTitle: "Harry Potter and the Sorcerer's Stone" },
            { pattern: /brief history of time/, bookTitle: "A Brief History of Time" },
            { pattern: /da vinci code/, bookTitle: "The Da Vinci Code" },
            { pattern: /autobiography of malcolm x/, bookTitle: "The Autobiography of Malcolm X" },
            { pattern: /hobbit/, bookTitle: "The Hobbit" },
            { pattern: /cosmos/, bookTitle: "Cosmos" },
            { pattern: /girl with the dragon tattoo/, bookTitle: "The Girl with the Dragon Tattoo" },
            { pattern: /steve jobs/, bookTitle: "Steve Jobs" },
            { pattern: /alchemist/, bookTitle: "The Alchemist" },
            { pattern: /clean code/, bookTitle: "Clean Code" }
        ];

        for (const pattern of bookPatterns) {
            if (pattern.pattern.test(command)) {
                return this.books.find(book => book.title === pattern.bookTitle);
            }
        }
        
        // Try fuzzy matching
        const words = command.split(' ');
        for (const book of this.books) {
            const bookTitleWords = book.title.toLowerCase().split(' ');
            // Check if any significant word from command matches book title
            for (const word of words) {
                if (word.length > 3 && bookTitleWords.some(titleWord => 
                    titleWord.includes(word) || word.includes(titleWord))) {
                    return book;
                }
            }
        }
        
        return null;
    }

    extractSearchTerm(command) {
        // Remove command words
        const cleanCommand = command.replace(/(find|search|show|me|for|books|book)/g, '').trim();
        
        // Check if there's a meaningful search term left
        if (cleanCommand.length > 2 && !['all', 'available', 'borrowed'].includes(cleanCommand)) {
            return cleanCommand;
        }
        
        return null;
    }

    findAnyBook(command) {
        // Try to match any book title in the command
        for (const book of this.books) {
            const bookTitleLower = book.title.toLowerCase();
            const authorLower = book.author.toLowerCase();
            
            // Check if command contains book title or author
            if (command.includes(bookTitleLower) || 
                command.includes(authorLower) ||
                this.fuzzyMatch(command, bookTitleLower) ||
                this.fuzzyMatch(command, authorLower)) {
                return book;
            }
        }
        
        return null;
    }

    fuzzyMatch(text, pattern) {
        // Simple fuzzy matching - check if pattern words are in text
        const patternWords = pattern.split(' ');
        return patternWords.some(word => 
            word.length > 3 && text.includes(word)
        );
    }

    showVoiceResponse(message) {
        const responseArea = document.getElementById('voice-response');
        const bubble = document.createElement('div');
        bubble.className = 'response-bubble assistant';
        bubble.innerHTML = `
            <i class="fas fa-robot"></i>
            <p>${message}</p>
        `;
        responseArea.appendChild(bubble);
        responseArea.scrollTop = responseArea.scrollHeight;
    }

    resetVoiceUI() {
        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');

        voiceBtn.disabled = false;
        statusText.textContent = 'Ready';
        statusIndicator.className = 'status-indicator ready';
        statusIndicator.style.background = '#10b981';
    }

    showNotification(message, type = 'success') {
        // Create a notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getSampleBooks() {
        return [
            {
                id: 1,
                title: "Harry Potter and the Sorcerer's Stone",
                author: "J.K. Rowling",
                genre: "Fantasy",
                synopsis: "A young boy discovers he's a wizard and attends Hogwarts School of Witchcraft and Wizardry, where he makes friends, learns magic, and confronts the dark wizard who killed his parents.",
                available: true,
                copies: 3,
                addedDate: new Date().toISOString()
            },
            {
                id: 2,
                title: "A Brief History of Time",
                author: "Stephen Hawking",
                genre: "Science",
                synopsis: "Stephen Hawking's landmark book explores the nature of the universe, from the Big Bang to black holes, making complex scientific concepts accessible to general readers.",
                available: false,
                copies: 2,
                addedDate: new Date().toISOString()
            },
            {
                id: 3,
                title: "The Da Vinci Code",
                author: "Dan Brown",
                genre: "Mystery",
                synopsis: "A murder in the Louvre Museum leads to a trail of clues found in the works of Leonardo da Vinci, revealing a historical mystery that could shake the foundations of Christianity.",
                available: true,
                copies: 4,
                addedDate: new Date().toISOString()
            },
            {
                id: 4,
                title: "The Autobiography of Malcolm X",
                author: "Malcolm X",
                genre: "Biography",
                synopsis: "The life story of Malcolm X, one of the most influential African American leaders, as told to Alex Haley, covering his transformation from street criminal to prominent Black Muslim leader.",
                available: true,
                copies: 2,
                addedDate: new Date().toISOString()
            },
            {
                id: 5,
                title: "The Hobbit",
                author: "J.R.R. Tolkien",
                genre: "Fantasy",
                synopsis: "Bilbo Baggins, a respectable hobbit, embarks on an unexpected adventure with a group of dwarves to reclaim their mountain home from the dragon Smaug.",
                available: true,
                copies: 3,
                addedDate: new Date().toISOString()
            },
            {
                id: 6,
                title: "Cosmos",
                author: "Carl Sagan",
                genre: "Science",
                synopsis: "Carl Sagan's classic exploration of the universe, connecting scientific concepts with philosophical and historical perspectives on our place in the cosmos.",
                available: false,
                copies: 2,
                addedDate: new Date().toISOString()
            },
            {
                id: 7,
                title: "The Girl with the Dragon Tattoo",
                author: "Stieg Larsson",
                genre: "Mystery",
                synopsis: "A journalist and a hacker investigate the disappearance of a wealthy man's niece, uncovering dark family secrets and corruption in this gripping Swedish thriller.",
                available: true,
                copies: 3,
                addedDate: new Date().toISOString()
            },
            {
                id: 8,
                title: "Steve Jobs",
                author: "Walter Isaacson",
                genre: "Biography",
                synopsis: "Based on interviews with Steve Jobs and those who knew him, this biography tells the story of the Apple co-founder's turbulent life and revolutionary impact on technology.",
                available: true,
                copies: 2,
                addedDate: new Date().toISOString()
            },
            {
                id: 9,
                title: "The Alchemist",
                author: "Paulo Coelho",
                genre: "Fiction",
                synopsis: "A young Andalusian shepherd named Santiago travels from Spain to Egypt in search of a treasure, learning about life and listening to his heart along the way.",
                available: true,
                copies: 4,
                addedDate: new Date().toISOString()
            },
            {
                id: 10,
                title: "Clean Code",
                author: "Robert C. Martin",
                genre: "Technology",
                synopsis: "A practical guide to writing clean, maintainable code, with principles and patterns that help software developers improve their craft and create better software.",
                available: true,
                copies: 3,
                addedDate: new Date().toISOString()
            }
        ];
    }

    generateSampleBorrowings() {
        return [
            {
                id: 1,
                bookId: 2,
                bookTitle: "A Brief History of Time",
                borrowerName: "John Smith",
                borrowerEmail: "john@example.com",
                borrowDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                id: 2,
                bookId: 6,
                bookTitle: "Cosmos",
                borrowerName: "Sarah Johnson",
                borrowerEmail: "sarah@example.com",
                borrowDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                returnDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            }
        ];
    }
}

// Initialize the library system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.librarySystem = new LibrarySystem();
});