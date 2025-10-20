import prisma from '../lib/prisma.js';

export const getAllRooms = async () => {
    // Отримуємо всі кімнати разом із інформацією про їх тип та фото
    return await prisma.room.findMany({
        include: {
            roomType: {
                include: {
                    images: true,
                    amenities: {
                        include: { amenity: true },
                    },
                },
            },
        },
    });
};

export const getRoomById = async (id: number) => {
    return await prisma.room.findUnique({
        where: { id },
        include: {
            roomType: {
                include: {
                    images: true,
                    amenities: {
                        include: { amenity: true },
                    },
                },
            },
        },
    });
};
