import { Router } from 'express';
import * as RoomController from '../controllers/room.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';

// Налаштування збереження файлів
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

const router = Router();

// --- ПУБЛІЧНІ МАРШРУТИ ---
router.get('/', RoomController.getRooms);
router.get('/meta/bed-types', RoomController.getBedTypes);
router.get('/meta/amenities', RoomController.getAmenities);
router.get('/types/all', RoomController.getAllRoomTypes);
router.get('/:id', RoomController.getRoom);

// --- АДМІН-МАРШРУТИ ---

// Роути для роботи з файлами
router.get('/meta/server-files', authenticate, authorize(['ADMIN']), RoomController.getServerFiles);
router.post(
    '/upload',
    authenticate,
    authorize(['ADMIN']),
    upload.single('image'),
    RoomController.uploadImage,
);

// Управління фізичними номерами (Room)
router.post('/', authenticate, authorize(['ADMIN']), RoomController.createRoom);
router.delete('/:id', authenticate, authorize(['ADMIN']), RoomController.deleteRoom);

// Управління типами номерів (RoomType)
router.post('/types', authenticate, authorize(['ADMIN']), RoomController.createRoomType);
router.patch('/types/:id', authenticate, authorize(['ADMIN']), RoomController.updateRoomType);
router.delete('/types/:id', authenticate, authorize(['ADMIN']), RoomController.deleteRoomType);

// Управління довідниками (Зручності та Ліжка)
router.post('/meta/amenities', authenticate, authorize(['ADMIN']), RoomController.createAmenity);
router.delete(
    '/meta/amenities/:id',
    authenticate,
    authorize(['ADMIN']),
    RoomController.deleteAmenity,
);

router.post('/meta/bed-types', authenticate, authorize(['ADMIN']), RoomController.createBedType);
router.delete(
    '/meta/bed-types/:id',
    authenticate,
    authorize(['ADMIN']),
    RoomController.deleteBedType,
);

export default router;
