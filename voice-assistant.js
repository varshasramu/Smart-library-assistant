// Enhanced Voice Assistant for Smart Library Assistant
class VoiceAssistant {
    constructor() {
        this.commands = {
            'search': ['find', 'search', 'look for', 'where is', 'show me'],
            'recommend': ['recommend', 'suggest', 'what should I read', 'any suggestions', 'give me'],
            'borrow': ['borrow', 'take', 'check out', 'lend me'],
            'help': ['help', 'what can you do', 'how does this work', 'assist me'],
            'status': ['status', 'availability', 'available', 'borrowed'],
            'genre': ['fantasy', 'science', 'mystery', 'biography', 'fiction', 'technology']
        };
        
        this.responses = {
            'greeting': [
                "Hello! I'm your library assistant. How can I help you today?",
                "Hi there! Ready to explore some great books?",
                "Welcome to the Smart Library! What are you looking for?"
            ],
            'search': [
                "I found some books for you.",
                "Here are the books matching your search.",
                "These books might interest you."
            ],
            'recommend': [
                "Based on your interest, I recommend these books.",
                "Here are some great suggestions for you.",
                "You might enjoy these books."
            ],
            'borrow': [
                "The book is now borrowed for you. Enjoy reading!",
                "Successfully borrowed. Don't forget to return in 2 weeks!",
                "Book borrowed. Happy reading!"
            ],
            'help': [
                "I can help you: 1) Search for books by title, author, or genre. 2) Get personalized recommendations. 3) Borrow books. 4) Check book availability. Try saying 'Find fantasy books' or 'Recommend science fiction'.",
                "You can ask me to: Search for specific books, Get recommendations based on genre, Borrow available books, or Check book status. What would you like to do?",
                "I'm here to help you with: Finding books, Getting recommendations, Borrowing books, and Getting book information. Just tell me what you need!"
            ],
            'error': [
                "I'm not sure how to help with that. Try asking about books, recommendations, or borrowing.",
                "Could you rephrase that? I can help you find books, get recommendations, or borrow books.",
                "I didn't understand that. Try saying things like 'Find Harry Potter books' or 'Recommend mystery novels'."
            ]
        };
        
        this.isListening = false;
    }
    
    processInput(text) {
        const input = text.toLowerCase().trim();
        let response = this.getRandomResponse('error');
        
        // Check for greetings
        if (this.isGreeting(input)) {
            return this.getRandomResponse('greeting');
        }
        
        // Check for search commands
        if (this.containsAny(input, this.commands.search)) {
            response = this.processSearchCommand(input);
        }
        
        // Check for recommendation commands
        else if (this.containsAny(input, this.commands.recommend)) {
            response = this.processRecommendationCommand(input);
        }
        
        // Check for borrow commands
        else if (this.containsAny(input, this.commands.borrow)) {
            response = this.processBorrowCommand(input);
        }
        
        // Check for help commands
        else if (this.containsAny(input, this.commands.help)) {
            response = this.getRandomResponse('help');
        }
        
        // Check for status/availability
        else if (this.containsAny(input, this.commands.status)) {
            response = "You can check book availability by searching or viewing book details.";
        }
        
        // Check for direct genre requests
        else if (this.containsAny(input, this.commands.genre)) {
            const genre = this.extractGenre(input);
            if (genre) {
                response = `Showing ${genre} books. You'll find them in the search results.`;
            }
        }
        
        return response;
    }
    
    isGreeting(input) {
        const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
        return greetings.some(greeting => input.includes(greeting));
    }
    
    processSearchCommand(input) {
        const response = this.getRandomResponse('search');
        
        if (input.includes('by') && this.extractAuthor(input)) {
            const author = this.extractAuthor(input);
            return `${response} by ${author}.`;
        } 
        else if (this.extractGenre(input)) {
            const genre = this.extractGenre(input);
            return `${response} in the ${genre} genre.`;
        }
        else if (this.extractBookTitle(input)) {
            const title = this.extractBookTitle(input);
            return `${response} for "${title}".`;
        }
        else if (input.includes('available') || input.includes('in stock')) {
            return "Showing available books. Check the availability filter for more options.";
        }
        else {
            return "What would you like me to search for? You can search by title, author, or genre.";
        }
    }
    
    processRecommendationCommand(input) {
        const response = this.getRandomResponse('recommend');
        
        if (this.extractGenre(input)) {
            const genre = this.extractGenre(input);
            return `${response} in the ${genre} genre.`;
        }
        else if (input.includes('popular') || input.includes('trending')) {
            return `${response} These are currently popular among our readers.`;
        }
        else if (input.includes('new') || input.includes('recent')) {
            return `${response} These are our newest additions to the library.`;
        }
        else {
            return "I'd be happy to recommend books. What genre are you interested in? You can say fantasy, mystery, science, or biography.";
        }
    }
    
    processBorrowCommand(input) {
        if (this.extractBookTitle(input)) {
            const title = this.extractBookTitle(input);
            return `To borrow "${title}", please view the book details and fill in the borrow form.`;
        }
        else {
            return this.getRandomResponse('borrow');
        }
    }
    
    containsAny(input, phrases) {
        return phrases.some(phrase => input.includes(phrase.toLowerCase()));
    }
    
    extractGenre(input) {
        const genres = {
            'fantasy': 'fantasy',
            'science': 'science',
            'sci-fi': 'science',
            'science fiction': 'science',
            'mystery': 'mystery',
            'biography': 'biography',
            'fiction': 'fiction',
            'technology': 'technology',
            'tech': 'technology',
            'history': 'history',
            'romance': 'romance'
        };
        
        for (const [keyword, genre] of Object.entries(genres)) {
            if (input.includes(keyword)) {
                return genre.charAt(0).toUpperCase() + genre.slice(1);
            }
        }
        
        return null;
    }
    
    extractAuthor(input) {
        const authors = {
            'rowling': 'J.K. Rowling',
            'hawking': 'Stephen Hawking',
            'brown': 'Dan Brown',
            'tolkien': 'J.R.R. Tolkien',
            'sagan': 'Carl Sagan',
            'larsson': 'Stieg Larsson',
            'jobs': 'Steve Jobs',
            'coelho': 'Paulo Coelho',
            'martin': 'Robert C. Martin'
        };
        
        for (const [keyword, author] of Object.entries(authors)) {
            if (input.includes(keyword)) {
                return author;
            }
        }
        
        // Try to extract author name after "by"
        const byIndex = input.indexOf('by ');
        if (byIndex !== -1) {
            const possibleAuthor = input.substring(byIndex + 3).split(' ')[0];
            if (possibleAuthor && possibleAuthor.length > 2) {
                return possibleAuthor.charAt(0).toUpperCase() + possibleAuthor.slice(1);
            }
        }
        
        return null;
    }
    
    extractBookTitle(input) {
        // Common book titles
        const titles = {
            'harry potter': "Harry Potter",
            'brief history': "A Brief History of Time",
            'da vinci code': "The Da Vinci Code",
            'hobbit': "The Hobbit",
            'cosmos': "Cosmos",
            'alchemist': "The Alchemist",
            'clean code': "Clean Code",
            'girl with the dragon tattoo': "The Girl with the Dragon Tattoo"
        };
        
        for (const [keyword, title] of Object.entries(titles)) {
            if (input.includes(keyword)) {
                return title;
            }
        }
        
        return null;
    }
    
    getRandomResponse(type) {
        const responses = this.responses[type];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Voice simulation for demonstration
    simulateVoiceResponse(command) {
        return this.processInput(command);
    }
}

// Initialize voice assistant
const voiceAssistant = new VoiceAssistant();