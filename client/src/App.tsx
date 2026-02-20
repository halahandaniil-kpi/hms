import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomsPage } from './pages/RoomsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { MaintenancePage } from './pages/MaintenancePage';
import { useState, useEffect } from 'react';
import { Menu, X as CloseIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const getLinkStyle = (path: string, isMobile: boolean = false) => {
        const isActive = location.pathname === path;
        const baseClass = isMobile
            ? 'block py-4 text-lg font-black uppercase tracking-widest border-b border-slate-100 '
            : 'transition-colors font-bold uppercase text-sm tracking-widest pb-1 ';

        if (isActive)
            return `${baseClass} text-primary ${!isMobile ? 'border-b-2 border-primary' : ''}`;
        return `${baseClass} text-slate-600 hover:text-primary`;
    };

    return (
        <nav className="sticky top-0 z-[100] bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center relative z-[110] bg-white">
                <Link to="/" className="text-2xl font-black text-primary tracking-tighter italic">
                    GRAND RESERVE
                </Link>

                {/* КНОПКА БУРГЕРА (Тільки для мобільних) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden p-2 text-slate-600 z-50"
                >
                    {isOpen ? <CloseIcon size={28} /> : <Menu size={28} />}
                </button>

                {/* ДЕСКТОПНЕ МЕНЮ (Приховане на мобільних) */}
                <div className="hidden lg:flex gap-6 items-center">
                    {user && user.role === 'GUEST' && (
                        <Link to="/bookings/my" className={getLinkStyle('/bookings/my')}>
                            Мої бронювання
                        </Link>
                    )}
                    {user && (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                        <div className="flex gap-6">
                            <Link to="/admin" className={getLinkStyle('/admin')}>
                                Бронювання
                            </Link>
                            <Link
                                to="/admin/maintenance"
                                className={getLinkStyle('/admin/maintenance')}
                            >
                                Журнал робіт
                            </Link>
                            {user.role === 'ADMIN' && (
                                <Link
                                    to="/admin/inventory"
                                    className={getLinkStyle('/admin/inventory')}
                                >
                                    Фонд
                                </Link>
                            )}
                        </div>
                    )}
                    <Link to="/" className={getLinkStyle('/')}>
                        Номери
                    </Link>

                    <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                        {user ? (
                            <>
                                <Link to="/profile" className="flex flex-col items-end group">
                                    <span className="text-slate-900 group-hover:text-primary transition-colors lowercase font-medium text-[15px] leading-none">
                                        {user.email}
                                    </span>
                                    {user.role !== 'GUEST' && (
                                        <span className="text-[10px] text-primary font-black uppercase tracking-tighter">
                                            {user.role}
                                        </span>
                                    )}
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                >
                                    Вихід
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800 transition-all font-bold text-sm"
                            >
                                Увійти
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* МОБІЛЬНЕ МЕНЮ */}
            <div
                className={`fixed inset-0 bg-white z-40 lg:hidden transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col p-8 pt-24 h-full overflow-y-auto">
                    {user && user.role === 'GUEST' && (
                        <Link
                            to="/bookings/my"
                            onClick={closeMenu}
                            className={getLinkStyle('/bookings/my', true)}
                        >
                            Мої бронювання
                        </Link>
                    )}
                    {user && (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                        <>
                            <Link
                                to="/admin"
                                onClick={closeMenu}
                                className={getLinkStyle('/admin', true)}
                            >
                                Бронювання
                            </Link>
                            <Link
                                to="/admin/maintenance"
                                onClick={closeMenu}
                                className={getLinkStyle('/admin/maintenance', true)}
                            >
                                Журнал робіт
                            </Link>
                            {user.role === 'ADMIN' && (
                                <Link
                                    to="/admin/inventory"
                                    onClick={closeMenu}
                                    className={getLinkStyle('/admin/inventory', true)}
                                >
                                    Управління фондом
                                </Link>
                            )}
                        </>
                    )}
                    <Link to="/" onClick={closeMenu} className={getLinkStyle('/', true)}>
                        Каталог номерів
                    </Link>
                    <Link
                        to="/profile"
                        onClick={closeMenu}
                        className={getLinkStyle('/profile', true)}
                    >
                        Мій профіль
                    </Link>

                    <div className="mt-auto">
                        {user ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">
                                        Ви увійшли як
                                    </p>
                                    <p className="font-bold text-slate-900">{user.email}</p>
                                    {user.role !== 'GUEST' && (
                                        <p className="text-xs text-primary font-black uppercase mt-1">
                                            {user.role}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest"
                                >
                                    Вийти з акаунту
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="block w-full py-4 bg-primary text-white text-center rounded-2xl font-black uppercase tracking-widest"
                            >
                                Увійти в систему
                            </Link>
                        )}
                    </div>
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
                        <Route path="/admin/maintenance" element={<MaintenancePage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
