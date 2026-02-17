import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import axios from 'axios';
import { User, Mail, Phone, Save, CheckCircle } from 'lucide-react';

export const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await api.patch('/auth/update-me', formData);
            updateUser(res.data); // Оновлюємо глобальний стан
            setStatus({ type: 'success', msg: 'Дані успішно оновлено!' });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setStatus({
                    type: 'error',
                    msg: err.response?.data?.message || 'Помилка оновлення',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">
                Мій профіль
            </h1>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-primary p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user?.fullName}</h2>
                            <p className="text-blue-100 text-sm">
                                Керуйте вашими персональними даними
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {status && (
                        <div
                            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in duration-300 ${
                                status.type === 'success'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {status.type === 'success' && <CheckCircle size={18} />}
                            {status.msg}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                Повне ім'я
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm"
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, fullName: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                Електронна пошта
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-300" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                Телефон
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-slate-300" size={18} />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-primary font-bold text-sm"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            'Оновлення...'
                        ) : (
                            <>
                                <Save size={20} /> Зберегти зміни
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
};
