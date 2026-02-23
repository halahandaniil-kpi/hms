import prisma from '../lib/prisma.js';

export const createBooking = async (
    userId: number,
    roomId: number,
    checkIn: string,
    checkOut: string,
    specialRequests?: string,
) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Будь ласка, оберіть період проживання на календарі');
    }

    if (start >= end) {
        throw new Error('Дата виїзду має бути пізніше за дату заїзду');
    }

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { roomType: true },
    });

    if (!room) throw new Error('Кімнату не знайдено');

    // Перевірка запланованого обслуговування (Maintenance Check)
    // Враховуємо startDate та endDate з таблиці maintenance_logs
    const maintenanceOverlap = await prisma.maintenanceLog.findFirst({
        where: {
            roomId: roomId,
            OR: [
                {
                    // Ремонт має чітку дату кінця і вона перетинається
                    AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
                },
                {
                    // Ремонт почався, а дата кінця ще не встановлена
                    AND: [{ startDate: { lt: end } }, { endDate: null }],
                },
            ],
        },
    });

    if (maintenanceOverlap) {
        throw new Error(
            `Кімната недоступна через технічне обслуговування: ${maintenanceOverlap.description}`,
        );
    }

    // Перевірка накладки з іншими бронюваннями
    const bookingOverlap = await prisma.booking.findFirst({
        where: {
            roomId: roomId,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
            AND: [{ checkInDate: { lt: end } }, { checkOutDate: { gt: start } }],
        },
    });

    if (bookingOverlap) {
        throw new Error('Кімната вже зайнята на ці дати іншим гостем');
    }

    // Розрахунок вартості (використовуємо basePrice з roomType)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = Number(room.roomType.basePrice) * diffDays;

    // Створення бронювання з використанням усіх полів
    return await prisma.booking.create({
        data: {
            userId,
            roomId,
            checkInDate: start,
            checkOutDate: end,
            totalPrice,
            status: 'PENDING', // Починаємо зі статусу очікування
            specialRequests: specialRequests ?? null, // Використовуємо поле для побажань гостя
        },
    });
};

// Отримання всіх бронювань конкретного користувача
export const getUserBookings = async (userId: number) => {
    return await prisma.booking.findMany({
        where: { userId },
        include: {
            room: {
                include: {
                    roomType: { include: { images: true } },
                },
            },
            payment: true,
            review: true,
        },
        orderBy: { createdAt: 'desc' }, // Спочатку новіші замовлення
    });
};

export const getTakenDates = async (roomId: number) => {
    const bookings = await prisma.booking.findMany({
        where: {
            roomId,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
        },
        select: { checkInDate: true, checkOutDate: true },
    });

    const maintenance = await prisma.maintenanceLog.findMany({
        where: { roomId },
        select: { startDate: true, endDate: true },
    });

    return { bookings, maintenance };
};

export const cancelBooking = async (bookingId: number, userId: number) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) throw new Error('Бронювання не знайдено');

    if (booking.userId !== userId) {
        throw new Error('Ви не можете скасувати чуже бронювання');
    }

    // Перевірка статусу: не можна скасувати, якщо вже проживаєш або виїхав
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        throw new Error('Неможливо скасувати бронювання на даному етапі');
    }

    return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
    });
};
