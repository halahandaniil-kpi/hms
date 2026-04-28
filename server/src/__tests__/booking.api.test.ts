import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bookingRoutes from '../routes/booking.routes.js';
import prisma from '../lib/prisma.js';

// Створюємо тимчасовий додаток для тесту
const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

describe('Booking API - Integration Tests', () => {
    it('GET /api/bookings/room/1/taken-dates should return dates', async () => {
        jest.spyOn(prisma.booking, 'findMany').mockResolvedValue([]);
        jest.spyOn(prisma.maintenanceLog, 'findMany').mockResolvedValue([]);

        const res = await request(app).get('/api/bookings/room/1/taken-dates');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('bookings');
        expect(res.body).toHaveProperty('maintenance');
    });
});
