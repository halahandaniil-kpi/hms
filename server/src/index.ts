import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/room.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Підключаємо роути
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Hotel Management System is working!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
