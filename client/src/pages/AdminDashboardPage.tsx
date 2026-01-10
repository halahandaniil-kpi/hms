import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import axios from 'axios';
import {
    LogOut,
    LogIn,
    Phone,
    Mail,
    Search,
    Filter,
    XCircle,
    ChevronDown,
    CheckCircle,
} from 'lucide-react';

interface Booking {
    id: number;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    totalPrice: string;
    user: { fullName: string; email: string; phone: string };
    room: { roomNumber: string; roomType: { name: string } };
    payment?: { id: number; status: string };
}

export const AdminDashboardPage = () => {
    const { user } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchAllBookings = async () => {
        try {
            const res = await api.get('/bookings/all');
            setBookings(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const handleRefund = async (paymentId: number) => {
        if (!window.confirm('Ви впевнені, що хочете оформити повернення коштів?')) return;

        try {
            await api.patch(`/payments/${paymentId}/refund`);
            fetchAllBookings();
            alert('Повернення коштів успішно оформлено');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка при поверненні');
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
            CHECKED_IN: 'bg-blue-100 text-blue-700 border-blue-200',
            CHECKED_OUT: 'bg-slate-100 text-slate-700 border-slate-200',
            CANCELLED: 'bg-red-100 text-red-700 border-red-200',
        };

        const labels: Record<string, string> = {
            PENDING: 'Очікується підтвердження',
            CONFIRMED: 'Підтверджено',
            CHECKED_IN: 'Проживає',
            CHECKED_OUT: 'Завершено',
            CANCELLED: 'Скасовано',
        };

        return (
            <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status as keyof typeof styles]}`}
            >
                {labels[status] || status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-50 text-yellow-600 border-yellow-100',
            COMPLETED: 'bg-green-50 text-green-600 border-green-100',
            REFUNDED: 'bg-purple-50 text-purple-600 border-purple-100',
            FAILED: 'bg-red-50 text-red-600 border-red-100',
        };

        const labels: Record<string, string> = {
            PENDING: 'Очікує',
            COMPLETED: 'Оплачено',
            REFUNDED: 'Повернено',
            FAILED: 'Помилка',
        };

        return (
            <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${styles[status] || 'bg-gray-50'}`}
            >
                {labels[status] || status}
            </span>
        );
    };

    const updateStatus = async (id: number, newStatus: string) => {
        if (!window.confirm(`Змінити статус на ${newStatus}?`)) return;
        try {
            await api.patch(`/bookings/${id}/status`, { status: newStatus });
            fetchAllBookings();
        } catch {
            alert('Помилка оновлення статусу');
        }
    };

    const confirmPayment = async (paymentId: number) => {
        try {
            await api.patch(`/payments/${paymentId}/confirm`);
            fetchAllBookings();
        } catch {
            alert('Помилка підтвердження оплати');
        }
    };

    // ЛОГІКА ФІЛЬТРАЦІЇ (виконується при кожному рендері)
    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.room.roomNumber.includes(searchTerm);

        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading)
        return (
            <div className="p-20 text-center animate-pulse font-black text-primary">
                Завантаження бази...
            </div>
        );

    return (
        <main className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-uppercase">
                        Управління бронюваннями
                    </h1>
                    <p className="text-slate-400 font-bold text-sm">
                        Знайдено бронювань: {filteredBookings.length}
                    </p>
                </div>

                {/* ПАНЕЛЬ ФІЛЬТРІВ */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Пошук гостя або номера..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />
                        <select
                            className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Всі статуси</option>
                            <option value="PENDING">Очікують</option>
                            <option value="CONFIRMED">Підтверджені</option>
                            <option value="CHECKED_IN">Проживають</option>
                            <option value="CHECKED_OUT">Завершені</option>
                            <option value="CANCELLED">Скасовані</option>
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            size={14}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Гість / Контакти
                                </th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Номер
                                </th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Період
                                </th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Статус
                                </th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Оплата
                                </th>
                                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                                    Дії
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="font-bold text-slate-900">
                                            {b.user.fullName}
                                        </div>
                                        <div className="text-[11px] text-slate-400 flex flex-col gap-0.5 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Phone size={10} /> {b.user.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail size={10} /> {b.user.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">
                                            №{b.room.roomNumber}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-bold">
                                            {b.room.roomType.name}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-xs font-bold text-slate-700">
                                            {new Date(b.checkInDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 italic">
                                            до {new Date(b.checkOutDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-6">{getStatusBadge(b.status)}</td>
                                    <td className="p-6">
                                        {b.payment ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black">
                                                        {b.totalPrice} ₴
                                                    </span>
                                                    {getPaymentStatusBadge(b.payment.status)}
                                                </div>
                                                {b.payment.status === 'PENDING' && (
                                                    <button
                                                        onClick={() =>
                                                            confirmPayment(b.payment!.id)
                                                        }
                                                        className="text-[9px] bg-primary text-white px-2 py-1 rounded font-bold uppercase"
                                                    >
                                                        Підтвердити оплату
                                                    </button>
                                                )}
                                                {user?.role === 'ADMIN' &&
                                                    b.payment.status === 'COMPLETED' && (
                                                        <button
                                                            onClick={() =>
                                                                handleRefund(b.payment!.id)
                                                            }
                                                            className="text-[9px] border border-purple-200 text-purple-600 px-2 py-1 rounded hover:bg-purple-50 font-bold uppercase"
                                                        >
                                                            Оформити повернення
                                                        </button>
                                                    )}
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-slate-300">
                                                Очікує оплати
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {b.status === 'PENDING' && (
                                                <button
                                                    onClick={() => updateStatus(b.id, 'CONFIRMED')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                    title="Підтвердити бронювання"
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                            )}
                                            {b.status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() => {
                                                        if (b.payment?.status !== 'COMPLETED') {
                                                            alert(
                                                                'Заселення неможливе без підтвердженої оплати!',
                                                            );
                                                            return;
                                                        }
                                                        updateStatus(b.id, 'CHECKED_IN');
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${b.payment?.status === 'COMPLETED' ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                                                    title={
                                                        b.payment?.status === 'COMPLETED'
                                                            ? 'Поселити'
                                                            : 'Оплата не проведена'
                                                    }
                                                >
                                                    <LogIn size={20} />
                                                </button>
                                            )}
                                            {b.status === 'CHECKED_IN' && (
                                                <button
                                                    onClick={() =>
                                                        updateStatus(b.id, 'CHECKED_OUT')
                                                    }
                                                    className="p-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                                                    title="Виселити"
                                                >
                                                    <LogOut size={20} />
                                                </button>
                                            )}
                                            {['PENDING', 'CONFIRMED'].includes(b.status) && (
                                                <button
                                                    onClick={() => updateStatus(b.id, 'CANCELLED')}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Скасувати"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="p-20 text-center text-slate-400 font-bold">
                        За вашим запитом нічого не знайдено
                    </div>
                )}
            </div>
        </main>
    );
};
