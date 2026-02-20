import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import axios from 'axios';
import { Plus, Trash2, Edit3, X, Calendar, User, Home, CheckCircle } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { uk } from 'date-fns/locale';
registerLocale('uk', uk as unknown as import('date-fns').Locale);

interface UnifiedDate {
    start: Date;
    end: Date;
    type: 'booking' | 'maintenance';
}

interface MaintenanceLog {
    id: number;
    description: string;
    startDate: string;
    endDate: string | null;
    roomId: number;
    room: { roomNumber: string };
    staff: { fullName: string };
}

interface RoomOption {
    id: number;
    roomNumber: string;
}

interface ApiBooking {
    checkInDate: string;
    checkOutDate: string;
}

interface ApiMaintenance {
    startDate: string;
    endDate: string | null;
}

export const MaintenancePage = () => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ roomId: '', description: '', startDate: '', endDate: '' });

    const [takenDates, setTakenDates] = useState<UnifiedDate[]>([]);

    const fetchData = async () => {
        try {
            const [logsRes, roomsRes] = await Promise.all([
                api.get('/rooms/meta/maintenance'),
                api.get('/rooms'),
            ]);
            setLogs(logsRes.data);
            setRooms(roomsRes.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadRoomDates = async () => {
            if (!form.roomId || !isAdding) {
                setTakenDates([]);
                return;
            }
            try {
                const res = await api.get(`/bookings/room/${form.roomId}/taken-dates`);
                const formattedBookings: UnifiedDate[] = res.data.bookings.map((b: ApiBooking) => ({
                    start: new Date(b.checkInDate),
                    end: new Date(b.checkOutDate),
                    type: 'booking',
                }));
                const formattedMaintenance: UnifiedDate[] = res.data.maintenance.map(
                    (m: ApiMaintenance) => ({
                        start: new Date(m.startDate),
                        end: new Date(m.endDate || Date.now() + 31536000000),
                        type: 'maintenance',
                    }),
                );
                setTakenDates([...formattedBookings, ...formattedMaintenance]);
            } catch (err) {
                console.error('Помилка завантаження дат', err);
            }
        };

        loadRoomDates();
        fetchData();
    }, [form.roomId, isAdding]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/rooms/meta/maintenance/${editingId}`, form);
            } else {
                await api.post('/rooms/meta/maintenance', form);
            }
            setIsAdding(false);
            setEditingId(null);
            setForm({ roomId: '', description: '', startDate: '', endDate: '' });
            setTakenDates([]);
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) alert(err.response?.data?.message || 'Помилка');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Видалити цей запис?')) return;
        try {
            await api.delete(`/rooms/meta/maintenance/${id}`);
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) alert(err.response?.data?.message || 'Помилка видалення');
        }
    };

    const getDayClassName = (date: Date) => {
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
            <div className="p-20 text-center font-black animate-pulse text-primary uppercase">
                Завантаження журналу...
            </div>
        );

    return (
        <main className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-uppercase">
                        Журнал обслуговування
                    </h1>
                    <p className="text-slate-400 font-bold text-sm">
                        Керування ремонтами та технічним станом номерів
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                    }}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus size={18} /> Додати роботу
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSave}
                        className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">
                                {editingId ? 'Редагувати запис' : 'Нова технічна робота'}
                            </h3>
                            <button type="button" onClick={() => setIsAdding(false)}>
                                <X />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-xs font-black uppercase text-slate-400 ml-1">
                                    Вибір номера
                                </span>
                                <select
                                    required
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary"
                                    value={form.roomId}
                                    onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                                >
                                    <option value="">Оберіть номер...</option>
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            Номер №{r.roomNumber}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-xs font-black uppercase text-slate-400 ml-1">
                                    Опис проблеми/робіт
                                </span>
                                <textarea
                                    required
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary h-24 resize-none"
                                    placeholder="Наприклад: Заміна змішувача, ремонт кондиціонера..."
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                />
                            </label>

                            <div className="col-span-full">
                                <span className="text-xs font-black uppercase text-slate-400 ml-1">
                                    Період проведення робіт
                                </span>
                                <div className="relative mt-1">
                                    <Calendar
                                        className="absolute left-3 top-3 text-slate-400 z-10"
                                        size={18}
                                    />
                                    <DatePicker
                                        selectsRange={true}
                                        startDate={form.startDate ? new Date(form.startDate) : null}
                                        endDate={form.endDate ? new Date(form.endDate) : null}
                                        onChange={(update: [Date | null, Date | null]) => {
                                            const [start, end] = update;
                                            setForm({
                                                ...form,
                                                startDate: start
                                                    ? start.toISOString().split('T')[0]
                                                    : '',
                                                endDate: end ? end.toISOString().split('T')[0] : '',
                                            });
                                        }}
                                        dayClassName={getDayClassName}
                                        locale="uk"
                                        disabled={!form.roomId}
                                        placeholderText={
                                            form.roomId
                                                ? 'Оберіть дати робіт...'
                                                : 'Спочатку оберіть номер'
                                        }
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-sm font-bold"
                                    />
                                </div>

                                <div className="flex gap-4 mt-2 ml-1">
                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>{' '}
                                        Гість у номері
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>{' '}
                                        Інший ремонт
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                            Зберегти у журналі
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-primary/30 transition-all"
                    >
                        <div className="flex gap-6 items-center">
                            <div
                                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${log.endDate ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600 animate-pulse'}`}
                            >
                                <Home size={16} />
                                <span className="text-lg">{log.room.roomNumber}</span>
                            </div>
                            <div>
                                <div className="font-black text-slate-800 text-lg">
                                    {log.description}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                        <Calendar size={12} />{' '}
                                        {new Date(log.startDate).toLocaleDateString()} —{' '}
                                        {log.endDate
                                            ? new Date(log.endDate).toLocaleDateString()
                                            : 'В ПРОЦЕСІ'}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 border-l pl-4">
                                        <User size={12} /> {log.staff.fullName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setEditingId(log.id);
                                    setForm({
                                        roomId: log.roomId.toString(),
                                        description: log.description,
                                        startDate: log.startDate.split('T')[0],
                                        endDate: log.endDate?.split('T')[0] || '',
                                    });
                                    setIsAdding(true);
                                }}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-colors"
                            >
                                <Edit3 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(log.id)}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">
                            Усі номери в ідеальному стані
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
};
