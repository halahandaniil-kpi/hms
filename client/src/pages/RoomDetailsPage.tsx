import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    BedDouble,
    Users,
    CheckCircle2,
    Calendar,
    MessageSquare,
    ArrowLeft,
    CreditCard,
    Wallet,
    AlertCircle,
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

interface Room {
    id: number;
    roomNumber: string;
    roomType: {
        name: string;
        basePrice: string;
        description: string;
        capacity: number;
        bedType: string;
        images: { url: string }[];
        amenities: { amenity: { name: string } }[];
    };
}

interface ApiBooking {
    checkInDate: string;
    checkOutDate: string;
}

interface ApiMaintenance {
    startDate: string;
    endDate: string | null;
}

export const RoomDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    const [room, setRoom] = useState<Room | null>(null);
    const [takenDates, setTakenDates] = useState<UnifiedDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [successType, setSuccessType] = useState<'CARD' | 'CASH' | null>(null);

    const [bookingData, setBookingData] = useState({
        checkIn: '',
        checkOut: '',
        specialRequests: '',
        paymentMethod: 'CARD',
    });

    const startDate = bookingData.checkIn ? new Date(bookingData.checkIn) : null;
    const endDate = bookingData.checkOut ? new Date(bookingData.checkOut) : null;

    let nights = 0;
    let totalPrice = 0;

    if (startDate && endDate && endDate > startDate && room) {
        nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalPrice = nights * Number(room.roomType.basePrice);
    }

    // Завантаження даних
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roomRes, datesRes] = await Promise.all([
                    api.get(`/rooms/${id}`),
                    api.get(`/bookings/room/${id}/taken-dates`),
                ]);

                setRoom(roomRes.data);
                // Перетворюємо різні формати бази в один формат для фронтенду
                const formattedBookings: UnifiedDate[] = datesRes.data.bookings.map(
                    (b: ApiBooking) => ({
                        start: new Date(b.checkInDate),
                        end: new Date(b.checkOutDate),
                        type: 'booking',
                    }),
                );

                const formattedMaintenance: UnifiedDate[] = datesRes.data.maintenance.map(
                    (m: ApiMaintenance) => ({
                        start: new Date(m.startDate),
                        end: new Date(m.endDate || Date.now() + 31536000000), // якщо endDate null, ставимо +1 рік
                        type: 'maintenance',
                    }),
                );

                setTakenDates([...formattedBookings, ...formattedMaintenance]);
            } catch (err: unknown) {
                console.error('Помилка завантаження', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleBookingAndPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (!bookingData.checkIn || !bookingData.checkOut) {
            setError('Будь ласка, оберіть період проживання на календарі');
            return;
        }

        try {
            setError('');
            // Бронювання
            const bookingRes = await api.post('/bookings', {
                roomId: Number(id),
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                specialRequests: bookingData.specialRequests,
            });

            // Оплата
            await api.post('/payments/pay', {
                bookingId: bookingRes.data.id,
                paymentMethod: bookingData.paymentMethod,
                transactionId:
                    bookingData.paymentMethod === 'CARD' ? `SIM_TXN_${Date.now()}` : undefined,
            });

            setSuccess(true);
            setSuccessType(bookingData.paymentMethod as 'CARD' | 'CASH');
            setTimeout(() => navigate('/'), 3000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Помилка при бронюванні');
            }
        }
    };

    // Функція для визначення класу кольору для кожного дня
    const getDayClassName = (date: Date) => {
        // Обнуляємо час для точного порівняння дат
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        for (const period of takenDates) {
            const start = new Date(period.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(period.end);
            end.setHours(0, 0, 0, 0);

            if (checkDate >= start && checkDate <= end) {
                return period.type === 'maintenance' ? 'date-maintenance' : 'date-occupied';
            }
        }
        return '';
    };

    if (loading)
        return (
            <div className="p-20 text-center animate-pulse font-bold text-primary">
                Завантаження деталей номера...
            </div>
        );
    if (!room) return <div className="p-20 text-center">Номер не знайдено</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 transition-colors font-bold"
            >
                <ArrowLeft size={20} /> Назад до списку
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* ЛІВА ЧАСТИНА */}
                <div className="lg:col-span-2">
                    <div className="rounded-3xl overflow-hidden shadow-2xl mb-8 bg-slate-200 aspect-video">
                        <img
                            src={
                                room.roomType.images[0]?.url ||
                                'https://images.unsplash.com/photo-1590490360182-c33d57733427'
                            }
                            className="w-full h-full object-cover"
                            alt={room.roomType.name}
                        />
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 mb-4">
                        {room.roomType.name}
                    </h1>

                    <div className="flex gap-6 mb-8 py-4 border-y border-slate-100 font-bold text-slate-600">
                        <span className="flex items-center gap-2">
                            <Users className="text-primary" size={24} /> {room.roomType.capacity}{' '}
                            особи
                        </span>
                        <span className="flex items-center gap-2">
                            <BedDouble className="text-primary" size={24} /> {room.roomType.bedType}
                        </span>
                    </div>

                    <p className="text-slate-600 text-lg leading-relaxed mb-12">
                        {room.roomType.description}
                    </p>

                    <h3 className="text-2xl font-bold mb-6">Зручності номера</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                        {room.roomType.amenities.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                            >
                                <CheckCircle2 className="text-green-500" size={20} />
                                <span className="font-semibold text-slate-700">
                                    {item.amenity.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ПРАВА ЧАСТИНА Форма */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-primary">
                                {room.roomType.basePrice} ₴
                            </span>
                            <span className="text-slate-400 font-bold">/ ніч</span>
                        </div>

                        {success ? (
                            <div
                                className={`p-6 rounded-2xl text-center font-bold animate-in zoom-in duration-300 ${
                                    successType === 'CARD'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-blue-50 text-blue-700'
                                }`}
                            >
                                {successType === 'CARD' ? (
                                    <>
                                        <div className="text-2xl mb-2">💳 Оплата успішна!</div>
                                        <p>Ваше бронювання підтверджено. Чекаємо на вас!</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl mb-2">🗓️ Заброньовано!</div>
                                        <p>
                                            Ми чекаємо на вас. Оплату можна здійснити при заселенні
                                            на ресепшині.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleBookingAndPayment} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                            Період проживання
                                        </label>
                                        <div className="relative flex gap-2">
                                            <div className="relative w-full">
                                                <Calendar
                                                    className="absolute left-3 top-3 text-slate-400 z-10"
                                                    size={18}
                                                />
                                                <DatePicker
                                                    selectsRange={true}
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    onChange={(
                                                        update: [Date | null, Date | null],
                                                    ) => {
                                                        const [start, end] = update;
                                                        setBookingData({
                                                            ...bookingData,
                                                            checkIn: start
                                                                ? start.toISOString().split('T')[0]
                                                                : '',
                                                            checkOut: end
                                                                ? end.toISOString().split('T')[0]
                                                                : '',
                                                        });
                                                    }}
                                                    minDate={new Date()}
                                                    dayClassName={getDayClassName}
                                                    locale="uk"
                                                    placeholderText="Оберіть дати заїзду та виїзду"
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-sm font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Легенда кольорів */}
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>{' '}
                                            Зайнято
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>{' '}
                                            Обслуговування
                                        </div>
                                    </div>
                                </div>

                                {/* Вибір оплати */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                        Спосіб оплати
                                    </label>
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setBookingData({
                                                    ...bookingData,
                                                    paymentMethod: 'CARD',
                                                })
                                            }
                                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all font-bold ${bookingData.paymentMethod === 'CARD' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            <CreditCard size={20} />
                                            <span className="text-[10px]">Оплатити зараз</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setBookingData({
                                                    ...bookingData,
                                                    paymentMethod: 'CASH',
                                                })
                                            }
                                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all font-bold ${bookingData.paymentMethod === 'CASH' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            <Wallet size={20} />
                                            <span className="text-[10px]">При заселенні</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                        Побажання
                                    </label>
                                    <div className="relative">
                                        <MessageSquare
                                            className="absolute left-3 top-3 text-slate-400"
                                            size={18}
                                        />
                                        <textarea
                                            placeholder="Тихий номер, додаткові рушники..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary h-20 resize-none text-sm"
                                            value={bookingData.specialRequests}
                                            onChange={(e) =>
                                                setBookingData({
                                                    ...bookingData,
                                                    specialRequests: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                {nights > 0 && (
                                    <div className="p-4 bg-slate-900 rounded-2xl text-white">
                                        <div className="flex justify-between text-xs opacity-60 mb-1">
                                            <span>
                                                {nights} ночей x {room.roomType.basePrice} ₴
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Разом:</span>
                                            <span className="text-blue-400">{totalPrice} ₴</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    {user
                                        ? bookingData.paymentMethod === 'CARD'
                                            ? 'Оплатити та забронювати'
                                            : 'Забронювати'
                                        : 'Увійдіть для бронювання'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
