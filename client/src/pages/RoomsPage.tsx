import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    BedDouble,
    Users,
    CheckCircle2,
    Star,
    ArrowUpDown,
    ChevronDown,
    XCircle,
    SearchX,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoomType {
    id: number;
    name: string;
    description: string;
    basePrice: string;
    capacity: number;
    bedType: { name: string };
    images: { url: string; isPrimary: boolean }[];
    amenities: { amenity: { name: string } }[];
    averageRating: number;
    reviewCount: number;
}

export const RoomsPage = () => {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);

    const [amenityOptions, setAmenityOptions] = useState<{ id: number; name: string }[]>([]);
    const [bedTypeOptions, setBedTypeOptions] = useState<{ id: number; name: string }[]>([]);

    const [sortBy, setSortBy] = useState('rating');
    const [minCapacity, setMinCapacity] = useState<number>(1);
    const [selectedBedTypes, setSelectedBedTypes] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [typesRes, amRes, btRes] = await Promise.all([
                    api.get('/rooms/types/all'),
                    api.get('/rooms/meta/amenities'),
                    api.get('/rooms/meta/bed-types'),
                ]);

                setRoomTypes(typesRes.data);
                setAmenityOptions(amRes.data);
                setBedTypeOptions(btRes.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ЛОГІКА ФІЛЬТРАЦІЇ
    const filteredRooms = roomTypes.filter((type) => {
        const matchesCapacity = type.capacity >= minCapacity;

        const matchesBed =
            selectedBedTypes.length === 0 || selectedBedTypes.includes(type.bedType.name);

        const matchesAmenities =
            selectedAmenities.length === 0 ||
            selectedAmenities.every((sAm) =>
                type.amenities.some((rAm) => rAm.amenity.name === sAm),
            );

        return matchesCapacity && matchesBed && matchesAmenities;
    });

    // ЛОГІКА СОРТУВАННЯ
    const sortedRooms = [...filteredRooms].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return Number(a.basePrice) - Number(b.basePrice);
            case 'price-desc':
                return Number(b.basePrice) - Number(a.basePrice);
            case 'rating':
            default:
                return (b.averageRating || 0) - (a.averageRating || 0);
        }
    });

    const toggleFilter = (list: string[], setList: (l: string[]) => void, value: string) => {
        setList(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
    };

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );

    return (
        <main className="max-w-7xl mx-auto px-4 py-12">
            <header className="mb-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            Доступні номери
                        </h1>
                        <p className="mt-4 text-lg text-slate-600">
                            Оберіть ідеальний варіант для вашого відпочинку
                        </p>
                    </div>

                    {/* БЛОК СОРТУВАННЯ */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                            <ArrowUpDown size={16} />
                        </div>
                        <select
                            className="appearance-none bg-white pl-11 pr-10 py-3 rounded-2xl border-2 border-slate-100 font-bold text-sm text-slate-700 outline-none hover:border-primary focus:border-primary transition-all cursor-pointer shadow-sm"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="rating">Найвищий рейтинг</option>
                            <option value="price-asc">Ціна: від низької</option>
                            <option value="price-desc">Ціна: від високої</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>

                {/* ПАНЕЛЬ ФІЛЬТРІВ */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* 1. Місткість */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <Users size={14} /> Місткість (від)
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setMinCapacity(num)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${minCapacity === num ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                                    >
                                        {num}+
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Тип ліжка */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <BedDouble size={14} /> Тип ліжка
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {bedTypeOptions.map((bt) => (
                                    <button
                                        key={bt.id}
                                        onClick={() =>
                                            toggleFilter(
                                                selectedBedTypes,
                                                setSelectedBedTypes,
                                                bt.name,
                                            )
                                        }
                                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border-2 ${selectedBedTypes.includes(bt.name) ? 'border-primary bg-blue-50 text-primary' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                                    >
                                        {bt.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Зручності */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <CheckCircle2 size={14} /> Зручності
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto pr-2 scrollbar-hide">
                                {amenityOptions.map((am) => (
                                    <button
                                        key={am.id}
                                        onClick={() =>
                                            toggleFilter(
                                                selectedAmenities,
                                                setSelectedAmenities,
                                                am.name,
                                            )
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border-2 ${selectedAmenities.includes(am.name) ? 'border-primary bg-blue-50 text-primary' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                                    >
                                        {am.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Кнопка скидання */}
                    {(minCapacity > 1 ||
                        selectedBedTypes.length > 0 ||
                        selectedAmenities.length > 0) && (
                        <div className="pt-4 border-t border-slate-50 flex justify-end">
                            <button
                                onClick={() => {
                                    setMinCapacity(1);
                                    setSelectedBedTypes([]);
                                    setSelectedAmenities([]);
                                    setSortBy('rating');
                                }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-colors"
                            >
                                <XCircle size={14} /> Скинути всі фільтри
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {sortedRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedRooms.map((type) => {
                        const primaryImage =
                            type.images.find((img) => img.isPrimary) || type.images[0];
                        const imageUrl = primaryImage?.url
                            ? primaryImage.url.startsWith('http')
                                ? primaryImage.url
                                : `http://localhost:5000${primaryImage.url}`
                            : 'https://www.ca.kayak.com/rimg/dimg/dynamic/186/2023/08/295ffd3a54bd51fc33810ce59382d1da.webp';
                        return (
                            <article
                                key={type.id}
                                className="flex flex-col h-full group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                            >
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={imageUrl}
                                        alt={type.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                        {type.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    fill={
                                                        i < Math.round(type.averageRating || 0)
                                                            ? 'currentColor'
                                                            : 'none'
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">
                                            {type.averageRating?.toFixed(1) || '0.0'}
                                        </span>
                                        <span className="text-sm text-slate-400">
                                            ({type.reviewCount || 0} відгуків)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4 text-slate-500 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Users size={18} /> {type.capacity} особи
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                                            <BedDouble size={16} className="text-primary" />{' '}
                                            {type.bedType.name}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {type.amenities.slice(0, 3).map((item, index) => (
                                            <span
                                                key={index}
                                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400"
                                            >
                                                <CheckCircle2
                                                    size={12}
                                                    className="text-green-500"
                                                />
                                                {item.amenity.name}
                                            </span>
                                        ))}
                                        {type.amenities.length > 3 && (
                                            <span className="text-[10px] font-bold text-slate-400">
                                                +{type.amenities.length - 3} більше
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-slate-600 line-clamp-2 mb-6 text-sm leading-relaxed">
                                        {type.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                                        <div>
                                            <span className="block text-2xl font-black text-primary">
                                                {type.basePrice} ₴
                                            </span>
                                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                                за ніч
                                            </span>
                                        </div>
                                        <Link
                                            to={`/room-types/${type.id}`}
                                            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                        >
                                            Детальніше
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                /* БЛОК "НІЧОГО НЕ ЗНАЙДЕНО" */
                <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-inner">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-50 text-slate-300 rounded-full mb-6">
                        <SearchX size={48} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                        На жаль, нічого не знайдено
                    </h2>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                        Ми не знайшли номерів, які відповідають усім вашим фільтрам. Спробуйте
                        змінити параметри або скинути їх.
                    </p>
                    <button
                        onClick={() => {
                            setMinCapacity(1);
                            setSelectedBedTypes([]);
                            setSelectedAmenities([]);
                            setSortBy('rating');
                        }}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary transition-all shadow-xl shadow-blue-100"
                    >
                        Скинути всі фільтри
                    </button>
                </div>
            )}
        </main>
    );
};
