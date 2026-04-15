import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import axios from 'axios';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            return setError('Пароль має бути не менше 6 символів');
        }
        if (!/^\+?[0-9]{10,15}$/.test(formData.phone)) {
            return setError('Введіть коректний номер телефону (напр. +380...)');
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/register', formData);
            const { user, accessToken, refreshToken } = res.data;
            login(user, accessToken, refreshToken);

            // Зберігаємо refresh токен
            if (res.data.refreshToken) {
                localStorage.setItem('refreshToken', res.data.refreshToken);
            }

            // Перенаправляємо одразу на головну
            navigate('/');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Помилка при реєстрації');
            } else {
                setError('Виникла непередбачувана помилка');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-primary rounded-2xl mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Створити акаунт</h2>
                    <p className="text-slate-500 mt-2">Станьте гостем Grand Reserve вже сьогодні</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                    {/* ПІБ */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Повне ім'я
                        </label>
                        <div className="relative">
                            <User
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={20}
                            />
                            <input
                                type="text"
                                name="fullName"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Іван Петров"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Телефон */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Номер телефону
                        </label>
                        <div className="relative">
                            <Phone
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={20}
                            />
                            <input
                                type="tel"
                                name="phone"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="+380 99 123 45 67"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Email адреса
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={20}
                            />
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="example@mail.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Пароль */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Пароль
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={20}
                            />
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transform transition-active active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Створення...' : 'Зареєструватися'}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-600 text-sm">
                    Вже маєте акаунт?{' '}
                    <Link to="/login" className="text-primary font-bold hover:underline">
                        Увійти
                    </Link>
                </p>
            </div>
        </div>
    );
};
