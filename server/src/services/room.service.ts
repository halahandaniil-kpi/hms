import prisma from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';

export const getAllRooms = async () => {
    return await prisma.room.findMany({
        include: {
            roomType: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            roomNumber: 'asc',
        },
    });
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
    const types = await prisma.roomType.findMany({
        include: {
            amenities: { include: { amenity: true } },
            bedType: true,
            images: { orderBy: { isPrimary: 'desc' } },
            rooms: {
                include: {
                    bookings: {
                        where: { status: 'CHECKED_OUT', review: { isNot: null } },
                        include: { review: true },
                    },
                },
            },
        },
    });

    return types.map((type) => {
        // Збираємо всі відгуки з усіх номерів цієї категорії
        const allReviews = type.rooms.flatMap((r) =>
            r.bookings.map((b) => b.review).filter(Boolean),
        );
        const reviewCount = allReviews.length;
        const totalRating = allReviews.reduce((sum, r) => sum + (r?.rating || 0), 0);
        const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

        return {
            ...type,
            averageRating,
            reviewCount,
        };
    });
};

export const getRoomTypeById = async (id: number) => {
    const type = await prisma.roomType.findUnique({
        where: { id },
        include: {
            amenities: { include: { amenity: true } },
            bedType: true,
            images: { orderBy: { isPrimary: 'desc' } },
            rooms: {
                select: { id: true, roomNumber: true, status: true },
            },
        },
    });

    if (!type) return null;

    // Отримуємо відгуки для всієї категорії через кімнати
    const reviews = await prisma.review.findMany({
        where: {
            booking: {
                room: { roomTypeId: id },
            },
        },
        include: {
            booking: {
                include: { user: { select: { fullName: true } } },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
        ...type,
        reviews,
        averageRating,
        reviewCount: reviews.length,
    };
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

export const updateRoomTypeFull = async (id: number, data: any) => {
    const { amenityIds, images, ...rest } = data;

    return await prisma.$transaction(async (tx) => {
        // Оновлюємо основні дані
        const updated = await tx.roomType.update({
            where: { id },
            data: {
                ...rest,
                amenities: {
                    deleteMany: {}, // Скидаємо старі зручності
                    create: amenityIds.map((aId: number) => ({ amenityId: aId })),
                },
                images: {
                    deleteMany: {}, // Видаляємо старі посилання
                    create: images.map((img: any) => ({
                        url: img.url,
                        isPrimary: img.isPrimary,
                    })),
                },
            },
        });
        return updated;
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

export const getServerFiles = () => {
    const dirPath = path.resolve('public/uploads');
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath).map((file) => `/uploads/${file}`);
};

export const deleteServerFile = async (filename: string) => {
    // Використовуємо path.basename, щоб ніхто не міг видалити системні файли за межами папки
    const safeFilename = path.basename(filename);
    const filePath = path.resolve('public/uploads', safeFilename);
    const fileUrl = `/uploads/${safeFilename}`;

    await prisma.roomImage.deleteMany({
        where: { url: fileUrl },
    });

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    throw new Error('Файл не знайдено на сервері');
};

// --- Maintenance Logs ---

export const createMaintenanceLog = async (data: {
    roomId: number;
    staffId: number;
    description: string;
    startDate: Date;
    endDate?: Date | null;
}) => {
    return await prisma.maintenanceLog.create({ data });
};

export const getAllMaintenanceLogs = async () => {
    return await prisma.maintenanceLog.findMany({
        include: {
            room: true,
            staff: { select: { fullName: true } },
        },
        orderBy: { startDate: 'desc' },
    });
};

export const updateMaintenanceLog = async (id: number, data: any) => {
    return await prisma.maintenanceLog.update({
        where: { id },
        data,
    });
};

export const deleteMaintenanceLog = async (id: number) => {
    return await prisma.maintenanceLog.delete({ where: { id } });
};
