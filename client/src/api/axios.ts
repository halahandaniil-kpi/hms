import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Адреса бекенду
});

// Middleware для axios: додаємо токен перед кожним запитом
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Обробка помилки 401 (Оновлення токена)
api.interceptors.response.use(
    (response) => response, // Якщо все ок - просто повертаємо відповідь
    async (error) => {
        const originalRequest = error.config;

        // Якщо помилка 401, але це запит на LOGIN або REGISTER - нічого не робимо,
        // просто прокидаємо помилку далі в компонент сторінки.
        const isAuthPath =
            originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/register');

        // Якщо помилка 401 і ми ще не пробували оновити токен
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                // Робимо запит на оновлення
                const res = await axios.post('http://localhost:5000/api/auth/refresh', {
                    refreshToken,
                });

                const { accessToken } = res.data;

                // Зберігаємо новий токен
                localStorage.setItem('token', accessToken);

                // Оновлюємо заголовок у початковому запиті і повторюємо його
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Якщо рефреш не вдався - розлогінюємо користувача
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                // Тільки якщо ми НЕ на сторінці логіну, перекидаємо туди
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
