const { useState } = React;

import { parsePositiveNumber, VEHICLE_TYPES } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Icons } from '../core/icons.jsx';

export const CampaignsTab = ({ 
    campaigns, 
    setCampaigns, 
    services, 
    showNotification 
}) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('PERCENTAGE');
    const [value, setValue] = useState(10);
    const [vehicleClass, setVehicleClass] = useState('SUV');
    const [selectedServiceId, setSelectedServiceId] = useState('');

    const handleCreateCampaign = (e) => {
        e.preventDefault();
        if (!name) return;

        const newCamp = {
            id: generateUUID(),
            name,
            type,
            value: parsePositiveNumber(value),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 15*24*60*60*1000).toISOString(),
            isActive: true,
            applicableServices: selectedServiceId ? [selectedServiceId] : [],
            applicableVehicleTypes: vehicleClass ? [vehicleClass] : [],
            minSpend: 0
        };

        setCampaigns(prev => [newCamp, ...prev]);
        showNotification("Yeni kampanya aktif edildi.");
        setIsOpenModal(false);

        setName('');
    };

    const deleteCampaign = (id) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        showNotification("Kampanya silindi.", "warning");
    };

    return (
        <div className="space-y-6 text-left">
            <PageHeader
                title="İndirim & Kampanyalar"
                description="Satışlarda otomatik uygulanan sepet ve araç sınıfı indirimlerini belirleyin."
                actions={
                    <button
                        type="button"
                        onClick={() => setIsOpenModal(true)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
                    >
                        <Icons.Plus />
                        <span>Yeni Kampanya Kur</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-10 col-span-2">Kayıtlı aktif kampanya bulunmuyor.</p>
                ) : (
                    campaigns.map(camp => {
                        const vehicleLabels = (camp.applicableVehicleTypes && camp.applicableVehicleTypes.length > 0)
                            ? camp.applicableVehicleTypes
                                .map(id => VEHICLE_TYPES.find(v => v.id === id)?.label || id)
                                .join(', ')
                            : 'Tümü';
                        return (
                            <div key={camp.id} className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex justify-between items-start shadow">
                                <div className="text-left space-y-2">
                                    <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-extrabold">
                                        {camp.type === 'PERCENTAGE' ? `% ${camp.value} İNDİRİM` : `${camp.value} ₺ İNDİRİM`}
                                    </span>
                                    <h4 className="text-sm font-bold text-white">{camp.name}</h4>
                                    <p className="text-[10px] text-gray-400">Hedef Araç Tipi: <span className="text-emerald-400 font-bold">{vehicleLabels}</span></p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => deleteCampaign(camp.id)}
                                    className="text-gray-500 hover:text-red-400 transition"
                                >
                                    <Icons.Trash />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs">
                        <h3 className="text-base font-bold text-white">İndirim Kampanyası Tanımla</h3>
                        
                        <form onSubmit={handleCreateCampaign} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Kampanya Adı *</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Hafta İçi Sedan İndirimi" className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Tipi</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white">
                                        <option value="PERCENTAGE">Yüzde (%)</option>
                                        <option value="FIXED">Sabit Tutar (₺)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">İndirim Değeri *</label>
                                    <input type="number" required value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Uygulanacak Araç Sınıfı</label>
                                <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white">
                                    <option value="">Tüm Araç Tipleri</option>
                                    {VEHICLE_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.label.toLocaleUpperCase('tr-TR')}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Özel Hizmet İlişkisi</label>
                                <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white">
                                    <option value="">Tüm Hizmetlerde Geçerli</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setIsOpenModal(false)} className="flex-1 bg-gray-800 p-2.5 rounded font-bold">Vazgeç</button>
                                <button type="submit" className="flex-1 bg-brand-600 p-2.5 rounded font-bold">Aktif Et</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
