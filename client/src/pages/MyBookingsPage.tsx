import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import axios from 'axios';
import {
    Calendar,
    MapPin,
    CreditCard,
    Star,
    MessageSquare,
    XCircle,
    Info,
    CheckCircle,
} from 'lucide-react';

interface Booking {
    id: number;
    checkInDate: string;
    checkOutDate: string;
    totalPrice: string;
    status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
    room: {
        roomNumber: string;
        roomType: {
            name: string;
            images: { url: string; isPrimary: boolean }[];
        };
    };
    payment?: { status: string; paymentMethod: string };
    review?: { id: number; rating: number };
}

export const MyBookingsPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState<{
        id: number | null;
        rating: number;
        comment: string;
    }>({
        id: null,
        rating: 5,
        comment: '',
    });

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings/my');
            setBookings(res.data);
        } catch (err) {
            console.error('Помилка завантаження бронювань', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBookings();
    }, []);

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/bookings/review', {
                bookingId: reviewForm.id,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            setReviewForm({ id: null, rating: 5, comment: '' });
            fetchBookings(); // Оновлюємо список
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка відправки відгуку');
            } else {
                alert('Виникла непередбачувана помилка');
            }
        }
    };

    const handleCancel = async (bookingId: number) => {
        if (!window.confirm('Ви впевнені, що хочете скасувати це бронювання?')) return;

        try {
            await api.patch(`/bookings/${bookingId}/cancel`);
            fetchBookings();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка скасування');
            } else {
                alert('Виникла непередбачувана помилка');
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
            PENDING: 'Очікує підтвердження',
            CONFIRMED: 'Підтверджено',
            CHECKED_IN: 'Ви проживаєте',
            CHECKED_OUT: 'Завершено',
            CANCELLED: 'Скасовано',
        };

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${styles[status as keyof typeof styles]}`}
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

    const handleOnlinePayment = async (bookingId: number) => {
        try {
            const res = await api.post('/payments/liqpay-params', { bookingId });
            const { data, signature } = res.data;

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
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка ініціалізації оплати');
            }
        }
    };

    if (loading)
        return (
            <div className="p-20 text-center animate-pulse font-bold text-primary">
                Завантаження ваших поїздок...
            </div>
        );

    return (
        <main className="max-w-5xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-black text-slate-900 mb-10">Мої бронювання</h1>

            {bookings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">У вас ще немає бронювань</p>
                    <a
                        href="/"
                        className="text-primary hover:underline mt-2 inline-block font-bold"
                    >
                        Забронювати перший номер
                    </a>
                </div>
            ) : (
                <div className="space-y-6">
                    {bookings.map((booking) => (
                        <div
                            key={booking.id}
                            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row items-stretch"
                        >
                            <div className="w-full md:w-64 min-h-[12rem] md:h-auto bg-slate-200 flex-shrink-0 relative">
                                <img
                                    src={
                                        booking.room.roomType.images.find((i) => i.isPrimary)
                                            ?.url ||
                                        'https://www.ca.kayak.com/rimg/dimg/dynamic/186/2023/08/295ffd3a54bd51fc33810ce59382d1da.webp'
                                    }
                                    className="w-full h-full object-cover"
                                    alt="room"
                                />
                            </div>

                            <div className="p-6 flex-grow flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-black text-slate-900">
                                            {booking.room.roomType.name}
                                        </h3>
                                        {getStatusBadge(booking.status)}
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-bold mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={16} />{' '}
                                            {new Date(booking.checkInDate).toLocaleDateString()} —{' '}
                                            {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={16} /> Номер №{booking.room.roomNumber}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={18} className="text-slate-400" />
                                            <span className="text-lg font-black text-primary">
                                                {booking.totalPrice} ₴
                                            </span>
                                        </div>
                                        {booking.payment &&
                                            getPaymentStatusBadge(booking.payment.status)}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                                        {/* КНОПКА ОПЛАТИ ОНЛАЙН */}
                                        {booking.status !== 'CANCELLED' &&
                                            booking.payment?.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleOnlinePayment(booking.id)}
                                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                >
                                                    <CreditCard size={16} /> Оплатити онлайн
                                                </button>
                                            )}

                                        {/* ЛОГІКА ВІДГУКУ */}
                                        {booking.status === 'CHECKED_OUT' && !booking.review && (
                                            <button
                                                onClick={() =>
                                                    setReviewForm({ ...reviewForm, id: booking.id })
                                                }
                                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                                            >
                                                <MessageSquare size={16} /> Залишити відгук
                                            </button>
                                        )}

                                        {booking.review && (
                                            <div className="flex items-center gap-1 text-yellow-500 font-black">
                                                <Star size={16} fill="currentColor" />{' '}
                                                {booking.review.rating}/5
                                            </div>
                                        )}

                                        {/* СКАСУВАННЯ БРОНЮВАННЯ */}
                                        {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
                                            >
                                                <XCircle size={16} /> Скасувати
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ПОВІДОМЛЕННЯ ПРО ПОВЕРНЕННЯ КОШТІВ */}
                                {booking.status === 'CANCELLED' &&
                                    booking.payment?.status === 'COMPLETED' && (
                                        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-[11px] font-bold border border-purple-100 animate-pulse">
                                            <Info size={14} className="flex-shrink-0" />
                                            <span>
                                                Ваше бронювання скасовано, але оплата була
                                                підтверджена. Будь ласка, очікуйте на повернення
                                                коштів адміністратором.
                                            </span>
                                        </div>
                                    )}
                                {booking.payment?.status === 'REFUNDED' && (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[11px] font-bold border border-green-100">
                                        <CheckCircle size={14} className="flex-shrink-0" />
                                        <span>Кошти за це бронювання були успішно повернуті.</span>
                                    </div>
                                )}

                                {/* ФОРМА ВІДГУКУ */}
                                {reviewForm.id === booking.id && (
                                    <form
                                        onSubmit={submitReview}
                                        className="mt-6 p-6 bg-slate-50 rounded-2xl animate-in slide-in-from-top-4 duration-300"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-black text-slate-800">
                                                Ваша оцінка:
                                            </h4>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() =>
                                                            setReviewForm({
                                                                ...reviewForm,
                                                                rating: star,
                                                            })
                                                        }
                                                    >
                                                        <Star
                                                            size={24}
                                                            fill={
                                                                star <= reviewForm.rating
                                                                    ? '#eab308'
                                                                    : 'none'
                                                            }
                                                            className={
                                                                star <= reviewForm.rating
                                                                    ? 'text-yellow-500'
                                                                    : 'text-slate-300'
                                                            }
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            required
                                            placeholder="Поділіться вашими враженнями від проживання..."
                                            className="w-full p-4 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none text-sm h-24 mb-4"
                                            value={reviewForm.comment}
                                            onChange={(e) =>
                                                setReviewForm({
                                                    ...reviewForm,
                                                    comment: e.target.value,
                                                })
                                            }
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm"
                                            >
                                                Надіслати
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setReviewForm({
                                                        id: null,
                                                        rating: 5,
                                                        comment: '',
                                                    })
                                                }
                                                className="text-slate-400 font-bold text-sm px-4"
                                            >
                                                Скасувати
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};
