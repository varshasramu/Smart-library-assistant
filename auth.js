// Authentication System for Smart Library Assistant
const auth = {
    currentUser: null,
    isLoggedIn: false,
    
    init() {
        // Check if user is logged in from localStorage
        const savedUser = localStorage.getItem('library_admin_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
        }
    },
    
    login(username, password) {
        // Simple authentication - in real app, this would connect to a backend
        const validCredentials = {
            'admin': 'library123',
            'librarian': 'password123',
            'staff': 'staff123'
        };
        
        if (validCredentials[username] === password) {
            this.currentUser = {
                username: username,
                role: username === 'admin' ? 'Administrator' : 'Librarian',
                loginTime: new Date().toISOString()
            };
            
            this.isLoggedIn = true;
            localStorage.setItem('library_admin_user', JSON.stringify(this.currentUser));
            return true;
        }
        
        return false;
    },
    
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('library_admin_user');
    },
    
    isAdmin() {
        return this.isLoggedIn && this.currentUser?.username === 'admin';
    },
    
    getCurrentUser() {
        return this.currentUser;
    }
};

// Initialize auth on load
auth.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = auth;
}