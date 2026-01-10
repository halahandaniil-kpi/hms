import { Request, Response } from 'express';
import * as RoomService from '../services/room.service.js';

const parseId = (id: string | string[] | undefined): number => {
    const val = Array.isArray(id) ? id[0] : id;
    return parseInt(val as string, 10);
};

// --- ПУБЛІЧНІ МЕТОДИ ---

export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await RoomService.getAllRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні списку кімнат' });
    }
};

export const getRoom = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: 'Невалідний ID' });

        const room = await RoomService.getRoomById(id);
        if (!room) return res.status(404).json({ message: 'Кімнату не знайдено' });

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні даних кімнати' });
    }
};

// --- ДОВІДНКИ (Ліжкка та зручності) ---

export const getBedTypes = async (req: Request, res: Response) => {
    try {
        const types = await RoomService.getAllBedTypes();
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання типів ліжок' });
    }
};

export const getAmenities = async (req: Request, res: Response) => {
    try {
        const amenities = await RoomService.getAllAmenities();
        res.json(amenities);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання зручностей' });
    }
};

export const createAmenity = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const amenity = await RoomService.createAmenity(name);
        res.status(201).json(amenity);
    } catch (error) {
        res.status(400).json({ message: 'Помилка створення зручності' });
    }
};

export const createBedType = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const bedType = await RoomService.createBedType(name);
        res.status(201).json(bedType);
    } catch (error) {
        res.status(400).json({ message: 'Помилка створення типу ліжка' });
    }
};

export const deleteAmenity = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        await RoomService.deleteAmenity(id);
        res.json({ message: 'Зручність видалено' });
    } catch (error) {
        res.status(400).json({ message: 'Помилка видалення зручності' });
    }
};

export const deleteBedType = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        await RoomService.deleteBedType(id);
        res.json({ message: 'Тип ліжка видалено' });
    } catch (error) {
        res.status(400).json({ message: 'Помилка видалення типу ліжка' });
    }
};

// --- УПРАВЛІННЯ НОМЕРАМИ (ROOMS) ---

export const createRoom = async (req: Request, res: Response) => {
    try {
        const room = await RoomService.createRoom(req.body);
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ message: 'Помилка створення номера' });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        await RoomService.deleteRoom(id);
        res.json({ message: 'Номер видалено' });
    } catch (error) {
        res.status(400).json({ message: 'Неможливо видалити номер (можливо, є бронювання)' });
    }
};

// --- УПРАВЛІННЯ ТИПАМИ (ROOM TYPES) ---
export const getAllRoomTypes = async (req: Request, res: Response) => {
    try {
        const types = await RoomService.getAllRoomTypes();
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання категорій' });
    }
};

export const createRoomType = async (req: Request, res: Response) => {
    try {
        const { name, description, basePrice, capacity, bedTypeId, amenityIds } = req.body;

        const newType = await RoomService.createRoomType({
            name,
            description,
            basePrice: Number(basePrice),
            capacity: Number(capacity),
            bedTypeId: Number(bedTypeId),
            amenityIds: amenityIds || [], // Масив ID зручностей
        });

        res.status(201).json(newType);
    } catch (error) {
        res.status(400).json({ message: 'Помилка створення категорії' });
    }
};

export const updateRoomType = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        const updated = await RoomService.updateRoomType(id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Помилка оновлення типу номера' });
    }
};

export const deleteRoomType = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        await RoomService.deleteRoomType(id);
        res.json({ message: 'Категорію видалено успішно' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Помилка видалення' });
    }
};
