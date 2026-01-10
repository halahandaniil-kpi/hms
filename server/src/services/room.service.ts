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

// --- BedTypes ---
export const createBedType = (name: string) => prisma.bedType.create({ data: { name } });
export const getAllBedTypes = () => prisma.bedType.findMany();
export const deleteBedType = (id: number) => prisma.bedType.delete({ where: { id } });

// --- Amenities ---
export const createAmenity = (name: string) => prisma.amenity.create({ data: { name } });
export const getAllAmenities = () => prisma.amenity.findMany();
export const deleteAmenity = (id: number) => prisma.amenity.delete({ where: { id } });

// --- RoomTypes ---
export const getAllRoomTypes = async () => {
    return await prisma.roomType.findMany({
        include: {
            amenities: { include: { amenity: true } },
            bedType: true,
        },
    });
};

export const createRoomType = (data: any) => {
    const { amenityIds, ...rest } = data;
    return prisma.roomType.create({
        data: {
            ...rest,
            amenities: {
                create: amenityIds.map((id: number) => ({ amenityId: id })),
            },
        },
    });
};

export const updateRoomType = (id: number, data: any) => {
    const { amenityIds, ...rest } = data;
    return prisma.roomType.update({
        where: { id },
        data: {
            ...rest,
            amenities: {
                deleteMany: {}, // Скидаємо старі зручності
                create: amenityIds.map((id: number) => ({ amenityId: id })),
            },
        },
    });
};

export const deleteRoomType = async (id: number) => {
    // Перевіряємо, чи є кімнати в цій категорії
    const roomsCount = await prisma.room.count({ where: { roomTypeId: id } });

    if (roomsCount > 0) {
        throw new Error(
            `Неможливо видалити: до цієї категорії прив'язано ${roomsCount} номерів. Спочатку змініть категорію для цих номерів або видаліть їх.`,
        );
    }

    // Якщо кімнат немає, видаляємо
    return await prisma.roomType.delete({
        where: { id },
    });
};

// --- Rooms ---
export const createRoom = (data: any) => prisma.room.create({ data });
export const deleteRoom = (id: number) => prisma.room.delete({ where: { id } });
