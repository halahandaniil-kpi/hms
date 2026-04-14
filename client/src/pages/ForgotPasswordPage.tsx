import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import axios from 'axios';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Помилка при запиті');
            } else {
                setError('Виникла непередбачувана помилка');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-10">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-8 text-sm font-bold transition-colors"
                >
                    <ArrowLeft size={16} /> Повернутися до входу
                </Link>

                {!submitted ? (
                    <>
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-primary rounded-2xl mb-4">
                                <Send size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                Забули пароль?
                            </h2>
                            <p className="text-slate-500 mt-2">
                                Введіть вашу електронну пошту, і ми надішлемо вам посилання для
                                зміни пароля.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">
                                    Email адреса
                                </label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                        size={20}
                                    />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-50"
                            >
                                {loading ? 'Надсилаємо...' : 'Надіслати інструкції'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4 animate-in zoom-in duration-300">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 text-green-500 rounded-full mb-6">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                            Перевірте пошту
                        </h2>
                        <p className="text-slate-500 mb-8">
                            Якщо акаунт з адресою{' '}
                            <span className="font-bold text-slate-900">{email}</span> існує, ви
                            отримаєте лист із посиланням на зміну пароля.
                        </p>
                        <p className="text-xs text-slate-400 italic">
                            Не отримали лист? Перевірте папку "Спам" або спробуйте ще раз через 15
                            хвилин.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
