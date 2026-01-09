import prisma from '../lib/prisma.js';

export const getAllRooms = async () => {
    const rooms = await prisma.room.findMany({
        include: {
            roomType: {
                include: {
                    images: true,
                    bedType: true,
                    amenities: {
                        include: { amenity: true },
                    },
                },
            },
            bookings: {
                where: {
                    status: 'CHECKED_OUT',
                    review: { isNot: null }, // Беремо тільки ті броні, де є відгук
                },
                include: {
                    review: true,
                },
            },
        },
    });

    // Рахуємо рейтинг для кожної кімнати
    return rooms.map((room) => {
        const reviews = room.bookings.map((b) => b.review).filter(Boolean);
        const reviewCount = reviews.length;

        const totalRating = reviews.reduce((sum, r) => sum + (r?.rating || 0), 0);
        const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

        // Повертаємо об'єкт у форматі, який очікує фронтенд (averageRating всередині roomType)
        return {
            ...room,
            roomType: {
                ...room.roomType,
                averageRating,
                reviewCount,
            },
        };
    });
};

export const getRoomById = async (id: number) => {
    const room = await prisma.room.findUnique({
        where: { id },
        include: {
            roomType: {
                include: {
                    images: true,
                    bedType: true,
                    amenities: {
                        include: { amenity: true },
                    },
                },
            },
            bookings: {
                where: { status: 'CHECKED_OUT' },
                include: {
                    review: true,
                    user: { select: { fullName: true } },
                },
            },
        },
    });

    if (!room) return null;

    const reviews = room.bookings
        .filter((b) => b.review)
        .map((b) => ({
            ...b.review,
            booking: { user: b.user },
        }));

    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Для консистентності з каталогом, додаємо дані і в roomType, і в корінь
    return {
        ...room,
        reviews,
        roomType: {
            ...room.roomType,
            averageRating,
            reviewCount: reviews.length,
        },
        averageRating,
        reviewCount: reviews.length,
    };
};
