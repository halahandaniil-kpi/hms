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
    Star,
    ChevronLeft,
    ChevronRight,
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

interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    booking: {
        user: { fullName: string };
    };
}

interface PhysicalRoom {
    id: number;
    roomNumber: string;
    status: string;
}

interface RoomType {
    id: number;
    name: string;
    description: string;
    basePrice: string;
    capacity: number;
    bedType: { name: string };
    images: { url: string; isPrimary: boolean }[];
    amenities: { amenity: { name: string } }[];
    rooms: PhysicalRoom[];
    reviews?: Review[];
    averageRating?: number;
    reviewCount?: number;
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
    const [roomType, setRoomType] = useState<RoomType | null>(null);
    const [takenDates, setTakenDates] = useState<UnifiedDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [successType, setSuccessType] = useState<'CARD' | 'CASH' | null>(null);

    const [activeImgIndex, setActiveImgIndex] = useState(0);

    const [bookingData, setBookingData] = useState({
        roomId: '',
        checkIn: '',
        checkOut: '',
        specialRequests: '',
        paymentMethod: 'CARD',
    });

    const startDate = bookingData.checkIn ? new Date(bookingData.checkIn) : null;
    const endDate = bookingData.checkOut ? new Date(bookingData.checkOut) : null;

    let nights = 0;
    let totalPrice = 0;

    if (startDate && endDate && endDate > startDate && roomType) {
        nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalPrice = nights * Number(roomType.basePrice);
    }

    // Завантаження даних
    useEffect(() => {
        const fetchRoomType = async () => {
            try {
                const res = await api.get(`/rooms/types/${id}`);
                const data: RoomType = res.data;
                if (data.images) {
                    data.images.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
                }
                setRoomType(data);
                setActiveImgIndex(0);
            } catch (err) {
                console.error('Помилка завантаження категорії', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoomType();
    }, [id]);

    // Завантаження зайнятих дат, коли користувач обирає конкретну кімнату
    useEffect(() => {
        if (!bookingData.roomId) {
            return;
        }

        const fetchDates = async () => {
            try {
                const res = await api.get(`/bookings/room/${bookingData.roomId}/taken-dates`);
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
                setTakenDates([...formattedBookings, ...formattedMaintenance]);
            } catch (err) {
                console.error('Помилка завантаження дат', err);
            }
        };
        fetchDates();
        const interval = setInterval(fetchDates, 30000);
        return () => {
            clearInterval(interval);
        };
    }, [bookingData.roomId]);

    // Функції для гортання слайдера
    const nextImage = () => {
        if (!roomType) return;
        setActiveImgIndex((prev) => (prev + 1) % roomType.images.length);
    };

    const prevImage = () => {
        if (!roomType) return;
        setActiveImgIndex((prev) => (prev - 1 + roomType.images.length) % roomType.images.length);
    };

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

        const hasOverlap = takenDates.some((period) => {
            const pStart = new Date(period.start).getTime();
            const pEnd = new Date(period.end).getTime();
            const selStart = new Date(bookingData.checkIn).getTime();
            const selEnd = new Date(bookingData.checkOut).getTime();
            return selStart < pEnd && selEnd > pStart;
        });
        if (hasOverlap) {
            setError('Обраний період перетинається з існуючим бронюванням або ремонтом');
            return;
        }

        try {
            setError('');
            // Бронювання
            const bookingRes = await api.post('/bookings', {
                roomId: Number(bookingData.roomId),
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                specialRequests: bookingData.specialRequests,
            });

            // Оплата
            const bookingId = bookingRes.data.id;
            await api.post('/payments/pay', {
                bookingId: bookingId,
                paymentMethod: bookingData.paymentMethod,
            });
            if (bookingData.paymentMethod === 'CARD') {
                // Отримуємо параметри LiqPay для редіректу
                const liqpayRes = await api.post('/payments/liqpay-params', { bookingId });
                const { data, signature } = liqpayRes.data;

                // Створюємо динамічну форму для редіректу на LiqPay
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://www.liqpay.ua/api/3/checkout';
                form.acceptCharset = 'utf-8';

                // Поле Data
                const dataInput = document.createElement('input');
                dataInput.type = 'hidden';
                dataInput.name = 'data';
                dataInput.value = data;
                form.appendChild(dataInput);

                // Поле Signature
                const sigInput = document.createElement('input');
                sigInput.type = 'hidden';
                sigInput.name = 'signature';
                sigInput.value = signature;
                form.appendChild(sigInput);

                // Додаємо форму на сторінку та автоматично відправляємо
                document.body.appendChild(form);
                form.submit();
                // Браузер перейде на сайт LiqPay. Після оплати LiqPay поверне юзера на /bookings/my
            } else {
                // Якщо обрано оплату при заселенні
                setSuccess(true);
                setSuccessType('CASH');
                setTimeout(() => navigate('/bookings/my'), 3000);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Помилка при бронюванні');
            }
        }
    };

    const toLocalISOString = (date: Date | null) => {
        if (!date) return '';
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().split('T')[0];
    };

    // Функція для визначення класу кольору для кожного дня
    const getDayClassName = (date: Date) => {
        const dateStr = toLocalISOString(date);
        let isStart = false;
        let isEnd = false;
        let isBetween = false;

        takenDates.forEach((period) => {
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

        takenDates.forEach((period) => {
            const sStr = toLocalISOString(new Date(period.start));
            const eStr = toLocalISOString(new Date(period.end));

            // Блокуємо день, якщо він є заїздом і виїздом
            if (takenDates.some((other) => toLocalISOString(new Date(other.end)) === sStr)) {
                disabled.add(sStr);
            }
            if (takenDates.some((other) => toLocalISOString(new Date(other.start)) === eStr)) {
                disabled.add(eStr);
            }
        });

        return Array.from(disabled).map((dateStr) => new Date(dateStr));
    };
    const disabledDates = getDisabledDates();

    const excludeIntervals = takenDates
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

    const formatImageUrl = (url: string) => {
        if (!url)
            return 'https://www.ca.kayak.com/rimg/dimg/dynamic/186/2023/08/295ffd3a54bd51fc33810ce59382d1da.webp';
        // Якщо шлях починається з http - це зовнішнє посилання, повертаємо як є.
        // Якщо ні - додаємо адресу нашого бекенду.
        return url.startsWith('http') ? url : `http://localhost:5000${url}`;
    };

    if (loading)
        return (
            <div className="p-20 text-center animate-pulse font-bold text-primary">
                Завантаження деталей номера...
            </div>
        );
    if (!roomType) return <div className="p-20 text-center">Номер не знайдено</div>;

    const currentImageUrl = formatImageUrl(roomType.images[activeImgIndex]?.url);

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
                    {/* СЛАЙДЕР */}
                    <div className="relative group rounded-3xl overflow-hidden shadow-2xl mb-4 bg-slate-200 aspect-video">
                        <img
                            src={currentImageUrl}
                            className="w-full h-full object-cover transition-all duration-500"
                            alt={roomType.name}
                        />

                        {/* Стрілки (показуються при наведенні) */}
                        {roomType.images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <ChevronLeft size={24} className="text-slate-800" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <ChevronRight size={24} className="text-slate-800" />
                                </button>

                                {/* Індикатор кількості */}
                                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                    {activeImgIndex + 1} / {roomType.images.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* МІНІАТЮРИ ГАЛЕРЕЇ */}
                    {roomType.images.length > 1 && (
                        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                            {roomType.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImgIndex(idx)}
                                    className={`relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                        activeImgIndex === idx
                                            ? 'border-primary scale-105 shadow-md'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img
                                        src={formatImageUrl(img.url)}
                                        className="w-full h-full object-cover"
                                        alt="server asset"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    <h1 className="text-4xl font-black text-slate-900 mb-4">{roomType.name}</h1>

                    <div className="flex gap-6 mb-8 py-4 border-y border-slate-100 font-bold text-slate-600">
                        <span className="flex items-center gap-2">
                            <Users className="text-primary" size={24} /> {roomType.capacity} особи
                        </span>
                        <span className="flex items-center gap-2">
                            <BedDouble className="text-primary" size={24} /> {roomType.bedType.name}
                        </span>
                    </div>

                    <p className="text-slate-600 text-lg leading-relaxed mb-12">
                        {roomType.description}
                    </p>

                    <h3 className="text-2xl font-bold mb-6">Зручності номера</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                        {roomType.amenities.map((item, idx) => (
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
                    <div className="mt-12 pt-12 border-t border-slate-100">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            Відгуки гостей
                            <span className="text-sm font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                {roomType.reviews?.length || 0}
                            </span>
                        </h3>

                        {roomType.reviews && roomType.reviews.length > 0 ? (
                            <div className="space-y-6">
                                {roomType.reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="bg-slate-50 p-6 rounded-3xl border border-slate-100"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {review.booking.user.fullName}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(review.createdAt).toLocaleDateString(
                                                        'uk-UA',
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex text-yellow-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={
                                                            i < review.rating
                                                                ? 'currentColor'
                                                                : 'none'
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 italic">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-8 rounded-3xl text-center text-slate-400 border-2 border-dashed border-slate-200">
                                Для цього номера ще немає відгуків. Будьте першим!
                            </div>
                        )}
                    </div>
                </div>

                {/* ПРАВА ЧАСТИНА Форма */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-primary">
                                {roomType.basePrice} ₴
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
                                        <p>
                                            Менеджер зв'яжеться з вами для підтвердження бронювання.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl mb-2">🗓️ Заброньовано!</div>
                                        <p>
                                            Менеджер зв'яжеться з вами для підтвердження бронювання.
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

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                        Оберіть конкретний номер
                                    </label>
                                    <select
                                        required
                                        className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm mt-1"
                                        value={bookingData.roomId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setBookingData({ ...bookingData, roomId: val });
                                            if (!val) setTakenDates([]);
                                        }}
                                    >
                                        <option value="">Оберіть № кімнати...</option>
                                        {roomType.rooms.map((r) => (
                                            <option
                                                key={r.id}
                                                value={r.id}
                                                disabled={r.status !== 'AVAILABLE'}
                                            >
                                                №{r.roomNumber}{' '}
                                                {r.status !== 'AVAILABLE'
                                                    ? '(На обслуговуванні)'
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                            Період проживання
                                        </label>
                                        <div className="relative mt-1">
                                            <Calendar
                                                className="absolute left-3 top-3 text-slate-400 z-10"
                                                size={18}
                                            />
                                            <DatePicker
                                                disabled={!bookingData.roomId}
                                                selectsRange={true}
                                                startDate={startDate}
                                                endDate={endDate}
                                                onChange={(update: [Date | null, Date | null]) => {
                                                    const [start, end] = update;
                                                    if (start && end) {
                                                        const startStr = toLocalISOString(start);
                                                        const endStr = toLocalISOString(end);
                                                        if (startStr === endStr) {
                                                            setBookingData({
                                                                ...bookingData,
                                                                checkIn: '',
                                                                checkOut: '',
                                                            });
                                                            return;
                                                        }
                                                        const isOverlapInside = takenDates.some(
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
                                                                    (pEnd > startStr &&
                                                                        pEnd < endStr)
                                                                );
                                                            },
                                                        );

                                                        if (isOverlapInside) {
                                                            setBookingData({
                                                                ...bookingData,
                                                                checkIn: '',
                                                                checkOut: '',
                                                            });
                                                            return;
                                                        }
                                                    }
                                                    setBookingData({
                                                        ...bookingData,
                                                        checkIn: toLocalISOString(start),
                                                        checkOut: toLocalISOString(end),
                                                    });
                                                }}
                                                minDate={new Date()}
                                                dayClassName={getDayClassName}
                                                excludeDates={disabledDates}
                                                excludeDateIntervals={excludeIntervals}
                                                locale="uk"
                                                placeholderText={
                                                    bookingData.roomId
                                                        ? 'Оберіть дати...'
                                                        : 'Спочатку оберіть номер'
                                                }
                                                className={`w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-sm font-bold ${!bookingData.roomId ? 'opacity-50' : ''}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-1 ml-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            <div className="w-3 h-3 bg-slate-200 rounded-sm"></div>
                                            Номер зайнятий / Ремонт
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            <div className="w-3 h-3 bg-white border border-slate-200 rounded-sm flex overflow-hidden">
                                                <div className="w-1/2 bg-slate-200"></div>
                                            </div>
                                            Дні заїзду / виїзду
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
                                                {nights} ночей x {roomType.basePrice} ₴
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
                                    disabled={user ? user.role !== 'GUEST' : false}
                                    className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
                                        !user
                                            ? 'bg-primary text-white hover:bg-blue-700'
                                            : user.role === 'GUEST'
                                              ? 'bg-primary text-white hover:bg-blue-700'
                                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {!user
                                        ? 'Увійдіть для бронювання'
                                        : user.role === 'GUEST'
                                          ? bookingData.paymentMethod === 'CARD'
                                              ? 'Забронювати та оплатити'
                                              : 'Забронювати'
                                          : 'Бронювання доступне лише гостям'}
                                </button>
                                {user && user.role !== 'GUEST' && (
                                    <p className="mt-4 text-[11px] text-center text-orange-500 font-bold uppercase tracking-wider">
                                        Ви увійшли як персонал. Для створення бронювання від імені
                                        клієнта використовуйте адмін-панель.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
