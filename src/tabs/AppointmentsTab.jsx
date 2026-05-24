const { useState } = React;

import { normalizePlate, VEHICLE_TYPES, APPOINTMENT_STATUS } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Icons } from '../core/icons.jsx';

export const AppointmentsTab = ({ 
    appointments, 
    setAppointments, 
    customers, 
    setCustomers, 
    services, 
    setQuickPlateContext, 
    setActiveTab, 
    showNotification 
}) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [plate, setPlate] = useState('');
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('SEDAN');
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [datetime, setDatetime] = useState('');
    const [notes, setNotes] = useState('');

    const pendingApps = appointments.filter(a => a.status === APPOINTMENT_STATUS.PENDING);
    const completedApps = appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED);
    const cancelledApps = appointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED);

    const handleCreateAppointment = (e) => {
        e.preventDefault();
        if (!plate || !custName || !datetime) {
            showNotification("Plaka, Müşteri Adı ve Tarih zorunludur.", "error");
            return;
        }

        let customer = customers.find(c => normalizePlate(c.plate) === normalizePlate(plate));
        if (!customer) {
            customer = {
                id: generateUUID(),
                plate: normalizePlate(plate),
                name: custName,
                phone: custPhone || 'Belirtilmedi',
                vehicleType: vehicleType,
                createdAt: new Date().toISOString()
            };
            setCustomers(prev => [...prev, customer]);
        }

        const newApp = {
            id: generateUUID(),
            customerId: customer.id,
            serviceIds: selectedServiceIds,
            datetime: new Date(datetime).toISOString(),
            status: APPOINTMENT_STATUS.PENDING,
            notes: notes
        };

        setAppointments(prev => [newApp, ...prev]);
        showNotification("Randevu kaydı başarıyla oluşturuldu.");
        setIsOpenModal(false);
        
        setPlate('');
        setCustName('');
        setCustPhone('');
        setSelectedServiceIds([]);
        setDatetime('');
        setNotes('');
    };

    const changeStatus = (id, newStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        showNotification(`Randevu durumu '${newStatus}' olarak güncellendi.`);
    };

    const convertToSale = (app) => {
        const cust = customers.find(c => c.id === app.customerId);
        if (cust) {
            setQuickPlateContext(cust.plate);
            // Randevu durumunu hemen değiştirmiyoruz; satış tamamlandığında manuel olarak
            // "Tamamlandı" işaretlenebilir. Bu sayede satış iptal edilirse randevu kuyrukta kalır.
            setActiveTab('sales');
        }
    };

    return (
        <div className="space-y-6 text-left">
            <PageHeader
                title="Randevu Defteri"
                description="Gelecek rezervasyonları ve aktif iş kuyruğunu yönetin."
                actions={
                    <button
                        type="button"
                        onClick={() => setIsOpenModal(true)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
                    >
                        <Icons.Plus />
                        <span>Yeni Randevu Al</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                        <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block"></span>
                            <span>Sırada Bekleyenler</span>
                        </h3>
                        <span className="text-xs font-extrabold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full">{pendingApps.length}</span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {pendingApps.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-10">Kuyrukta randevu bulunmuyor.</p>
                        ) : (
                            pendingApps.map(app => {
                                const cust = customers.find(c => c.id === app.customerId);
                                const srvNames = app.serviceIds.map(id => services.find(s => s.id === id)?.name || 'Hizmet').join(', ');
                                return (
                                    <div key={app.id} className="bg-darkBg-deep border border-darkBg-border p-4 rounded-lg space-y-3 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded text-xs uppercase tracking-wider">{cust?.plate || 'PLAKA YOK'}</span>
                                            <span className="text-[10px] text-gray-400 font-semibold">{new Date(app.datetime).toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-200">{cust?.name || 'Bilinmiyor'}</p>
                                            <p className="text-gray-400 mt-0.5">{cust?.phone}</p>
                                            <p className="text-gray-500 italic mt-1 font-medium">{srvNames}</p>
                                            {app.notes && <p className="text-amber-500/80 bg-amber-500/5 p-1.5 rounded mt-2 border border-amber-500/10 text-[10px]">Not: {app.notes}</p>}
                                        </div>
                                        <div className="flex space-x-2 border-t border-darkBg-border pt-2">
                                            <button 
                                                type="button"
                                                onClick={() => convertToSale(app)}
                                                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-1.5 rounded font-bold text-[10px] transition text-center"
                                            >
                                                Hizmete Dönüştür
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(app.id, APPOINTMENT_STATUS.COMPLETED)}
                                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 rounded transition"
                                                title="Tamamlandı İşaretle"
                                            >
                                                <Icons.Check />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => changeStatus(app.id, APPOINTMENT_STATUS.CANCELLED)}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded transition"
                                                title="Randevuyu İptal Et"
                                            >
                                                <Icons.X />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                        <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block"></span>
                            <span>Başarıyla Tamamlananlar</span>
                        </h3>
                        <span className="text-xs font-extrabold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full">{completedApps.length}</span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {completedApps.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-10">Tamamlanan randevu yok.</p>
                        ) : (
                            completedApps.map(app => {
                                const cust = customers.find(c => c.id === app.customerId);
                                return (
                                    <div key={app.id} className="bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-xs opacity-75">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded uppercase tracking-wider">{cust?.plate}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(app.datetime).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <p className="font-bold text-gray-300 mt-2">{cust?.name}</p>
                                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1"><Icons.Check /> Tamamlandı</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                        <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block"></span>
                            <span>İptal Edilenler</span>
                        </h3>
                        <span className="text-xs font-extrabold bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full">{cancelledApps.length}</span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {cancelledApps.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-10">İptal edilen kayıt yok.</p>
                        ) : (
                            cancelledApps.map(app => {
                                const cust = customers.find(c => c.id === app.customerId);
                                return (
                                    <div key={app.id} className="bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-xs opacity-60">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded uppercase tracking-wider">{cust?.plate}</span>
                                            <button 
                                                type="button"
                                                onClick={() => changeStatus(app.id, APPOINTMENT_STATUS.PENDING)}
                                                className="text-[10px] text-brand-400 hover:underline"
                                            >
                                                Kuyruğa Geri Al
                                            </button>
                                        </div>
                                        <p className="font-bold text-gray-400 mt-2">{cust?.name}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                            <h3 className="text-base font-bold text-white">Yeni Randevu Kaydet</h3>
                            <button type="button" onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-white">
                                <Icons.X />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Araç Plakası *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={plate}
                                        onChange={(e) => setPlate(normalizePlate(e.target.value))}
                                        placeholder="Örn: 34ABC123" 
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Müşteri Ad Soyadı *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={custName}
                                        onChange={(e) => setCustName(e.target.value)}
                                        placeholder="Ahmet Yılmaz" 
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Telefon Numarası</label>
                                    <input 
                                        type="text" 
                                        value={custPhone}
                                        onChange={(e) => setCustPhone(e.target.value)}
                                        placeholder="05..." 
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Araç Tipi</label>
                                    <select 
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    >
                                        {VEHICLE_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label.toLocaleUpperCase('tr-TR')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Randevu Tarih & Saat *</label>
                                <input 
                                    type="datetime-local" 
                                    required 
                                    value={datetime}
                                    onChange={(e) => setDatetime(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Randevu Hizmetleri</label>
                                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto bg-darkBg-deep p-2.5 border border-darkBg-border rounded">
                                    {services.map(srv => {
                                        const isChecked = selectedServiceIds.includes(srv.id);
                                        return (
                                            <label key={srv.id} className="flex items-center space-x-2 text-[10px] text-gray-300 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        if (isChecked) {
                                                            setSelectedServiceIds(prev => prev.filter(id => id !== srv.id));
                                                        } else {
                                                            setSelectedServiceIds(prev => [...prev, srv.id]);
                                                        }
                                                    }}
                                                    className="rounded bg-darkBg-deep border-gray-700 text-brand-500 focus:ring-brand-500"
                                                />
                                                <span className="truncate">{srv.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Randevu Notları</label>
                                <textarea 
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="İstediği saatte gelsin vb."
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none focus:border-brand-500 resize-none"
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpenModal(false)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition"
                                >
                                    Vazgeç
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
