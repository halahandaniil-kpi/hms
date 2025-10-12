import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomsPage } from './pages/RoomsPage';
import { LoginPage } from './pages/LoginPage';

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
                <Link to="/" className="text-2xl font-black text-primary tracking-tighter italic">
                    GRAND RESERVE
                </Link>
                <div className="flex gap-6 items-center font-bold text-sm uppercase tracking-widest">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors">
                        Номери
                    </Link>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-900 lowercase font-medium">
                                {user.email}
                            </span>
                            <button onClick={logout} className="text-red-500 hover:text-red-700">
                                Вихід
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800 transition-all"
                        >
                            Увійти
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="min-h-screen">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<RoomsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
