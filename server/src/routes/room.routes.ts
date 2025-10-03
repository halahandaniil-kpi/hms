import { Router } from 'express';
import * as RoomController from '../controllers/room.controller.js';

const router = Router();

// Маршрут: GET /api/rooms
router.get('/', RoomController.getRooms);

// Маршрут: GET /api/rooms/1
router.get('/:id', RoomController.getRoom);

export default router;
