import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as BookingService from '../services/booking.service.js';
import prisma from '../lib/prisma.js';

describe('BookingService - Unit Tests', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should calculate total price and create a booking if dates are free', async () => {
        // Створюємо шпигунів (spies) для методів Prisma
        const findUniqueSpy = jest.spyOn(prisma.room, 'findUnique');
        const findFirstBookingSpy = jest.spyOn(prisma.booking, 'findFirst');
        const findFirstMaintSpy = jest.spyOn(prisma.maintenanceLog, 'findFirst');
        const createSpy = jest.spyOn(prisma.booking, 'create');

        // 2Налаштовуємо їхні відповіді (використовуємо 'as any' для лаконічності типів)
        findUniqueSpy.mockResolvedValue({
            id: 1,
            roomNumber: '101',
            roomType: { basePrice: 1000 },
        } as any);

        findFirstBookingSpy.mockResolvedValue(null); // Перетинів з бронью немає
        findFirstMaintSpy.mockResolvedValue(null); // Перетинів з ремонтом немає
        createSpy.mockResolvedValue({ id: 10 } as any);

        // Викликаємо сервіс
        await BookingService.createBooking(1, 1, '2025-10-10', '2025-10-12');

        // Перевіряємо логіку (2 ночі * 1000 = 2000)
        expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    totalPrice: 2000,
                }),
            }),
        );
    });

    it('should throw error if check-out is before check-in', async () => {
        await expect(
            BookingService.createBooking(1, 1, '2025-10-15', '2025-10-10'),
        ).rejects.toThrow('Дата виїзду має бути пізніше за дату заїзду');
    });

    it('should throw error if room is already taken by another booking', async () => {
        jest.spyOn(prisma.room, 'findUnique').mockResolvedValue({
            id: 1,
            roomType: { basePrice: 1000 },
        } as any);

        // Імітуємо знайдений перетин
        jest.spyOn(prisma.booking, 'findFirst').mockResolvedValue({ id: 99 } as any);

        await expect(
            BookingService.createBooking(1, 1, '2025-10-10', '2025-10-12'),
        ).rejects.toThrow('Кімната вже зайнята на ці дати іншим гостем');
    });

    it('should throw error if room is under maintenance', async () => {
        jest.spyOn(prisma.room, 'findUnique').mockResolvedValue({
            id: 1,
            roomType: { basePrice: 1000 },
        } as any);

        jest.spyOn(prisma.booking, 'findFirst').mockResolvedValue(null);

        // Імітуємо знайдений ремонт
        jest.spyOn(prisma.maintenanceLog, 'findFirst').mockResolvedValue({
            id: 5,
            description: 'Ремонт крана',
        } as any);

        await expect(
            BookingService.createBooking(1, 1, '2025-10-10', '2025-10-12'),
        ).rejects.toThrow(/Кімната недоступна через технічне обслуговування/);
    });
});
