import { Request, Response } from 'express';
import * as RoomService from '../services/room.service.js';

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
        const { id: idParam } = req.params;

        // Перевіряємо, чи idParam є рядком
        if (typeof idParam !== 'string') {
            return res.status(400).json({ message: 'Невірний формат ID параметра' });
        }

        const id = parseInt(idParam);

        const room = await RoomService.getRoomById(id);

        if (!room) {
            return res.status(404).json({ message: 'Кімнату не знайдено' });
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні даних кімнати' });
    }
};
