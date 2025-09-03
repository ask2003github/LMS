import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, runTransaction, query, where, onSnapshot, setLogLevel } from 'firebase/firestore';

// --- STYLES ---
// Using a style tag for self-contained component styling.
const AppStyles = () => (
    <style>{`
        :root {
            --primary-color: #4f46e5; /* indigo-600 */
            --primary-hover: #4338ca; /* indigo-700 */
            --danger-color: #dc2626; /* red-600 */
            --danger-hover: #b91c1c; /* red-700 */
        }
        .form-input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            transition: box-shadow 0.2s;
        }
        .form-input:focus {
            outline: none;
            box-shadow: 0 0 0 2px var(--primary-color);
            border-color: var(--primary-color);
        }
        .form-radio {
             accent-color: var(--primary-color);
        }
        .button-primary {
            background-color: var(--primary-color);
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
        }
        .button-primary:hover {
            background-color: var(--primary-hover);
        }
        .button-secondary {
            background-color: #e5e7eb; /* gray-200 */
            color: #374151; /* gray-700 */
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
        }
        .button-secondary:hover {
            background-color: #d1d5db; /* gray-300 */
        }
        .button-danger {
            background-color: var(--danger-color);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
        }
        .button-danger:hover {
            background-color: var(--danger-hover);
        }
        .table-header {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.875rem;
            font-weight: 600;
            color: #4b5563; /* gray-600 */
            text-transform: uppercase;
        }
        .table-cell {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: #374151; /* gray-700 */
        }
    `}</style>
);


// --- ICONS ---
const BookIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-5.25-8.494H17.25M4.5 6.253h15M4.5 17.747h15M6 12h12" /></svg>);
const UserGroupIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-2.277M12 20H7v-2a3 3 0 015.356-2.277M12 12a3 3 0 100-6 3 3 0 000 6zM5 20h2v-2a3 3 0 013-3h2a3 3 0 013 3v2h2" /></svg>);
const ArrowPathIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.693V7.929a8.25 8.25 0 00-11.667 0v1.416" /></svg>);
const PlusCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const UserCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const LibraryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.042.822l-2 5a1 1 0 001.708.708L8 12.382l2.992 2.992a1 1 0 001.414 0l2.992-2.992 2.242 2.242a1 1 0 001.708-.708l-2-5a.999.999 0 01.042-.822L17.5 6.92a1 1 0 000-1.84l-7-3zM3.25 6.22l7-3 7 3L10 9.22 3.25 6.22zM12 13.382l-2-2-1.742 1.742a1 1 0 00.707 1.708L12 12.382z" /></svg>);

// --- Main App Component ---
export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [members, setMembers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'library-management-system';

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    const showError = (message) => {
        setError(message);
        setTimeout(() => setError(''), 3000);
    };
    
    useEffect(() => {
        try {
            const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance);
            setDb(dbInstance);
            setLogLevel('debug');
    
            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (!user) {
                    try {
                        if (typeof __initial_auth_token !== 'undefined') {
                            await signInWithCustomToken(authInstance, __initial_auth_token);
                        } else {
                            await signInAnonymously(authInstance);
                        }
                    } catch (authError) {
                        console.error("Authentication failed:", authError);
                        showError("Could not connect to the library services. Please refresh.");
                    }
                }
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase initialization error:", e);
            showError("Failed to initialize the application. Please check configuration.");
            setIsLoading(false);
        }
    }, []);

    const fetchData = useCallback((collectionName, setter) => {
        if (!isAuthReady || !db) return;

        const dataCollection = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
        const unsubscribe = onSnapshot(dataCollection, (querySnapshot) => {
            const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(dataList);
            setIsLoading(false);
        }, (err) => {
            console.error(`Error fetching ${collectionName}:`, err);
            showError(`Failed to load ${collectionName}. Please try again later.`);
            setIsLoading(false);
        });
        return unsubscribe;
    }, [isAuthReady, db, appId]);
    
    useEffect(() => {
        const unsubBooks = fetchData('books', setBooks);
        const unsubMembers = fetchData('members', setMembers);
        const unsubTransactions = fetchData('transactions', setTransactions);

        return () => {
            if (unsubBooks) unsubBooks();
            if (unsubMembers) unsubMembers();
            if (unsubTransactions) unsubTransactions();
        };
    }, [fetchData]);

    const handleLogin = (loginIdentifier, password) => {
        if (loginIdentifier.toLowerCase() === 'admin' && password === 'admin123') {
            setCurrentUser({ role: 'admin' });
            showSuccess("Admin login successful!");
            return;
        }

        const member = members.find(m => m.memberId.toLowerCase() === loginIdentifier.toLowerCase());
        if (member) {
            setCurrentUser({ role: 'user', data: member });
            showSuccess(`Welcome, ${member.name}!`);
        } else {
            showError("Invalid Member ID or Admin credentials.");
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        showSuccess("You have been logged out.");
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100">Loading...</div>;
    }

    const commonProps = { db, appId, books, members, transactions, showError, showSuccess, error, successMessage };

    return (
        <>
            <AppStyles />
            {!currentUser ? (
                <LoginPage onLogin={handleLogin} error={error} successMessage={successMessage} />
            ) : currentUser.role === 'admin' ? (
                <AdminDashboard {...commonProps} onLogout={handleLogout} />
            ) : (
                <UserDashboard {...commonProps} currentUser={currentUser} onLogout={handleLogout} />
            )}
        </>
    );
}

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin, error, successMessage }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(identifier, password);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto">
                <div className="flex justify-center mb-6">
                   <LibraryIcon/>
                </div>
                <h2 className="text-3xl font-extrabold text-center text-gray-900">Library System Login</h2>
                <p className="mt-2 text-center text-sm text-gray-600">Login as an Admin or with your Member ID.</p>
                <div className="mt-8 bg-white p-8 shadow-lg rounded-lg">
                     {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                     {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{successMessage}</p></div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="identifier" className="text-sm font-bold text-gray-600 block">Username / Member ID</label>
                            <input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="form-input mt-1" placeholder="Enter 'admin' or your Member ID" required />
                        </div>
                        <div>
                            <label htmlFor="password"  className="text-sm font-bold text-gray-600 block">Password (for Admin)</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input mt-1" placeholder="Enter 'admin123' for Admin" />
                             <p className="text-xs text-gray-500 mt-1">Leave blank if logging in with Member ID.</p>
                        </div>
                        <button type="submit" className="button-primary w-full">Sign In</button>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- ADMIN DASHBOARD ---
const AdminDashboard = (props) => {
    const { db, appId, books, members, transactions, showError, showSuccess, error, successMessage, onLogout } = props;
    
    const [activeTab, setActiveTab] = useState('books');
    const [showBookModal, setShowBookModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            isbn: formData.get('isbn'),
            genre: formData.get('genre'),
            quantity: Number(formData.get('quantity')),
            available: Number(formData.get('quantity')),
        };

        if (!bookData.title || !bookData.author || !bookData.isbn || bookData.quantity <= 0) {
            showError("Please fill all required fields and provide a valid quantity."); return;
        }

        try {
            const booksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'books');
            if (editingBook) {
                const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', editingBook.id);
                const oldQuantity = editingBook.quantity;
                const quantityChange = bookData.quantity - oldQuantity;
                bookData.available = Math.max(0, editingBook.available + quantityChange);
                
                await updateDoc(bookRef, bookData);
                showSuccess("Book updated successfully!");
            } else {
                await addDoc(booksCollection, bookData);
                showSuccess("Book added successfully!");
            }
            setShowBookModal(false); setEditingBook(null);
        } catch (error) {
            console.error("Error saving book:", error); showError("Failed to save book.");
        }
    };
    
    const deleteBook = async (bookId) => {
        if (!window.confirm("Are you sure you want to delete this book? This action cannot be undone.")) return;
        try {
            const borrowedCount = transactions.filter(t => t.bookId === bookId && !t.returnDate).length;
            if(borrowedCount > 0){
                showError("Cannot delete book. It is currently borrowed by members."); return;
            }
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', bookId));
            showSuccess("Book deleted successfully!");
        } catch (error) {
            console.error("Error deleting book:", error); showError("Failed to delete book.");
        }
    };

    const handleMemberSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const memberData = {
            name: formData.get('name'),
            email: formData.get('email'),
            memberId: formData.get('memberId') || `MEM-${Date.now()}`,
            joinDate: new Date().toISOString().split('T')[0],
        };

        if (!memberData.name || !memberData.email) {
            showError("Please fill all required fields."); return;
        }

        try {
            const membersCollection = collection(db, 'artifacts', appId, 'public', 'data', 'members');
            if (editingMember) {
                const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', editingMember.id);
                await updateDoc(memberRef, memberData);
                showSuccess("Member updated successfully!");
            } else {
                const q = query(membersCollection, where("memberId", "==", memberData.memberId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    showError("A member with this ID already exists."); return;
                }
                await addDoc(membersCollection, memberData);
                showSuccess("Member added successfully!");
            }
            setShowMemberModal(false); setEditingMember(null);
        } catch (error) {
            console.error("Error saving member:", error); showError("Failed to save member.");
        }
    };

    const deleteMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to delete this member?")) return;
        try {
            const memberToDelete = members.find(m => m.id === memberId);
            const borrowedCount = transactions.filter(t => t.memberId === memberToDelete?.memberId && !t.returnDate).length;
            if(borrowedCount > 0){
                showError("Cannot delete member. They have outstanding borrowed books."); return;
            }
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberId));
            showSuccess("Member deleted successfully!");
        } catch (error) {
            console.error("Error deleting member:", error); showError("Failed to delete member.");
        }
    };
    
    const handleTransaction = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const memberIdentifier = formData.get('memberIdentifier').trim();
        const bookIdentifier = formData.get('bookIdentifier').trim();
        const action = formData.get('action');

        const member = members.find(m => m.memberId === memberIdentifier || m.email === memberIdentifier);
        const book = books.find(b => b.isbn === bookIdentifier || b.title.toLowerCase() === bookIdentifier.toLowerCase());

        if (!member) { showError("Member not found."); return; }
        if (!book) { showError("Book not found."); return; }

        const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', book.id);

        try {
            if (action === 'borrow') {
                if (book.available <= 0) { showError("Book is not available for borrowing."); return; }
                const memberHasBook = transactions.some(t => t.memberId === member.memberId && t.bookId === book.id && !t.returnDate);
                if (memberHasBook) { showError("Member has already borrowed this book."); return; }

                await runTransaction(db, async (transaction) => {
                    const bookDoc = await transaction.get(bookRef);
                    if (!bookDoc.exists()) throw new Error("Book does not exist!");
                    const newAvailable = bookDoc.data().available - 1;
                    if (newAvailable < 0) throw new Error("Not enough books in stock!");
                    
                    transaction.update(bookRef, { available: newAvailable });
                    const transactionData = {
                        memberId: member.memberId, memberName: member.name, bookId: book.id, bookTitle: book.title,
                        borrowDate: new Date().toISOString(), dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), returnDate: null,
                    };
                    transaction.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions')), transactionData);
                });
                showSuccess(`Book "${book.title}" borrowed by ${member.name}.`);

            } else { // Return action
                const borrowedTransaction = transactions.find(t => t.memberId === member.memberId && t.bookId === book.id && !t.returnDate);
                if (!borrowedTransaction) { showError("This book was not borrowed by this member or has already been returned."); return; }
                
                const transactionRef = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', borrowedTransaction.id);
                
                await runTransaction(db, async (transaction) => {
                    const bookDoc = await transaction.get(bookRef);
                    if (!bookDoc.exists()) throw new Error("Book does not exist!");
                    const newAvailable = bookDoc.data().available + 1;
                    if (newAvailable > bookDoc.data().quantity) throw new Error("Error in stock count!");

                    transaction.update(bookRef, { available: newAvailable });
                    transaction.update(transactionRef, { returnDate: new Date().toISOString() });
                });
                showSuccess(`Book "${book.title}" returned by ${member.name}.`);
            }
            setShowTransactionModal(false);
        } catch (error) {
            console.error("Transaction failed:", error);
            showError(`Transaction failed: ${error.toString()}`);
        }
    };
    
    const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.author.toLowerCase().includes(searchTerm.toLowerCase()) || b.isbn.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()) || m.memberId.toLowerCase().includes(searchTerm.toLowerCase()));
    const getMemberBorrowedBooks = (memberId) => transactions.filter(t => t.memberId === memberId && !t.returnDate);
    
    const renderContent = () => {
        switch (activeTab) {
            case 'books': return <BookManagementPanel books={filteredBooks} onAdd={() => { setEditingBook(null); setShowBookModal(true); }} onEdit={(book) => { setEditingBook(book); setShowBookModal(true); }} onDelete={deleteBook} />;
            case 'members': return <MemberManagementPanel members={filteredMembers} onAdd={() => { setEditingMember(null); setShowMemberModal(true); }} onEdit={(member) => { setEditingMember(member); setShowMemberModal(true); }} onDelete={deleteMember} getBorrowedBooks={getMemberBorrowedBooks} />;
            case 'transactions': return <TransactionHistoryPanel transactions={transactions} />;
            default: return <div>Select a tab</div>;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800">
            <div className="container mx-auto p-4 sm:p-6">
                <header className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-700">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Full control over the Library Management System.</p>
                    </div>
                    <button onClick={onLogout} className="button-secondary flex items-center"><LogoutIcon/> Logout</button>
                </header>
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{successMessage}</p></div>}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-4">
                        <nav className="flex flex-wrap space-x-2 mb-4 sm:mb-0">
                            <TabButton icon={<BookIcon />} label="Books" isActive={activeTab === 'books'} onClick={() => setActiveTab('books')} />
                            <TabButton icon={<UserGroupIcon />} label="Members" isActive={activeTab === 'members'} onClick={() => setActiveTab('members')} />
                            <TabButton icon={<ArrowPathIcon />} label="History" isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                        </nav>
                        <div className="w-full sm:w-auto flex items-center space-x-2">
                             <input type="text" placeholder={`Search ${activeTab}...`} className="form-input w-full sm:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <button onClick={() => setShowTransactionModal(true)} className="button-primary flex items-center whitespace-nowrap"><PlusCircleIcon/> Issue / Return</button>
                        </div>
                    </div>
                    {renderContent()}
                </div>
            </div>
            {showBookModal && <BookModal book={editingBook} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSubmit={handleBookSubmit} />}
            {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSubmit={handleMemberSubmit} />}
            {showTransactionModal && <TransactionModal onClose={() => setShowTransactionModal(false)} onSubmit={handleTransaction} />}
        </div>
    );
};

// --- USER DASHBOARD ---
const UserDashboard = ({ currentUser, onLogout, books, transactions, successMessage, error }) => {
    const [activeTab, setActiveTab] = useState('catalogue');
    const [searchTerm, setSearchTerm] = useState('');
    const { data: member } = currentUser;

    const myTransactions = transactions.filter(t => t.memberId === member.memberId).sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
    const currentlyBorrowed = myTransactions.filter(t => !t.returnDate);
    const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.author.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderContent = () => {
        switch (activeTab) {
            case 'catalogue':
                return (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Book Catalogue ({filteredBooks.length})</h2>
                        <div className="overflow-x-auto">
                           <table className="min-w-full bg-white">
                                <thead className="bg-gray-50"><tr><th className="table-header">Title</th><th className="table-header">Author</th><th className="table-header">Genre</th><th className="table-header">Status</th></tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBooks.length > 0 ? filteredBooks.map(book => (
                                        <tr key={book.id} className="hover:bg-gray-50">
                                            <td className="table-cell font-medium">{book.title}</td><td className="table-cell">{book.author}</td><td className="table-cell">{book.genre}</td>
                                            <td className="table-cell">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${book.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{book.available > 0 ? 'Available' : 'Unavailable'}</span>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="4" className="text-center py-4">No books found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'activity':
                return (
                     <div>
                        <h2 className="text-2xl font-semibold mb-4">My Activity</h2>
                        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                            <h3 className="font-bold text-lg text-indigo-800">My Profile</h3>
                            <p><strong>Name:</strong> {member.name}</p><p><strong>Email:</strong> {member.email}</p><p><strong>Member ID:</strong> {member.memberId}</p><p><strong>Currently Borrowed:</strong> {currentlyBorrowed.length} book(s)</p>
                        </div>
                         <h3 className="font-bold text-lg mb-2">My Borrowing History ({myTransactions.length})</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50"><tr><th className="table-header">Book Title</th><th className="table-header">Borrow Date</th><th className="table-header">Due Date</th><th className="table-header">Return Date</th><th className="table-header">Status</th></tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                    {myTransactions.length > 0 ? myTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="table-cell font-medium">{t.bookTitle}</td><td className="table-cell">{new Date(t.borrowDate).toLocaleDateString()}</td><td className="table-cell">{new Date(t.dueDate).toLocaleDateString()}</td><td className="table-cell">{t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="table-cell"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.returnDate ? 'bg-green-100 text-green-800' : (new Date(t.dueDate) < new Date() ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800')}`}>{t.returnDate ? 'Returned' : (new Date(t.dueDate) < new Date() ? 'Overdue' : 'Borrowed')}</span></td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="text-center py-4">You have no transaction history.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800">
            <div className="container mx-auto p-4 sm:p-6">
                 <header className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
                    <div><h1 className="text-4xl font-bold text-gray-700">Welcome, {member.name}!</h1><p className="text-gray-500 mt-1">Your personal library dashboard.</p></div>
                    <button onClick={onLogout} className="button-secondary flex items-center"><LogoutIcon/> Logout</button>
                </header>
                 {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{successMessage}</p></div>}
                <div className="bg-white rounded-lg shadow-md p-4">
                     <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-4">
                        <nav className="flex flex-wrap space-x-2 mb-4 sm:mb-0">
                            <TabButton icon={<BookIcon />} label="Book Catalogue" isActive={activeTab === 'catalogue'} onClick={() => setActiveTab('catalogue')} />
                            <TabButton icon={<UserCircleIcon />} label="My Activity" isActive={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
                        </nav>
                        {activeTab === 'catalogue' && ( <input type="text" placeholder="Search books..." className="form-input w-full sm:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> )}
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};


// --- SHARED UI COMPONENTS ---
const Modal = ({ children, title, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b"><h3 className="text-xl font-semibold">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button></div>
            {children}
        </div>
    </div>
);
const BookModal = ({ book, onClose, onSubmit }) => (<Modal title={book ? "Edit Book" : "Add New Book"} onClose={onClose}><form onSubmit={onSubmit}><div className="p-6 space-y-4"><input type="text" name="title" placeholder="Book Title" defaultValue={book?.title} className="form-input" required /><input type="text" name="author" placeholder="Author" defaultValue={book?.author} className="form-input" required /><input type="text" name="isbn" placeholder="ISBN" defaultValue={book?.isbn} className="form-input" required /><input type="text" name="genre" placeholder="Genre" defaultValue={book?.genre} className="form-input" /><input type="number" name="quantity" placeholder="Total Quantity" defaultValue={book?.quantity} className="form-input" min="1" required /></div><div className="p-4 bg-gray-50 flex justify-end space-x-2"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" className="button-primary">{book ? "Update Book" : "Add Book"}</button></div></form></Modal>);
const MemberModal = ({ member, onClose, onSubmit }) => (<Modal title={member ? "Edit Member" : "Add New Member"} onClose={onClose}><form onSubmit={onSubmit}><div className="p-6 space-y-4"><input type="text" name="name" placeholder="Full Name" defaultValue={member?.name} className="form-input" required /><input type="email" name="email" placeholder="Email Address" defaultValue={member?.email} className="form-input" required /><input type="text" name="memberId" placeholder="Member ID (auto-generated if blank)" defaultValue={member?.memberId} className="form-input" disabled={!!member} /></div><div className="p-4 bg-gray-50 flex justify-end space-x-2"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" className="button-primary">{member ? "Update Member" : "Add Member"}</button></div></form></Modal>);
const TransactionModal = ({ onClose, onSubmit }) => (<Modal title="Issue or Return a Book" onClose={onClose}><form onSubmit={onSubmit}><div className="p-6 space-y-4"><input type="text" name="memberIdentifier" placeholder="Member ID or Email" className="form-input" required /><input type="text" name="bookIdentifier" placeholder="Book ISBN or Title" className="form-input" required /><div><label className="block text-sm font-medium text-gray-700 mb-2">Action</label><div className="flex items-center space-x-4"><label className="flex items-center"><input type="radio" name="action" value="borrow" className="form-radio" defaultChecked /><span className="ml-2">Borrow</span></label><label className="flex items-center"><input type="radio" name="action" value="return" className="form-radio" /><span className="ml-2">Return</span></label></div></div></div><div className="p-4 bg-gray-50 flex justify-end space-x-2"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" className="button-primary">Submit Transaction</button></div></form></Modal>);
const TabButton = ({ icon, label, isActive, onClick }) => (<button onClick={onClick} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? 'bg-indigo-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>{icon} {label}</button>);
const BookManagementPanel = ({ books, onAdd, onEdit, onDelete }) => (<div><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-semibold">Book Collection ({books.length})</h2><button onClick={onAdd} className="button-primary flex items-center"><PlusCircleIcon /> Add Book</button></div><div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-50"><tr><th className="table-header">Title</th><th className="table-header">Author</th><th className="table-header">ISBN</th><th className="table-header">Genre</th><th className="table-header">Available</th><th className="table-header">Actions</th></tr></thead><tbody className="divide-y divide-gray-200">{books.length > 0 ? books.map(book => (<tr key={book.id} className="hover:bg-gray-50"><td className="table-cell font-medium">{book.title}</td><td className="table-cell">{book.author}</td><td className="table-cell">{book.isbn}</td><td className="table-cell">{book.genre}</td><td className="table-cell text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${book.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{book.available} / {book.quantity}</span></td><td className="table-cell space-x-2 whitespace-nowrap"><button onClick={() => onEdit(book)} className="button-secondary">Edit</button><button onClick={() => onDelete(book.id)} className="button-danger">Delete</button></td></tr>)) : <tr><td colSpan="6" className="text-center py-4">No books found.</td></tr>}</tbody></table></div></div>);
const MemberManagementPanel = ({ members, onAdd, onEdit, onDelete, getBorrowedBooks }) => (<div><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-semibold">Library Members ({members.length})</h2><button onClick={onAdd} className="button-primary flex items-center"><PlusCircleIcon /> Add Member</button></div><div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-50"><tr><th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Member ID</th><th className="table-header">Borrowed Books</th><th className="table-header">Actions</th></tr></thead><tbody className="divide-y divide-gray-200">{members.length > 0 ? members.map(member => (<tr key={member.id} className="hover:bg-gray-50"><td className="table-cell font-medium">{member.name}</td><td className="table-cell">{member.email}</td><td className="table-cell">{member.memberId}</td><td className="table-cell text-center"><span className="px-2 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800">{getBorrowedBooks(member.memberId).length}</span></td><td className="table-cell space-x-2 whitespace-nowrap"><button onClick={() => onEdit(member)} className="button-secondary">Edit</button><button onClick={() => onDelete(member.id)} className="button-danger">Delete</button></td></tr>)) : <tr><td colSpan="5" className="text-center py-4">No members found.</td></tr>}</tbody></table></div></div>);
const TransactionHistoryPanel = ({ transactions }) => { const sortedTransactions = [...transactions].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)); return (<div><h2 className="text-2xl font-semibold mb-4">Transaction History ({transactions.length})</h2><div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-50"><tr><th className="table-header">Book Title</th><th className="table-header">Member Name</th><th className="table-header">Borrow Date</th><th className="table-header">Due Date</th><th className="table-header">Return Date</th><th className="table-header">Status</th></tr></thead><tbody className="divide-y divide-gray-200">{sortedTransactions.length > 0 ? sortedTransactions.map(t => (<tr key={t.id} className="hover:bg-gray-50"><td className="table-cell font-medium">{t.bookTitle}</td><td className="table-cell">{t.memberName}</td><td className="table-cell">{new Date(t.borrowDate).toLocaleDateString()}</td><td className="table-cell">{new Date(t.dueDate).toLocaleDateString()}</td><td className="table-cell">{t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'N/A'}</td><td className="table-cell"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.returnDate ? 'bg-green-100 text-green-800' : (new Date(t.dueDate) < new Date() ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800')}`}>{t.returnDate ? 'Returned' : (new Date(t.dueDate) < new Date() ? 'Overdue' : 'Borrowed')}</span></td></tr>)) : <tr><td colSpan="6" className="text-center py-4">No transactions yet.</td></tr>}</tbody></table></div></div>);};

