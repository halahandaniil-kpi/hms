import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import axios from 'axios';
import { Plus, Trash2, Bed, Home, CheckSquare, Layers, X, Edit3, Star } from 'lucide-react';

interface Amenity {
    id: number;
    name: string;
}
interface BedType {
    id: number;
    name: string;
}
interface RoomType {
    id: number;
    name: string;
    description: string;
    basePrice: string;
    capacity: number;
    bedType: {
        id: number;
        name: string;
    };
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    amenities: {
        amenity: {
            id: number;
            name: string;
        };
    }[];
}
interface Room {
    id: number;
    roomNumber: string;
    floor: number;
    roomType: { name: string };
}

export const AdminInventoryPage = () => {
    const [activeTab, setActiveTab] = useState<'rooms' | 'types' | 'meta'>('rooms');
    const [loading, setLoading] = useState(true);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [bedTypes, setBedTypes] = useState<BedType[]>([]);

    const [showForm, setShowForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', floor: '', roomTypeId: '' });
    const [newAmenityName, setNewAmenityName] = useState('');
    const [newBedTypeName, setNewBedTypeName] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);
    const [typeForm, setTypeForm] = useState({
        name: '',
        description: '',
        basePrice: '',
        capacity: '',
        bedTypeId: '',
        amenityIds: [] as number[],
    });

    const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
    const [serverFiles, setServerFiles] = useState<string[]>([]);
    const [showFilePicker, setShowFilePicker] = useState(false);
    const [tempImages, setTempImages] = useState<{ url: string; isPrimary: boolean }[]>([]);

    const fetchData = async () => {
        try {
            const [roomsRes, typesRes, amRes, btRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/rooms/types/all'),
                api.get('/rooms/meta/amenities'),
                api.get('/rooms/meta/bed-types'),
            ]);

            setRooms(roomsRes.data);
            setRoomTypes(typesRes.data);
            setAmenities(amRes.data);
            setBedTypes(btRes.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка завантаження фонду');
            }
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (isMounted) {
                await fetchData();
            }
        };
        init();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/rooms', {
                roomNumber: newRoom.roomNumber,
                floor: Number(newRoom.floor),
                roomTypeId: Number(newRoom.roomTypeId),
            });
            setShowForm(false);
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Помилка');
            }
        }
    };

    const handleAddMeta = async (type: 'amenity' | 'bed-type') => {
        const value = type === 'amenity' ? newAmenityName : newBedTypeName;
        if (!value) return;
        try {
            const endpoint = type === 'amenity' ? '/rooms/meta/amenities' : '/rooms/meta/bed-types';
            await api.post(endpoint, { name: value });
            if (type === 'amenity') {
                setNewAmenityName('');
            } else {
                setNewBedTypeName('');
            }
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || 'Така назва вже існує');
            }
        }
    };

    const handleDelete = async (endpoint: string, id: number) => {
        if (!window.confirm('Ви впевнені? Це може вплинути на існуючі бронювання.')) return;
        try {
            await api.delete(`${endpoint}/${id}`);
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) alert(err.response?.data?.message || 'Помилка видалення');
        }
    };

    const handleAmenityChange = (id: number) => {
        setTypeForm((prev) => ({
            ...prev,
            amenityIds: prev.amenityIds.includes(id)
                ? prev.amenityIds.filter((a) => a !== id)
                : [...prev.amenityIds, id],
        }));
    };

    const handleSaveType = async (e: React.FormEvent) => {
        e.preventDefault();

        // При редагуванні додаємо масив images, при створенні - ні
        const payload = editingTypeId ? { ...typeForm, images: tempImages } : typeForm;

        try {
            if (editingTypeId) {
                await api.patch(`/rooms/types/${editingTypeId}`, payload);
            } else {
                await api.post('/rooms/types', payload);
            }

            setIsAddingType(false);
            resetForm();
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err))
                alert(err.response?.data?.message || 'Помилка при збереженні категорії');
        }
    };

    const startEditType = (type: RoomType) => {
        setEditingTypeId(type.id);
        setIsAddingType(true);
        setTypeForm({
            name: type.name,
            description: type.description || '',
            basePrice: type.basePrice.toString(),
            capacity: type.capacity.toString(),
            bedTypeId: type.bedType?.id.toString(),
            amenityIds: type.amenities?.map((a) => a.amenity.id) || [],
        });
        setTempImages(type.images || []);
        fetchServerFiles();
    };

    const resetForm = () => {
        setEditingTypeId(null);
        setTypeForm({
            name: '',
            description: '',
            basePrice: '',
            capacity: '',
            bedTypeId: '',
            amenityIds: [],
        });
        setTempImages([]);
    };

    // Отримання списку файлів з public/uploads
    const fetchServerFiles = async () => {
        try {
            const res = await api.get('/rooms/meta/server-files');
            setServerFiles(res.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err))
                alert(err.response?.data?.message || 'Не вдалося завантажити файли');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Відправляємо файл на сервер
            await api.post('/rooms/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            fetchServerFiles();

            alert('Фото успішно завантажено!');
        } catch (err: unknown) {
            if (axios.isAxiosError(err))
                alert(err.response?.data?.message || 'Помилка завантаження файлу');
        }
    };

    const handleDeleteServerFile = async (e: React.MouseEvent, fileName: string) => {
        e.stopPropagation();

        const pureName = fileName.replace('/uploads/', '');

        if (!window.confirm(`Видалити файл ${pureName} з сервера назавжди?`)) return;

        try {
            await api.delete(`/rooms/meta/server-files/${encodeURIComponent(pureName)}`);
            setTempImages((prev) => prev.filter((img) => img.url !== fileName));
            fetchServerFiles();
        } catch (err: unknown) {
            if (axios.isAxiosError(err))
                alert(err.response?.data?.message || 'Помилка при видаленні файлу');
        }
    };

    if (loading)
        return (
            <div className="p-20 text-center animate-bounce font-black text-primary">
                СИНХРОНІЗАЦІЯ ДАНИХ...
            </div>
        );

    return (
        <main className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-uppercase">
                        Управління фондом
                    </h1>
                    <p className="text-slate-400 font-bold text-sm">
                        Налаштування номерів, категорій та зручностей
                    </p>
                </div>
            </div>

            {/* НАВІГАЦІЯ ПО ВКЛАДКАХ */}
            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'rooms' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Фізичні номери
                </button>
                <button
                    onClick={() => setActiveTab('types')}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'types' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Категорії (Типи)
                </button>
                <button
                    onClick={() => setActiveTab('meta')}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'meta' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Довідники
                </button>
            </div>

            {/* --- ВКЛАДКА: НОМЕРИ --- */}
            {activeTab === 'rooms' && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Home size={20} /> Список усіх номерів
                        </h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                        >
                            {showForm ? <X size={18} /> : <Plus size={18} />}{' '}
                            {showForm ? 'Закрити' : 'Додати номер'}
                        </button>
                    </div>

                    {showForm && (
                        <form
                            onSubmit={handleAddRoom}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl shadow-xl mb-8 border border-blue-100"
                        >
                            <input
                                type="text"
                                placeholder="№ Номера (напр. 101)"
                                required
                                className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary"
                                value={newRoom.roomNumber}
                                onChange={(e) =>
                                    setNewRoom({ ...newRoom, roomNumber: e.target.value })
                                }
                            />
                            <input
                                type="number"
                                placeholder="Поверх"
                                required
                                className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary"
                                value={newRoom.floor}
                                onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                            />
                            <select
                                required
                                className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold"
                                value={newRoom.roomTypeId}
                                onChange={(e) =>
                                    setNewRoom({ ...newRoom, roomTypeId: e.target.value })
                                }
                            >
                                <option value="">Оберіть категорію</option>
                                {roomTypes.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="bg-slate-900 text-white rounded-xl font-black uppercase tracking-wider hover:bg-black transition-all"
                            >
                                Зберегти
                            </button>
                        </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center"
                            >
                                <div>
                                    <div className="text-2xl font-black text-slate-900">
                                        № {room.roomNumber}
                                    </div>
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        {room.roomType?.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                        Поверх {room.floor}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete('/rooms', room.id)}
                                    className="p-2 text-red-300 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- ВКЛАДКА: ДОВІДНИКИ (Зручності та ліжка) --- */}
            {activeTab === 'meta' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in">
                    {/* Управління зручностями */}
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
                            <CheckSquare size={20} /> Зручності
                        </h3>
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="Назва зручності..."
                                className="flex-grow p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-primary"
                                value={newAmenityName}
                                onChange={(e) => setNewAmenityName(e.target.value)}
                            />
                            <button
                                onClick={() => handleAddMeta('amenity')}
                                className="bg-primary text-white p-3 rounded-xl hover:bg-blue-700"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {amenities.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                    <span className="font-bold text-slate-700 text-sm">
                                        {a.name}
                                    </span>
                                    <button
                                        onClick={() => handleDelete('/rooms/meta/amenities', a.id)}
                                        className="text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Управління типами ліжок */}
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
                            <Bed size={20} /> Типи ліжок
                        </h3>
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="Напр. King Size..."
                                className="flex-grow p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-primary"
                                value={newBedTypeName}
                                onChange={(e) => setNewBedTypeName(e.target.value)}
                            />
                            <button
                                onClick={() => handleAddMeta('bed-type')}
                                className="bg-primary text-white p-3 rounded-xl hover:bg-blue-700"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {bedTypes.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                    <span className="font-bold text-slate-700 text-sm">
                                        {b.name}
                                    </span>
                                    <button
                                        onClick={() => handleDelete('/rooms/meta/bed-types', b.id)}
                                        className="text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ВКЛАДКА: КАТЕГОРІЇ НОМЕРІВ --- */}
            {activeTab === 'types' && (
                <section className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Layers size={20} /> Категорії номерів
                        </h2>
                        <button
                            onClick={() => {
                                if (isAddingType) {
                                    setIsAddingType(false);
                                    resetForm();
                                } else {
                                    resetForm(); // Очищуємо перед відкриттям нової
                                    setIsAddingType(true);
                                }
                            }}
                            className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                        >
                            {isAddingType ? <X size={18} /> : <Plus size={18} />}{' '}
                            {isAddingType ? 'Скасувати' : 'Нова категорія'}
                        </button>
                    </div>

                    {isAddingType && (
                        <form
                            onSubmit={handleSaveType}
                            className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 mb-10"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Ліва колонка: Текстові дані */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">
                                        Основна інформація
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Назва категорії"
                                        required
                                        className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold"
                                        value={typeForm.name}
                                        onChange={(e) =>
                                            setTypeForm({ ...typeForm, name: e.target.value })
                                        }
                                    />

                                    <textarea
                                        placeholder="Опис номера..."
                                        className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary h-24 resize-none text-sm"
                                        value={typeForm.description}
                                        onChange={(e) =>
                                            setTypeForm({
                                                ...typeForm,
                                                description: e.target.value,
                                            })
                                        }
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            placeholder="Ціна за ніч"
                                            required
                                            className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold"
                                            value={typeForm.basePrice}
                                            onChange={(e) =>
                                                setTypeForm({
                                                    ...typeForm,
                                                    basePrice: e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            type="number"
                                            placeholder="Осіб"
                                            required
                                            className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold"
                                            value={typeForm.capacity}
                                            onChange={(e) =>
                                                setTypeForm({
                                                    ...typeForm,
                                                    capacity: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <select
                                        required
                                        className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold"
                                        value={typeForm.bedTypeId}
                                        onChange={(e) =>
                                            setTypeForm({ ...typeForm, bedTypeId: e.target.value })
                                        }
                                    >
                                        <option value="">Тип ліжка...</option>
                                        {bedTypes.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Права колонка: Зручності */}
                                <div className="flex flex-col">
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest ml-1">
                                        Зручності
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-grow">
                                        {amenities.map((a) => (
                                            <label
                                                key={a.id}
                                                className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-all group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-slate-300 text-primary accent-primary"
                                                    checked={typeForm.amenityIds.includes(a.id)}
                                                    onChange={() => handleAmenityChange(a.id)}
                                                />
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">
                                                    {a.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* СЕКЦІЯ ФОТО */}
                                {editingTypeId !== null && (
                                    <div className="col-span-full border-t border-slate-100 pt-6 mt-4">
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">
                                            Галерея зображень
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {tempImages?.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative group rounded-xl overflow-hidden aspect-video border-2 border-slate-200 bg-slate-100"
                                                >
                                                    <img
                                                        src={
                                                            img.url.startsWith('http')
                                                                ? img.url
                                                                : `http://localhost:5000${img.url}`
                                                        }
                                                        className="w-full h-full object-cover"
                                                        alt="room"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'https://via.placeholder.com/300x200?text=Error';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setTempImages(
                                                                    tempImages.map((item, i) => ({
                                                                        ...item,
                                                                        isPrimary: i === idx,
                                                                    })),
                                                                )
                                                            }
                                                            className={`p-1.5 rounded-lg ${img.isPrimary ? 'bg-yellow-400 text-white' : 'bg-white text-slate-600'}`}
                                                        >
                                                            <Star
                                                                size={14}
                                                                fill={
                                                                    img.isPrimary ? 'white' : 'none'
                                                                }
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setTempImages(
                                                                    tempImages.filter(
                                                                        (_, i) => i !== idx,
                                                                    ),
                                                                )
                                                            }
                                                            className="p-1.5 bg-red-500 text-white rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setShowFilePicker(true)}
                                                className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all aspect-video"
                                            >
                                                <Plus size={24} />
                                                <span className="text-[10px] font-bold uppercase mt-1">
                                                    Додати фото
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* НИЖНЯ ПАНЕЛЬ ДІЙ */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    {editingTypeId ? 'Зберегти зміни' : 'Створити категорію'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Список існуючих категорій */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roomTypes.map((type) => (
                            <div
                                key={type.id}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">
                                            {type.name}
                                        </h3>
                                        <div className="text-primary font-black">
                                            {type.basePrice} ₴ / ніч
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEditType(type)}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('/rooms/types', type.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Bed size={14} /> {type.bedType?.name} • {type.capacity}{' '}
                                        особи
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 italic">
                                        "{type.description}"
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {type.amenities.map(
                                        (am: { amenity: { name: string } }, i: number) => (
                                            <span
                                                key={i}
                                                className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase"
                                            >
                                                {am.amenity.name}
                                            </span>
                                        ),
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showFilePicker && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900">
                                Менеджер зображень
                            </h3>
                            <button
                                onClick={() => setShowFilePicker(false)}
                                className="p-2 hover:bg-slate-100 rounded-full"
                            >
                                <X />
                            </button>
                        </div>

                        {/* Ввід URL */}
                        <div className="mb-8 p-4 bg-slate-50 rounded-2xl">
                            <label className="text-xs font-black uppercase text-slate-400 block mb-2 ml-1">
                                Додати через посилання (URL)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="externalUrl"
                                    type="text"
                                    placeholder="https://images.unsplash.com/..."
                                    className="flex-grow p-3 rounded-xl border-none outline-none focus:ring-2 ring-primary text-sm"
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById(
                                            'externalUrl',
                                        ) as HTMLInputElement;
                                        const newUrl = input.value.trim();

                                        if (newUrl) {
                                            const isDuplicate = tempImages.some(
                                                (img) => img.url === newUrl,
                                            );
                                            if (isDuplicate) {
                                                alert(
                                                    'Це фото вже додане до галереї цієї категорії!',
                                                );
                                                return;
                                            }

                                            setTempImages([
                                                ...tempImages,
                                                { url: newUrl, isPrimary: tempImages.length === 0 },
                                            ]);
                                            input.value = '';
                                            setShowFilePicker(false);
                                        }
                                    }}
                                    className="bg-slate-900 text-white px-6 rounded-xl font-bold"
                                >
                                    Додати
                                </button>
                            </div>
                        </div>

                        {/* Завантаження з комп'ютера */}
                        <div className="mb-6 p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all text-center">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-primary mx-auto">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-sm font-black text-slate-700">
                                        Завантажити з комп'ютера
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        Файл збережеться на сервері
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Вибір завантажених */}
                        <label className="text-xs font-black uppercase text-slate-400 block mb-3 ml-1">
                            Або оберіть із завантажених на сервер
                        </label>
                        <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2">
                            {serverFiles.map((file) => (
                                <div
                                    key={file}
                                    onClick={() => {
                                        const isDuplicate = tempImages.some(
                                            (img) => img.url === file,
                                        );
                                        if (isDuplicate) {
                                            alert('Це завантажене фото вже є у списку вибраних!');
                                            return;
                                        }
                                        setTempImages([
                                            ...tempImages,
                                            { url: file, isPrimary: tempImages.length === 0 },
                                        ]);
                                        setShowFilePicker(false);
                                    }}
                                    className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer hover:ring-4 ring-primary transition-all"
                                >
                                    <img
                                        src={`http://localhost:5000${file}`}
                                        className="w-full h-full object-cover"
                                        alt="server asset"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="bg-white text-primary text-[10px] font-black px-2 py-1 rounded-lg shadow-xl uppercase">
                                            Обрати
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteServerFile(e, file)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg z-50 pointer-events-auto"
                                        title="Видалити з сервера"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {serverFiles.length === 0 && (
                                <p className="col-span-full text-center py-10 text-slate-400 italic">
                                    На сервері ще немає завантажених фото
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};
