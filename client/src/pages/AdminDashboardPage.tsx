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
    Plus,
    X,
    Calendar,
    CreditCard,
    Wallet,
} from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { uk } from 'date-fns/locale';
registerLocale('uk', uk as unknown as import('date-fns').Locale);

interface UnifiedDate {
    start: Date;
    end: Date;
    type: 'booking' | 'maintenance';
}

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

interface ApiBooking {
    checkInDate: string;
    checkOutDate: string;
}

interface ApiMaintenance {
    startDate: string;
    endDate: string | null;
}

interface PhysicalRoom {
    id: number;
    roomNumber: string;
    status: string;
}

interface DashboardRoomType {
    id: number;
    name: string;
    basePrice: string;
    rooms: PhysicalRoom[];
}

export const AdminDashboardPage = () => {
    const { user } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [guests, setGuests] = useState<
        { id: number; fullName: string; email: string; phone: string }[]
    >([]);

    const [roomTypes, setRoomTypes] = useState<DashboardRoomType[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    const [adminTakenDates, setAdminTakenDates] = useState<UnifiedDate[]>([]);

    const [isNewGuest, setIsNewGuest] = useState(false);
    const [newGuestData, setNewGuestData] = useState({ fullName: '', email: '', phone: '' });

    const [adminForm, setAdminForm] = useState({
        targetUserId: '',
        roomId: '',
        checkIn: '',
        checkOut: '',
        paymentMethod: 'CARD',
        specialRequests: '',
    });

    const [guestSearchTerm, setGuestSearchTerm] = useState('');
    const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);

    // Фільтрація списку гостей у реальному часі
    const filteredGuests = guests.filter(
        (g) =>
            g.fullName.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
            g.email.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
            g.phone?.toLowerCase().includes(guestSearchTerm.toLowerCase()),
    );

    const fetchAllBookings = async () => {
        try {
            const res = await api.get('/bookings/all');
            setBookings(res.data);
        } finally {
            setLoading(false);
        }
    };

    const resetAdminModal = () => {
        setAdminForm({
            targetUserId: '',
            roomId: '',
            checkIn: '',
            checkOut: '',
            paymentMethod: 'CARD',
            specialRequests: '',
        });
        setSelectedCategoryId('');
        setGuestSearchTerm('');
        setAdminTakenDates([]);
        setNewGuestData({ fullName: '', email: '', phone: '' });
        setIsNewGuest(false);
        setIsModalOpen(false);
    };

    useEffect(() => {
        fetchAllBookings();
    }, []);

    useEffect(() => {
        const fetchDates = async () => {
            if (adminForm.roomId && isModalOpen) {
                try {
                    const res = await api.get(`/bookings/room/${adminForm.roomId}/taken-dates`);
                    const formattedBookings = res.data.bookings.map((b: ApiBooking) => ({
                        start: new Date(b.checkInDate),
                        end: new Date(b.checkOutDate),
                        type: 'booking',
                    }));
                    const formattedMaintenance = res.data.maintenance.map((m: ApiMaintenance) => ({
                        start: new Date(m.startDate),
                        end: new Date(m.endDate || Date.now() + 31536000000), // якщо endDate null, ставимо +1 рік
                        type: 'maintenance',
                    }));
                    setAdminTakenDates([...formattedBookings, ...formattedMaintenance]);
                } catch (err) {
                    console.error('Помилка завантаження дат', err);
                }
            }
        };
        fetchDates();
        const interval = setInterval(fetchDates, 30000);
        return () => {
            clearInterval(interval);
        };
    }, [adminForm.roomId, isModalOpen]);

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

    // ЛОГІКА ФІЛЬТРАЦІЇ
    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.room.roomNumber.includes(searchTerm);

        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const openBookingModal = async () => {
        try {
            const [gRes, tRes] = await Promise.all([
                api.get('/auth/guests'),
                api.get('/rooms/types/all'),
            ]);
            setGuests(gRes.data);
            setRoomTypes(tRes.data);
            setIsModalOpen(true);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка завантаження даних для бронювання');
            }
        }
    };

    const handleAdminBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminForm.checkIn || !adminForm.checkOut) return alert('Оберіть дати!');
        if (!adminForm.roomId) return alert('Оберіть номер кімнати!');
        if (!isNewGuest && !adminForm.targetUserId)
            return alert('Оберіть існуючого гостя або створіть нового!');

        const hasOverlap = adminTakenDates.some((period) => {
            const pStart = new Date(period.start).getTime();
            const pEnd = new Date(period.end).getTime();
            const selStart = new Date(adminForm.checkIn).getTime();
            const selEnd = new Date(adminForm.checkOut).getTime();
            return selStart < pEnd && selEnd > pStart;
        });
        if (hasOverlap) {
            return alert('Обраний період перетинається з існуючим бронюванням або ремонтом');
        }

        try {
            // Бронювання
            const payload = {
                roomId: adminForm.roomId,
                checkIn: adminForm.checkIn,
                checkOut: adminForm.checkOut,
                specialRequests: adminForm.specialRequests,
                // Якщо новий гість - передаємо його дані, якщо ні - тільки ID
                targetUserId: isNewGuest ? null : adminForm.targetUserId,
                newGuest: isNewGuest ? newGuestData : null,
            };
            const res = await api.post('/bookings/admin-create', payload);

            // Оплата
            const bookingId = res.data.id;
            await api.post('/payments/pay', {
                bookingId: res.data.id,
                paymentMethod: adminForm.paymentMethod,
            });
            if (adminForm.paymentMethod === 'CARD') {
                // Отримуємо параметри LiqPay для редіректу
                const liqpayRes = await api.post('/payments/liqpay-params', { bookingId });
                const { data, signature } = liqpayRes.data;

                // Створюємо динамічну форму для переходу на LiqPay
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://www.liqpay.ua/api/3/checkout';
                form.acceptCharset = 'utf-8';

                const dataInput = document.createElement('input');
                dataInput.type = 'hidden';
                dataInput.name = 'data';
                dataInput.value = data;
                form.appendChild(dataInput);

                const sigInput = document.createElement('input');
                sigInput.type = 'hidden';
                sigInput.name = 'signature';
                sigInput.value = signature;
                form.appendChild(sigInput);

                document.body.appendChild(form);
                form.submit();
            } else {
                // Якщо обрано оплату при заселенні
                alert('Бронювання успішно оформлено! Гість оплатить заїзд на ресепшині.');
                resetAdminModal();
                fetchAllBookings();
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка при створенні');
            }
        }
    };

    const toLocalISOString = (date: Date | null) => {
        if (!date) return '';
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().split('T')[0];
    };

    const getAdminDayClassName = (date: Date) => {
        const dateStr = toLocalISOString(date);
        let isStart = false;
        let isEnd = false;
        let isBetween = false;

        adminTakenDates.forEach((period) => {
            const startStr = toLocalISOString(new Date(period.start));
            const endStr = toLocalISOString(new Date(period.end));

            if (dateStr === startStr) isStart = true;
            else if (dateStr === endStr) isEnd = true;
            else if (dateStr > startStr && dateStr < endStr) isBetween = true;
        });

        if (isStart && isEnd) return 'taken-split';
        if (isBetween) return 'taken-full';
        if (isStart) return 'taken-start';
        if (isEnd) return 'taken-end';

        return '';
    };

    const getDisabledDates = () => {
        const disabled = new Set<string>();

        adminTakenDates.forEach((period) => {
            const sStr = toLocalISOString(new Date(period.start));
            const eStr = toLocalISOString(new Date(period.end));

            // Блокуємо день, якщо він є заїздом і виїздом
            if (adminTakenDates.some((other) => toLocalISOString(new Date(other.end)) === sStr)) {
                disabled.add(sStr);
            }
            if (adminTakenDates.some((other) => toLocalISOString(new Date(other.start)) === eStr)) {
                disabled.add(eStr);
            }
        });

        return Array.from(disabled).map((dateStr) => new Date(dateStr));
    };
    const disabledDates = getDisabledDates();

    const excludeIntervals = adminTakenDates
        .map((period) => {
            const start = toLocalISOString(new Date(period.start));
            const end = toLocalISOString(new Date(period.end));

            const blockedStart = new Date(start);
            blockedStart.setDate(blockedStart.getDate());

            const blockedEnd = new Date(end);
            blockedEnd.setDate(blockedEnd.getDate() - 1);

            // Якщо бронь лише на 1 ніч, блокувати всередині нічого
            if (blockedStart > blockedEnd) return null;

            return { start: blockedStart, end: blockedEnd };
        })
        .filter(Boolean) as { start: Date; end: Date }[];

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

                {/* ПАНЕЛЬ ФІЛЬТРІВ ТА ДОДАВАННЯ */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={openBookingModal}
                        className="bg-primary text-white px-6 py-2 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100"
                    >
                        <Plus size={18} /> Нове бронювання
                    </button>
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
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black">
                                                    {b.totalPrice} ₴
                                                </span>
                                                {b.payment &&
                                                    getPaymentStatusBadge(b.payment.status)}
                                            </div>
                                            {b.payment?.status === 'PENDING' && (
                                                <button
                                                    onClick={() => confirmPayment(b.payment!.id)}
                                                    className="text-[9px] bg-primary text-white px-2 py-1 rounded font-bold uppercase"
                                                >
                                                    Підтвердити оплату
                                                </button>
                                            )}
                                            {user?.role === 'ADMIN' &&
                                                b.payment?.status === 'COMPLETED' && (
                                                    <button
                                                        onClick={() => handleRefund(b.payment!.id)}
                                                        className="text-[9px] border border-purple-200 text-purple-600 px-2 py-1 rounded hover:bg-purple-50 font-bold uppercase"
                                                    >
                                                        Оформити повернення
                                                    </button>
                                                )}
                                        </div>
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
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form
                        onSubmit={handleAdminBooking}
                        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                Оформити бронь
                            </h3>
                            <button
                                type="button"
                                onClick={resetAdminModal}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Гість */}
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                                <button
                                    type="button"
                                    onClick={() => setIsNewGuest(false)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isNewGuest ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                                >
                                    Існуючий клієнт
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNewGuest(true)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isNewGuest ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                                >
                                    Новий клієнт
                                </button>
                            </div>

                            {!isNewGuest ? (
                                /* Вибір існуючого гостя */
                                <div className="relative">
                                    <span className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                        Пошук існуючого гостя
                                    </span>
                                    <div className="relative mt-1">
                                        <Search
                                            className="absolute left-3 top-3 text-slate-400"
                                            size={18}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Ім'я, пошта або телефон..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm"
                                            value={guestSearchTerm}
                                            onChange={(e) => {
                                                setGuestSearchTerm(e.target.value);
                                                setIsGuestDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsGuestDropdownOpen(true)}
                                        />
                                    </div>

                                    {/* Випадаючий список результатів */}
                                    {isGuestDropdownOpen && guestSearchTerm && (
                                        <div className="absolute z-[110] w-full mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-48 overflow-y-auto p-2 space-y-1">
                                            {filteredGuests.length > 0 ? (
                                                filteredGuests.map((g) => (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setAdminForm({
                                                                ...adminForm,
                                                                targetUserId: g.id.toString(),
                                                            });
                                                            setGuestSearchTerm(g.fullName);
                                                            setIsGuestDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left p-3 rounded-xl transition-colors flex flex-col ${
                                                            adminForm.targetUserId ===
                                                            g.id.toString()
                                                                ? 'bg-primary text-white'
                                                                : 'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <span className="font-bold text-sm">
                                                            {g.fullName}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] ${adminForm.targetUserId === g.id.toString() ? 'text-blue-100' : 'text-slate-400'}`}
                                                        >
                                                            {g.email} • {g.phone}
                                                        </span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase italic">
                                                    Нікого не знайдено
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Прихований інпут для валідації форми */}
                                    <input type="hidden" required value={adminForm.targetUserId} />
                                </div>
                            ) : (
                                /* Поля для нового гостя */
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    <input
                                        type="text"
                                        placeholder="ПІБ гостя"
                                        required
                                        className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                                        value={newGuestData.fullName}
                                        onChange={(e) =>
                                            setNewGuestData({
                                                ...newGuestData,
                                                fullName: e.target.value,
                                            })
                                        }
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            required
                                            className="p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-bold"
                                            value={newGuestData.email}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewGuestData({ ...newGuestData, email: val });

                                                // Перевірка на існуючого користувача
                                                const existing = guests.find(
                                                    (g) =>
                                                        g.email.toLowerCase() === val.toLowerCase(),
                                                );
                                                if (existing) {
                                                    setIsNewGuest(false); // Перемикаємо на "Існуючий клієнт"
                                                    setAdminForm({
                                                        ...adminForm,
                                                        targetUserId: existing.id.toString(),
                                                    });
                                                    setGuestSearchTerm(existing.fullName); // Заповнюємо пошукове поле його ім'ям
                                                }
                                            }}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Телефон (опціонально)"
                                            className="p-3 bg-slate-50 rounded-xl outline-none text-sm font-bold"
                                            value={newGuestData.phone}
                                            onChange={(e) =>
                                                setNewGuestData({
                                                    ...newGuestData,
                                                    phone: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Категорія */}
                            <label className="block">
                                <span className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                    Категорія
                                </span>
                                <select
                                    required
                                    disabled={!(adminForm.targetUserId || newGuestData.email)}
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm"
                                    value={selectedCategoryId}
                                    onChange={(e) => {
                                        setSelectedCategoryId(e.target.value);
                                        setAdminForm({ ...adminForm, roomId: '' }); // Скидаємо вибрану кімнату при зміні категорії
                                    }}
                                >
                                    <option value="">
                                        {adminForm.targetUserId || newGuestData.email
                                            ? 'Оберіть категорію...'
                                            : 'Спочатку оберіть гостя'}
                                    </option>
                                    {roomTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.basePrice} ₴)
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Номер */}
                            <label className="block">
                                <span className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                    Номер
                                </span>
                                <select
                                    required
                                    disabled={!selectedCategoryId}
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm disabled:opacity-50"
                                    value={adminForm.roomId}
                                    onChange={(e) =>
                                        setAdminForm({ ...adminForm, roomId: e.target.value })
                                    }
                                >
                                    <option value="">
                                        {selectedCategoryId
                                            ? 'Оберіть №...'
                                            : 'Спочатку оберіть категорію'}
                                    </option>
                                    {selectedCategoryId &&
                                        roomTypes
                                            .find((t) => t.id.toString() === selectedCategoryId)
                                            ?.rooms.map((r) => (
                                                <option
                                                    key={r.id}
                                                    value={r.id}
                                                    disabled={r.status !== 'AVAILABLE'}
                                                >
                                                    №{r.roomNumber}{' '}
                                                    {r.status !== 'AVAILABLE'
                                                        ? `(${r.status})`
                                                        : ''}
                                                </option>
                                            ))}
                                </select>
                            </label>

                            {/* Календар з перевіркою дат */}
                            <div className="relative">
                                <span className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                    Період проживання
                                </span>
                                <div className="relative mt-1">
                                    <Calendar
                                        className="absolute left-3 top-3 text-slate-400 z-10"
                                        size={18}
                                    />
                                    <DatePicker
                                        selectsRange={true}
                                        startDate={
                                            adminForm.checkIn ? new Date(adminForm.checkIn) : null
                                        }
                                        endDate={
                                            adminForm.checkOut ? new Date(adminForm.checkOut) : null
                                        }
                                        onChange={(update: [Date | null, Date | null]) => {
                                            const [start, end] = update;
                                            if (start && end) {
                                                const startStr = toLocalISOString(start);
                                                const endStr = toLocalISOString(end);
                                                if (startStr === endStr) {
                                                    setAdminForm({
                                                        ...adminForm,
                                                        checkIn: '',
                                                        checkOut: '',
                                                    });
                                                    return;
                                                }
                                                const isOverlapInside = adminTakenDates.some(
                                                    (period) => {
                                                        const pStart = toLocalISOString(
                                                            new Date(period.start),
                                                        );
                                                        const pEnd = toLocalISOString(
                                                            new Date(period.end),
                                                        );
                                                        return (
                                                            (pStart > startStr &&
                                                                pStart < endStr) ||
                                                            (pEnd > startStr && pEnd < endStr)
                                                        );
                                                    },
                                                );

                                                if (isOverlapInside) {
                                                    setAdminForm({
                                                        ...adminForm,
                                                        checkIn: '',
                                                        checkOut: '',
                                                    });
                                                    return;
                                                }
                                            }
                                            setAdminForm({
                                                ...adminForm,
                                                checkIn: toLocalISOString(start),
                                                checkOut: toLocalISOString(end),
                                            });
                                        }}
                                        minDate={new Date()}
                                        dayClassName={getAdminDayClassName}
                                        excludeDates={disabledDates}
                                        excludeDateIntervals={excludeIntervals}
                                        locale="uk"
                                        disabled={!adminForm.roomId}
                                        placeholderText={
                                            adminForm.roomId
                                                ? 'Оберіть дати...'
                                                : 'Оберіть номер для перевірки дат'
                                        }
                                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-sm font-bold ${!adminForm.roomId ? 'opacity-50' : ''}`}
                                    />
                                </div>
                                <div className="flex gap-4 mt-2 ml-1">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                                        <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></div>
                                        Зайнято
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                                        <div className="w-2.5 h-2.5 bg-white border border-slate-200 rounded-sm flex overflow-hidden">
                                            <div className="w-1/2 bg-slate-200"></div>
                                        </div>
                                        Заїзд / Виїзд
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                    Метод оплати
                                </span>
                                <div className="flex gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAdminForm({ ...adminForm, paymentMethod: 'CARD' })
                                        }
                                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all font-bold ${adminForm.paymentMethod === 'CARD' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        <CreditCard size={20} />{' '}
                                        <span className="text-[10px]">Зараз</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAdminForm({ ...adminForm, paymentMethod: 'CASH' })
                                        }
                                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all font-bold ${adminForm.paymentMethod === 'CASH' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        <Wallet size={20} />{' '}
                                        <span className="text-[10px]">При заселенні</span>
                                    </button>
                                </div>
                            </div>

                            <label className="block">
                                <span className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                    Побажання
                                </span>
                                <textarea
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary h-16 resize-none text-sm"
                                    value={adminForm.specialRequests}
                                    onChange={(e) =>
                                        setAdminForm({
                                            ...adminForm,
                                            specialRequests: e.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                            Створити бронювання
                        </button>
                    </form>
                </div>
            )}
        </main>
    );
};
