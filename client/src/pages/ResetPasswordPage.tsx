import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import axios from 'axios';
import { Lock, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus({ type: 'error', msg: 'Паролі не збігаються' });
            return;
        }

        if (!token) {
            setStatus({
                type: 'error',
                msg: 'Токен відновлення відсутній. Почніть процедуру заново.',
            });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            setStatus({
                type: 'success',
                msg: 'Пароль успішно змінено! Зараз ми перенаправимо вас на сторінку входу.',
            });

            // Автоматичний перехід через 3 секунди
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setStatus({
                    type: 'error',
                    msg: err.response?.data?.message || 'Помилка при зміні пароля',
                });
            } else {
                setStatus({ type: 'error', msg: 'Виникла непередбачувана помилка' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-primary rounded-2xl mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                        Новий пароль
                    </h2>
                    <p className="text-slate-500 mt-2">
                        Будь ласка, встановіть новий надійний пароль для вашого акаунта.
                    </p>
                </div>

                {status && (
                    <div
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in duration-300 ${
                            status.type === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                        }`}
                    >
                        {status.type === 'success' && <CheckCircle size={18} />}
                        {status.msg}
                    </div>
                )}

                {!token ? (
                    <div className="text-center py-4">
                        <p className="text-red-500 font-bold mb-6">
                            Посилання недійсне або пошкоджене.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="text-primary font-black uppercase text-xs hover:underline"
                        >
                            Запитати нове посилання
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">
                                Новий пароль
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={20}
                                />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">
                                Підтвердьте пароль
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={20}
                                />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || status?.type === 'success'}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-50"
                        >
                            {loading ? 'Оновлення...' : 'Зберегти новий пароль'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-primary text-xs font-bold transition-colors"
                    >
                        <ArrowLeft size={14} /> Скасувати та повернутися
                    </Link>
                </div>
            </div>
        </div>
    );
};
