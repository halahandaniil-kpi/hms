import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import axios from 'axios';
import { User, Mail, Phone, Save, CheckCircle, Lock, ShieldAlert } from 'lucide-react';

export const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [passData, setPassData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(
        null,
    );

    const handleSubmitProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await api.patch('/auth/update-me', formData);
            updateUser(res.data);
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

    const handleSubmitPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.newPassword.length < 6) {
            setPassStatus({ type: 'error', msg: 'Новий пароль занадто короткий (мін. 6 симв.)' });
            return;
        }
        if (passData.newPassword !== passData.confirmPassword) {
            setPassStatus({ type: 'error', msg: 'Нові паролі не збігаються' });
            return;
        }

        setLoading(true);
        setPassStatus(null);
        try {
            await api.patch('/auth/change-password', {
                oldPassword: passData.oldPassword,
                newPassword: passData.newPassword,
            });
            setPassStatus({ type: 'success', msg: 'Пароль успішно змінено!' });
            setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setPassStatus({ type: 'error', msg: err.response?.data?.message || 'Помилка' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                Мій профіль
            </h1>

            {/* ОСОБИСТІ ДАНІ */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-primary p-6 text-white flex items-center gap-4">
                    <User size={24} />
                    <h2 className="font-bold uppercase tracking-widest text-sm">
                        Особиста інформація
                    </h2>
                </div>

                <form onSubmit={handleSubmitProfile} className="p-8 space-y-6">
                    {status && (
                        <div
                            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                            {status.type === 'success' ? (
                                <CheckCircle size={18} />
                            ) : (
                                <ShieldAlert size={18} />
                            )}
                            {status.msg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                Повне ім'я
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold text-sm"
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, fullName: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-3 text-slate-300"
                                        size={18}
                                    />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold text-sm"
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
                                    <Phone
                                        className="absolute left-3 top-3 text-slate-300"
                                        size={18}
                                    />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full pl-10 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold text-sm"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} /> Зберегти профіль
                    </button>
                </form>
            </div>

            {/* ЗМІНА ПАРОЛЯ */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
                    <Lock size={24} />
                    <h2 className="font-bold uppercase tracking-widest text-sm">Зміна пароля</h2>
                </div>

                <form onSubmit={handleSubmitPassword} className="p-8 space-y-6">
                    {passStatus && (
                        <div
                            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in ${passStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                            {passStatus.type === 'success' ? (
                                <CheckCircle size={18} />
                            ) : (
                                <ShieldAlert size={18} />
                            )}
                            {passStatus.msg}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                Поточний пароль
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-slate-900 font-bold text-sm"
                                value={passData.oldPassword}
                                onChange={(e) =>
                                    setPassData({ ...passData, oldPassword: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                    Новий пароль
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-slate-900 font-bold text-sm"
                                    value={passData.newPassword}
                                    onChange={(e) =>
                                        setPassData({ ...passData, newPassword: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                                    Підтвердження
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-slate-900 font-bold text-sm"
                                    value={passData.confirmPassword}
                                    onChange={(e) =>
                                        setPassData({
                                            ...passData,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Оновити пароль
                    </button>
                </form>
            </div>
        </main>
    );
};
