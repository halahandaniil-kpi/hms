import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import axios from 'axios';
import { Plus, Trash2, Edit3, X, Calendar, User, Home, CheckCircle } from 'lucide-react';

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

export const MaintenancePage = () => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ roomId: '', description: '', startDate: '', endDate: '' });

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
        fetchData();
    }, []);

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

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-xs font-black uppercase text-slate-400 ml-1">
                                        Дата початку
                                    </span>
                                    <input
                                        type="date"
                                        required
                                        className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary"
                                        value={form.startDate}
                                        onChange={(e) =>
                                            setForm({ ...form, startDate: e.target.value })
                                        }
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-black uppercase text-slate-400 ml-1">
                                        Дата завершення
                                    </span>
                                    <input
                                        type="date"
                                        className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary"
                                        value={form.endDate}
                                        onChange={(e) =>
                                            setForm({ ...form, endDate: e.target.value })
                                        }
                                    />
                                </label>
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
