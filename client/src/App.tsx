import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomsPage } from './pages/RoomsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { ProfilePage } from './pages/ProfilePage';

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
                <Link to="/" className="text-2xl font-black text-primary tracking-tighter italic">
                    GRAND RESERVE
                </Link>
                <div className="flex gap-6 items-center font-bold text-sm uppercase tracking-widest">
                    {user && user.role === 'GUEST' && (
                        <Link
                            to="/bookings/my"
                            className="text-slate-600 hover:text-primary transition-colors"
                        >
                            Мої бронювання
                        </Link>
                    )}
                    {user && (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                        <div className="flex gap-4">
                            <Link
                                to="/admin"
                                className="text-primary hover:text-blue-700 transition-colors border-b-2 border-primary"
                            >
                                Бронювання
                            </Link>
                            {user.role === 'ADMIN' && (
                                <Link
                                    to="/admin/inventory"
                                    className="text-slate-600 hover:text-primary transition-colors"
                                >
                                    Фонд
                                </Link>
                            )}
                        </div>
                    )}
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors">
                        Номери
                    </Link>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400">|</span>
                            <Link to="/profile" className="flex flex-col items-end group">
                                <span className="text-slate-900 group-hover:text-primary transition-colors lowercase font-medium text-[12px] leading-none">
                                    {user.email}
                                </span>
                            </Link>
                            {user && (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                                <span className="font-medium text-primary">{user.role}</span>
                            )}
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
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/rooms/:id" element={<RoomDetailsPage />} />
                        <Route path="/bookings/my" element={<MyBookingsPage />} />
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/inventory" element={<AdminInventoryPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
