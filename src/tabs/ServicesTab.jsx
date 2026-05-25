const { useState } = React;

import { parsePositiveNumber, parsePositiveInteger, formatCurrency, VEHICLE_TYPES } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Icons } from '../core/icons.jsx';

export const ServicesTab = ({ 
    services, 
    setServices, 
    showNotification 
}) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState('');
    
    const [srvName, setSrvName] = useState('');
    const [duration, setDuration] = useState(45);
    
    const [sedanPrice, setSedanPrice] = useState(500);
    const [suvPrice, setSuvPrice] = useState(600);
    const [minibusPrice, setMinibusPrice] = useState(700);
    const [ticariPrice, setTicariPrice] = useState(640);
    const [motosikletPrice, setMotosikletPrice] = useState(300);

    const handleSaveService = (e) => {
        e.preventDefault();
        if (!srvName) {
            showNotification("Hizmet adı girilmelidir.", "error");
            return;
        }

        const pricesObj = {
            SEDAN: parsePositiveNumber(sedanPrice),
            SUV: parsePositiveNumber(suvPrice),
            MINIBUS: parsePositiveNumber(minibusPrice),
            TICARI: parsePositiveNumber(ticariPrice),
            MOTOSIKLET: parsePositiveNumber(motosikletPrice)
        };

        if (isEditMode) {
            setServices(prev => prev.map(s => s.id === editId ? {
                ...s,
                name: srvName,
                duration: parsePositiveInteger(duration, 45),
                prices: pricesObj
            } : s));
            showNotification("Hizmet başarıyla güncellendi.");
        } else {
            const newSrv = {
                id: generateUUID(),
                name: srvName,
                prices: pricesObj,
                duration: parsePositiveInteger(duration, 45),
                isActive: true
            };
            setServices(prev => [...prev, newSrv]);
            showNotification("Yeni hizmet kataloğa eklendi.");
        }

        setIsOpenModal(false);
        setIsEditMode(false);
        setSrvName('');
        setDuration(45);
        setSedanPrice(500);
        setSuvPrice(600);
        setMinibusPrice(700);
        setTicariPrice(640);
        setMotosikletPrice(300);
    };

    const openEditDialog = (srv) => {
        setEditId(srv.id);
        setSrvName(srv.name);
        setDuration(srv.duration);
        setSedanPrice(srv.prices.SEDAN || 0);
        setSuvPrice(srv.prices.SUV || 0);
        setMinibusPrice(srv.prices.MINIBUS || 0);
        setTicariPrice(srv.prices.TICARI || 0);
        setMotosikletPrice(srv.prices.MOTOSIKLET || 0);
        setIsEditMode(true);
        setIsOpenModal(true);
    };

    const toggleActive = (id, currentVal) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentVal } : s));
        showNotification("Hizmet durumu güncellendi.");
    };

    return (
        <div className="space-y-6 text-left">
            <PageHeader
                title="Yıkama & Bakım Hizmet Kataloğu"
                description="Araç sınıflarına göre yıkama paketlerini ve fiyat listesini özelleştirin."
                actions={
                    <button
                        type="button"
                        onClick={() => setIsOpenModal(true)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
                    >
                        <Icons.Plus />
                        <span>Kataloğa Paket Ekle</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map(srv => (
                    <div key={srv.id} className={`bg-darkBg-card border rounded-xl p-5 shadow space-y-4 flex flex-col justify-between transition ${srv.isActive ? 'border-darkBg-border' : 'border-dashed border-red-500/20 opacity-60'}`}>
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">{srv.name}</h3>
                                    <span className="text-[10px] text-gray-400">Ortalama Süre: {srv.duration} Dakika</span>
                                </div>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${srv.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {srv.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            <div className="bg-darkBg-deep p-3 rounded-lg border border-darkBg-border text-xs">
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-400">
                                    {VEHICLE_TYPES.map((type, index) => {
                                        const isLast = index === VEHICLE_TYPES.length - 1;
                                        const odd = VEHICLE_TYPES.length % 2 === 1;
                                        return (
                                            <div
                                                key={type.id}
                                                className={`flex justify-between ${isLast && odd ? 'col-span-2 pt-1' : 'border-b border-darkBg-border pb-1'}`}
                                            >
                                                <span>{type.label.toLocaleUpperCase('tr-TR')}:</span>
                                                <span className="text-gray-200 font-bold">{formatCurrency(srv.prices[type.id] || 0)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-darkBg-border pt-3 flex space-x-2">
                            <button 
                                type="button"
                                onClick={() => openEditDialog(srv)}
                                className="flex-1 bg-brand-900/20 text-brand-400 hover:bg-brand-600 hover:text-white py-1.5 rounded font-bold text-xs transition"
                            >
                                Düzenle
                            </button>
                            <button 
                                type="button"
                                onClick={() => toggleActive(srv.id, srv.isActive)}
                                className={`flex-1 py-1.5 rounded font-bold text-xs transition ${srv.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                            >
                                {srv.isActive ? 'Durdur' : 'Aktifleştir'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                            <h3 className="text-base font-bold text-white">{isEditMode ? 'Hizmet Paketini Düzenle' : 'Kataloğa Yeni Hizmet Ekle'}</h3>
                            <button type="button" onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-white">
                                <Icons.X />
                            </button>
                        </div>

                        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-gray-400 block font-semibold">Hizmet Paketi Adı *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={srvName}
                                        onChange={(e) => setSrvName(e.target.value)}
                                        placeholder="Örn: Seramik Kaplama Hızlı Cila" 
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Uygulama Süresi (Dakika) *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-darkBg-border pt-3">
                                <h4 className="text-xs font-bold text-brand-400 mb-3">Araç Sınıflarına Göre Fiyatlandırma (₺)</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold text-[10px]">SEDAN *</label>
                                        <input type="number" required value={sedanPrice} onChange={(e) => setSedanPrice(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold text-[10px]">SUV *</label>
                                        <input type="number" required value={suvPrice} onChange={(e) => setSuvPrice(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold text-[10px]">MİNİBÜS *</label>
                                        <input type="number" required value={minibusPrice} onChange={(e) => setMinibusPrice(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold text-[10px]">TİCARİ *</label>
                                        <input type="number" required value={ticariPrice} onChange={(e) => setTicariPrice(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold text-[10px]">MOTOSİKLET *</label>
                                        <input type="number" required value={motosikletPrice} onChange={(e) => setMotosikletPrice(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpenModal(false)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition"
                                >
                                    İptal
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
