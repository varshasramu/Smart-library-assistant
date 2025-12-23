// Smart Library Assistant - Admin Script (Fixed with Login)
class AdminSystem {
    constructor() {
        this.books = [];
        this.borrowings = [];
        this.currentBook = null;
        this.currentBorrowing = null;
        this.currentSection = 'dashboard';
        
        this.init();
    }

    async init() {
        // Load data first
        await this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show default section
        this.showSection('dashboard');
        
        // Initialize all components
        this.updateStats();
        this.loadBooksTable();
        this.loadBorrowingsTable();
        this.updateLastUpdated();
        this.updateGenreStats();
        this.updateMonthlyStats();
        this.updateTopBooks(); // This will work now because it's defined below
    }

    async loadData() {
        try {
            // Load books
            const booksResponse = await fetch('books.json');
            if (booksResponse.ok) {
                const booksData = await booksResponse.json();
                const savedBooks = localStorage.getItem('library_books');
                
                if (savedBooks) {
                    // Merge loaded books with saved books
                    const savedBooksData = JSON.parse(savedBooks);
                    this.books = [...savedBooksData];
                } else {
                    // Initialize with default data
                    this.books = booksData.map(book => ({
                        ...book,
                        id: book.id || Date.now() + Math.random(),
                        available: true,
                        copies: Math.floor(Math.random() * 5) + 1,
                        addedDate: new Date().toISOString()
                    }));
                    this.saveBooks();
                }
            }
        } catch (error) {
            console.error('Error loading books:', error);
            // Load from localStorage as fallback
            const savedBooks = localStorage.getItem('library_books');
            if (savedBooks) {
                this.books = JSON.parse(savedBooks);
            } else {
                this.books = this.getSampleBooks();
                this.saveBooks();
            }
        }

        // Load borrowings
        const savedBorrowings = localStorage.getItem('library_borrowings');
        if (savedBorrowings) {
            this.borrowings = JSON.parse(savedBorrowings);
        } else {
            this.borrowings = this.generateSampleBorrowings();
            this.saveBorrowings();
        }
    }

    saveBooks() {
        localStorage.setItem('library_books', JSON.stringify(this.books));
    }

    saveBorrowings() {
        localStorage.setItem('library_borrowings', JSON.stringify(this.borrowings));
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const section = item.dataset.section;
                console.log('Navigation clicked:', section);
                this.showSection(section);
            });
        });

        // Refresh books
        const refreshBtn = document.getElementById('refresh-books');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
                this.loadBooksTable();
                this.updateStats();
                this.updateGenreStats();
                this.updateTopBooks();
                this.showNotification('Data refreshed successfully!', 'success');
            });
        }

        // Add book form
        const addBookForm = document.getElementById('add-book-form');
        if (addBookForm) {
            addBookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBook();
            });
        }

        const clearFormBtn = document.getElementById('clear-form');
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', () => {
                if (addBookForm) addBookForm.reset();
            });
        }

        // Borrowing filter
        const borrowingFilter = document.getElementById('borrowing-filter');
        if (borrowingFilter) {
            borrowingFilter.addEventListener('change', (e) => {
                this.loadBorrowingsTable(e.target.value);
            });
        }

        // View stats button
        const viewStatsBtn = document.getElementById('view-stats');
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => {
                this.showSection('reports');
                this.updateStats();
                this.updateGenreStats();
                this.updateTopBooks();
            });
        }

        // Confirmation modal
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.deleteBookConfirmed();
            });
        }

        const cancelDeleteBtn = document.getElementById('cancel-delete');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                document.getElementById('confirm-modal').classList.remove('active');
            });
        }

        // Return book modal
        const confirmReturnBtn = document.getElementById('confirm-return');
        if (confirmReturnBtn) {
            confirmReturnBtn.addEventListener('click', () => {
                this.returnBookConfirmed();
            });
        }

        // Close modals when clicking X
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
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

    showSection(section) {
        console.log('Showing section:', section);
        
        // Update navigation
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-section="${section}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.currentSection = section;
        }

        // Update last updated time
        this.updateLastUpdated();
    }

    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = timeString;
        }
    }

    updateStats() {
        const totalBooks = this.books.length;
        const borrowedBooks = this.books.filter(book => !book.available).length;
        const overdueBooks = this.borrowings.filter(b => {
            const returnDate = new Date(b.returnDate);
            const today = new Date();
            return b.status === 'active' && returnDate < today;
        }).length;

        // Count unique borrowers
        const uniqueBorrowers = new Set(this.borrowings.map(b => b.borrowerEmail)).size;

        // Update UI elements
        this.updateElementText('admin-total-books', totalBooks);
        this.updateElementText('admin-borrowed-books', borrowedBooks);
        this.updateElementText('admin-overdue-books', overdueBooks);
        this.updateElementText('admin-active-users', uniqueBorrowers);

        // Update navigation badges
        this.updateElementText('books-count', totalBooks);
        this.updateElementText('borrowings-count', this.borrowings.filter(b => b.status === 'active').length);

        // Update activity list
        this.updateActivityList();
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateMonthlyStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Books added this month
        const monthlyAdded = this.books.filter(book => {
            const addedDate = new Date(book.addedDate);
            return addedDate.getMonth() === currentMonth && 
                   addedDate.getFullYear() === currentYear;
        }).length;
        
        // Books borrowed this month
        const monthlyBorrowed = this.borrowings.filter(b => {
            const borrowDate = new Date(b.borrowDate);
            return borrowDate.getMonth() === currentMonth && 
                   borrowDate.getFullYear() === currentYear;
        }).length;
        
        // New users this month (unique borrowers)
        const monthlyUsers = new Set(
            this.borrowings
                .filter(b => {
                    const borrowDate = new Date(b.borrowDate);
                    return borrowDate.getMonth() === currentMonth && 
                           borrowDate.getFullYear() === currentYear;
                })
                .map(b => b.borrowerEmail)
        ).size;
        
        this.updateElementText('monthly-added', monthlyAdded);
        this.updateElementText('monthly-borrowed', monthlyBorrowed);
        this.updateElementText('monthly-users', monthlyUsers);
    }

    updateActivityList() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        // Get recent activities (last 5)
        const recentActivities = [
            ...this.borrowings.slice(-5).reverse().map(b => ({
                type: 'borrowed',
                bookTitle: b.bookTitle,
                borrowerName: b.borrowerName,
                time: b.borrowDate
            })),
            ...this.books.slice(-5).reverse().map(book => ({
                type: 'book_added',
                bookTitle: book.title,
                time: book.addedDate
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        activityList.innerHTML = '';

        if (recentActivities.length === 0) {
            activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        recentActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';

            if (activity.type === 'book_added') {
                item.innerHTML = `
                    <i class="fas fa-book"></i>
                    <div class="activity-info">
                        <p><strong>New book added:</strong> ${activity.bookTitle}</p>
                        <span class="activity-time">${this.formatTime(activity.time)}</span>
                    </div>
                `;
            } else {
                item.innerHTML = `
                    <i class="fas fa-exchange-alt"></i>
                    <div class="activity-info">
                        <p><strong>${activity.borrowerName}</strong> borrowed <strong>${activity.bookTitle}</strong></p>
                        <span class="activity-time">${this.formatTime(activity.time)}</span>
                    </div>
                `;
            }

            activityList.appendChild(item);
        });
    }

    updateGenreStats() {
        const genreStats = document.getElementById('genre-stats');
        if (!genreStats) return;
        
        // Calculate genre distribution
        const genreDistribution = {};
        this.books.forEach(book => {
            genreDistribution[book.genre] = (genreDistribution[book.genre] || 0) + 1;
        });
        
        genreStats.innerHTML = '';
        
        if (Object.keys(genreDistribution).length === 0) {
            genreStats.innerHTML = '<p class="no-data">No genre data available</p>';
            return;
        }
        
        Object.entries(genreDistribution).forEach(([genre, count]) => {
            const statItem = document.createElement('div');
            statItem.className = 'genre-stat-item';
            statItem.innerHTML = `
                <span>${genre}</span>
                <span>${count}</span>
            `;
            genreStats.appendChild(statItem);
        });
    }

    updateTopBooks() {
        const topBooksList = document.getElementById('top-books-list');
        if (!topBooksList) return;
        
        // Calculate book borrowing counts
        const bookBorrowCounts = {};
        this.borrowings.forEach(borrowing => {
            bookBorrowCounts[borrowing.bookTitle] = (bookBorrowCounts[borrowing.bookTitle] || 0) + 1;
        });
        
        // Sort by count (descending)
        const sortedBooks = Object.entries(bookBorrowCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5
        
        topBooksList.innerHTML = '';
        
        if (sortedBooks.length === 0) {
            topBooksList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <p>No borrowing data available yet</p>
                </div>
            `;
            return;
        }
        
        const list = document.createElement('div');
        list.className = 'top-books';
        
        sortedBooks.forEach(([bookTitle, count], index) => {
            const bookItem = document.createElement('div');
            bookItem.className = 'top-book-item';
            bookItem.innerHTML = `
                <div class="book-rank">${index + 1}</div>
                <div class="book-info">
                    <h4>${bookTitle}</h4>
                    <p>Borrowed ${count} time${count !== 1 ? 's' : ''}</p>
                </div>
            `;
            list.appendChild(bookItem);
        });
        
        topBooksList.appendChild(list);
    }

    loadBooksTable() {
        const tbody = document.getElementById('books-table-body');
        if (!tbody) {
            console.error('Books table body not found');
            return;
        }

        tbody.innerHTML = '';

        if (this.books.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-book"></i>
                        <p>No books in the library yet</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.books.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${book.title}</strong></td>
                <td>${book.author}</td>
                <td><span class="genre-tag">${book.genre}</span></td>
                <td>
                    <span class="status-badge ${book.available ? 'status-available' : 'status-borrowed'}">
                        ${book.available ? 'Available' : 'Borrowed'}
                    </span>
                </td>
                <td>${book.copies || 1}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-action-btn delete" data-id="${book.id}" title="Delete Book">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // Add event listener for delete button
            const deleteBtn = row.querySelector('.delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.confirmDelete(book);
                });
            }

            tbody.appendChild(row);
        });
    }

    loadBorrowingsTable(filter = 'all') {
        const tbody = document.getElementById('borrowings-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filteredBorrowings = [...this.borrowings];

        if (filter === 'active') {
            filteredBorrowings = filteredBorrowings.filter(b => b.status === 'active');
        } else if (filter === 'overdue') {
            filteredBorrowings = filteredBorrowings.filter(b => {
                const returnDate = new Date(b.returnDate);
                const today = new Date();
                return b.status === 'active' && returnDate < today;
            });
        } else if (filter === 'returned') {
            filteredBorrowings = filteredBorrowings.filter(b => b.status === 'returned');
        }

        if (filteredBorrowings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-exchange-alt"></i>
                        <p>No borrowings found</p>
                    </td>
                </tr>
            `;
            return;
        }

        filteredBorrowings.forEach(borrowing => {
            const row = document.createElement('tr');
            const isOverdue = new Date(borrowing.returnDate) < new Date() && borrowing.status === 'active';
            
            row.innerHTML = `
                <td><strong>${borrowing.bookTitle}</strong></td>
                <td>
                    <div class="borrower-info">
                        <strong>${borrowing.borrowerName}</strong><br>
                        <small>${borrowing.borrowerEmail}</small>
                    </div>
                </td>
                <td>${this.formatDate(borrowing.borrowDate)}</td>
                <td>${this.formatDate(borrowing.returnDate)}</td>
                <td>
                    <span class="status-badge ${isOverdue ? 'status-overdue' : 
                        borrowing.status === 'active' ? 'status-borrowed' : 'status-available'}">
                        ${isOverdue ? 'Overdue' : 
                         borrowing.status === 'active' ? 'Active' : 'Returned'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        ${borrowing.status === 'active' ? `
                            <button class="table-action-btn return" data-id="${borrowing.id}" title="Mark as Returned">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;

            // Add event listener for return button
            if (borrowing.status === 'active') {
                const returnBtn = row.querySelector('.return');
                if (returnBtn) {
                    returnBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.returnBook(borrowing);
                    });
                }
            }

            tbody.appendChild(row);
        });
    }

    addBook() {
        const title = document.getElementById('new-book-title').value.trim();
        const author = document.getElementById('new-book-author').value.trim();
        const genre = document.getElementById('new-book-genre').value;
        const copies = parseInt(document.getElementById('new-book-copies').value) || 1;
        const synopsis = document.getElementById('new-book-synopsis').value.trim();

        // Validation
        if (!title || !author || !genre || !synopsis) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (copies < 1) {
            this.showNotification('Number of copies must be at least 1', 'error');
            return;
        }

        // Create new book
        const newBook = {
            id: Date.now(),
            title,
            author,
            genre,
            copies,
            synopsis,
            available: true,
            addedDate: new Date().toISOString()
        };

        // Add to books array
        this.books.push(newBook);
        this.saveBooks();
        
        // Update UI
        this.loadBooksTable();
        this.updateStats();
        this.updateGenreStats();
        this.updateTopBooks();
        
        // Clear form and show success
        const addBookForm = document.getElementById('add-book-form');
        if (addBookForm) addBookForm.reset();
        
        this.showNotification(`Book "${title}" added successfully!`, 'success');
        
        // Switch to books section
        setTimeout(() => {
            this.showSection('books');
        }, 1000);
    }

    confirmDelete(book) {
        this.currentBook = book;
        const modal = document.getElementById('confirm-modal');
        const message = document.getElementById('confirm-message');
        
        if (modal && message) {
            message.textContent = `Are you sure you want to delete "${book.title}" by ${book.author}? This action cannot be undone.`;
            modal.classList.add('active');
        }
    }

    deleteBookConfirmed() {
        if (!this.currentBook) return;

        const bookId = this.currentBook.id;
        
        // Remove book from array
        this.books = this.books.filter(book => book.id !== bookId);
        
        // Remove related borrowings
        this.borrowings = this.borrowings.filter(b => b.bookId !== bookId);
        
        // Save changes
        this.saveBooks();
        this.saveBorrowings();
        
        // Update UI
        this.loadBooksTable();
        this.loadBorrowingsTable();
        this.updateStats();
        this.updateGenreStats();
        this.updateTopBooks();

        // Close modal
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.classList.remove('active');
        
        // Show success message
        this.showNotification('Book deleted successfully!', 'success');
        this.currentBook = null;
    }

    returnBook(borrowing) {
        this.currentBorrowing = borrowing;
        const modal = document.getElementById('return-modal');
        const info = document.getElementById('return-book-info');
        
        if (modal && info) {
            info.textContent = `Mark "${borrowing.bookTitle}" as returned? This will make the book available for borrowing again.`;
            modal.classList.add('active');
        }
    }

    returnBookConfirmed() {
        if (!this.currentBorrowing) return;

        const borrowingIndex = this.borrowings.findIndex(b => b.id === this.currentBorrowing.id);
        if (borrowingIndex !== -1) {
            // Update borrowing status
            this.borrowings[borrowingIndex].status = 'returned';
            
            // Update book availability
            const bookIndex = this.books.findIndex(b => b.id === this.currentBorrowing.bookId);
            if (bookIndex !== -1) {
                this.books[bookIndex].available = true;
                this.books[bookIndex].copies = (this.books[bookIndex].copies || 1) + 1;
            }
            
            // Save changes
            this.saveBooks();
            this.saveBorrowings();
            
            // Update UI
            this.loadBooksTable();
            this.loadBorrowingsTable();
            this.updateStats();
            this.updateGenreStats();
            this.updateTopBooks();
        }

        // Close modal
        const modal = document.getElementById('return-modal');
        if (modal) modal.classList.remove('active');
        
        // Show success message
        this.showNotification('Book marked as returned!', 'success');
        this.currentBorrowing = null;
    }

    showNotification(message, type = 'success') {
        // Create notification element
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

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    formatTime(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) {
                return 'Just now';
            } else if (diffMins < 60) {
                return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 7) {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else {
                return this.formatDate(dateString);
            }
        } catch (error) {
            return 'Recently';
        }
    }

    getSampleBooks() {
        return [
            {
                id: 1,
                title: "Harry Potter and the Sorcerer's Stone",
                author: "J.K. Rowling",
                genre: "Fantasy",
                synopsis: "A young boy discovers he's a wizard and attends Hogwarts School.",
                available: true,
                copies: 3,
                addedDate: new Date().toISOString()
            },
            {
                id: 2,
                title: "A Brief History of Time",
                author: "Stephen Hawking",
                genre: "Science",
                synopsis: "Exploration of the universe from the Big Bang to black holes.",
                available: false,
                copies: 2,
                addedDate: new Date().toISOString()
            },
            {
                id: 3,
                title: "The Da Vinci Code",
                author: "Dan Brown",
                genre: "Mystery",
                synopsis: "A murder in the Louvre Museum leads to a trail of clues.",
                available: true,
                copies: 4,
                addedDate: new Date().toISOString()
            },
            {
                id: 4,
                title: "The Autobiography of Malcolm X",
                author: "Malcolm X",
                genre: "Biography",
                synopsis: "The life story of Malcolm X, from street criminal to prominent leader.",
                available: true,
                copies: 2,
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
                bookId: 3,
                bookTitle: "The Da Vinci Code",
                borrowerName: "Sarah Johnson",
                borrowerEmail: "sarah@example.com",
                borrowDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                returnDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            }
        ];
    }
}