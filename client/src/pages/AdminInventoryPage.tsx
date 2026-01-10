import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import axios from 'axios';
import { Plus, Trash2, Bed, Home, CheckSquare, Layers, X } from 'lucide-react';

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
    bedType: { name: string };
    amenities: { amenity: { name: string } }[];
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
    const [newMeta, setNewMeta] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);
    const [typeForm, setTypeForm] = useState({
        name: '',
        description: '',
        basePrice: '',
        capacity: '',
        bedTypeId: '',
        amenityIds: [] as number[],
    });

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
        if (!newMeta) return;
        try {
            const endpoint = type === 'amenity' ? '/rooms/meta/amenities' : '/rooms/meta/bed-types';
            await api.post(endpoint, { name: newMeta });
            setNewMeta('');
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
        try {
            await api.post('/rooms/types', typeForm);
            setIsAddingType(false);
            setTypeForm({
                name: '',
                description: '',
                basePrice: '',
                capacity: '',
                bedTypeId: '',
                amenityIds: [],
            });
            fetchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err))
                alert(err.response?.data?.message || 'Помилка при збереженні категорії');
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
                                value={newMeta}
                                onChange={(e) => setNewMeta(e.target.value)}
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
                                value={newMeta}
                                onChange={(e) => setNewMeta(e.target.value)}
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
                            onClick={() => setIsAddingType(!isAddingType)}
                            className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                        >
                            {isAddingType ? <X size={18} /> : <Plus size={18} />}{' '}
                            {isAddingType ? 'Скасувати' : 'Нова категорія'}
                        </button>
                    </div>

                    {isAddingType && (
                        <form
                            onSubmit={handleSaveType}
                            className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 mb-10 grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Назва категорії (напр. Deluxe Suite)"
                                    required
                                    className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary font-bold"
                                    value={typeForm.name}
                                    onChange={(e) =>
                                        setTypeForm({ ...typeForm, name: e.target.value })
                                    }
                                />

                                <textarea
                                    placeholder="Опис номера..."
                                    className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary h-24 resize-none"
                                    value={typeForm.description}
                                    onChange={(e) =>
                                        setTypeForm({ ...typeForm, description: e.target.value })
                                    }
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Ціна за ніч"
                                        required
                                        className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary"
                                        value={typeForm.basePrice}
                                        onChange={(e) =>
                                            setTypeForm({ ...typeForm, basePrice: e.target.value })
                                        }
                                    />
                                    <input
                                        type="number"
                                        placeholder="Місткість (осіб)"
                                        required
                                        className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-primary"
                                        value={typeForm.capacity}
                                        onChange={(e) =>
                                            setTypeForm({ ...typeForm, capacity: e.target.value })
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
                                    <option value="">Оберіть тип ліжка</option>
                                    {bedTypes.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">
                                    Зручності категорії
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-2xl">
                                    {amenities.map((a) => (
                                        <label
                                            key={a.id}
                                            className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={typeForm.amenityIds.includes(a.id)}
                                                onChange={() => handleAmenityChange(a.id)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className="text-sm font-medium text-slate-600">
                                                {a.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                >
                                    Створити категорію
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
                                    <button
                                        onClick={() => handleDelete('/rooms/types', type.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
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
        </main>
    );
};
