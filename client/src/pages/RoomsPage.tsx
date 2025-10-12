import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BedDouble, Users, CheckCircle2 } from 'lucide-react';

interface Room {
    id: number;
    roomNumber: string;
    roomType: {
        name: string;
        basePrice: string;
        description: string;
        capacity: number;
        bedType: string;
        images: { url: string }[];
        amenities: {
            amenity: {
                name: string;
            };
        }[];
    };
}

export const RoomsPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/rooms')
            .then((res) => {
                setRooms(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );

    return (
        <main className="max-w-7xl mx-auto px-4 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Доступні номери
                </h1>
                <p className="mt-4 text-lg text-slate-600">
                    Оберіть ідеальний варіант для вашого відпочинку
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.map((room) => (
                    <article
                        key={room.id}
                        className="flex flex-col h-full group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                        <div className="relative h-64 overflow-hidden">
                            <img
                                src={
                                    room.roomType.images[0]?.url ||
                                    'https://www.ca.kayak.com/rimg/dimg/dynamic/186/2023/08/295ffd3a54bd51fc33810ce59382d1da.webp'
                                }
                                alt={room.roomType.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm">
                                №{room.roomNumber}
                            </div>
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                {room.roomType.name}
                            </h3>

                            <div className="flex items-center gap-4 mb-4 text-slate-500 text-sm">
                                <span className="flex items-center gap-1">
                                    <Users size={18} /> {room.roomType.capacity} особи
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                                    <BedDouble size={16} className="text-primary" />{' '}
                                    {room.roomType.bedType}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {room.roomType.amenities.slice(0, 3).map((item, index) => (
                                    <span
                                        key={index}
                                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400"
                                    >
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        {item.amenity.name}
                                    </span>
                                ))}
                                {room.roomType.amenities.length > 3 && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                        +{room.roomType.amenities.length - 3} більше
                                    </span>
                                )}
                            </div>

                            <p className="text-slate-600 line-clamp-2 mb-6 text-sm leading-relaxed">
                                {room.roomType.description}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                                <div>
                                    <span className="block text-2xl font-black text-primary">
                                        {room.roomType.basePrice} ₴
                                    </span>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                        за ніч
                                    </span>
                                </div>
                                <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                    Забронювати
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
};
