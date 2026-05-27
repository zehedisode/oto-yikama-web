const { useState, useMemo } = React;

import { normalizePlate, VEHICLE_TYPES, APPOINTMENT_STATUS } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Icons } from '../core/icons.jsx';

const formatDateTime = (iso) => {
    try { return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return ''; }
};

const formatRelative = (iso) => {
    const target = new Date(iso).getTime();
    if (!Number.isFinite(target)) return '';
    const diffMin = Math.round((target - Date.now()) / 60000);
    if (Math.abs(diffMin) < 60) return diffMin === 0 ? 'şimdi' : (diffMin > 0 ? `${diffMin} dk sonra` : `${-diffMin} dk önce`);
    const diffH = Math.round(diffMin / 60);
    if (Math.abs(diffH) < 24) return diffH > 0 ? `${diffH} sa sonra` : `${-diffH} sa önce`;
    const diffD = Math.round(diffH / 24);
    return diffD > 0 ? `${diffD} gün sonra` : `${-diffD} gün önce`;
};

const ColumnHeader = ({ label, count, accent }) => {
    const dotClass = `status-dot status-dot-${accent}`;
    const pillClass = `pill pill-${accent}`;
    return (
        <div className="flex justify-between items-center pb-3 border-b border-darkBg-border">
            <div className="flex items-center gap-2">
                <span className={dotClass} />
                <span className="section-title text-[13px]">{label}</span>
            </div>
            <span className={pillClass}>{count}</span>
        </div>
    );
};

const PendingCard = ({ app, cust, srvNames, onConvert, onComplete, onCancel }) => (
    <div className="surface-card rounded-xl p-3.5 space-y-3 text-xs">
        <div className="flex justify-between items-center gap-2">
            <span className="plate-chip">{cust?.plate || 'PLAKA YOK'}</span>
            <div className="text-right">
                <span className="block font-mono-num text-[11px] text-gray-200 font-bold">{formatDateTime(app.datetime)}</span>
                <span className="block text-[9px] text-amber-300/80 font-bold uppercase tracking-wider">{formatRelative(app.datetime)}</span>
            </div>
        </div>
        <div>
            <p className="font-bold text-white truncate">{cust?.name || 'Bilinmiyor'}</p>
            <p className="text-gray-400 mt-0.5 font-mono-num">{cust?.phone}</p>
            {srvNames && <p className="text-gray-500 italic mt-1.5 leading-snug">{srvNames}</p>}
            {app.notes && (
                <p className="bg-amber-500/10 text-amber-200 border border-amber-500/20 rounded p-1.5 mt-2 text-[10px] leading-snug">
                    <span className="font-bold uppercase tracking-wider text-amber-300/90 mr-1">Not</span>{app.notes}
                </p>
            )}
        </div>
        <div className="flex gap-1.5 border-t border-darkBg-border pt-2.5">
            <button type="button" onClick={onConvert} className="btn btn-success flex-1 text-[10px] py-1.5">
                Hizmete Dönüştür
            </button>
            <button type="button" onClick={onComplete} className="btn btn-icon" title="Tamamlandı">
                <Icons.Check />
            </button>
            <button type="button" onClick={onCancel} className="btn btn-icon hover:!text-rose-300" title="İptal">
                <Icons.X />
            </button>
        </div>
    </div>
);

export const AppointmentsTab = ({
    appointments,
    setAppointments,
    customers,
    setCustomers,
    services,
    setQuickPlateContext,
    setPendingFromAppointment,
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

    const buckets = useMemo(() => ({
        pending: appointments.filter(a => a.status === APPOINTMENT_STATUS.PENDING)
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
        completed: appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED)
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)),
        cancelled: appointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED)
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    }), [appointments]);

    const resetForm = () => {
        setPlate('');
        setCustName('');
        setCustPhone('');
        setSelectedServiceIds([]);
        setDatetime('');
        setNotes('');
        setVehicleType('SEDAN');
    };

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
                vehicleType,
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
            notes
        };

        setAppointments(prev => [newApp, ...prev]);
        showNotification("Randevu kaydı başarıyla oluşturuldu.");
        setIsOpenModal(false);
        resetForm();
    };

    const changeStatus = (id, newStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        showNotification(`Randevu durumu '${newStatus}' olarak güncellendi.`);
    };

    const convertToSale = (app) => {
        const cust = customers.find(c => c.id === app.customerId);
        if (cust) {
            setQuickPlateContext(cust.plate);
            if (typeof setPendingFromAppointment === 'function') {
                setPendingFromAppointment({
                    appointmentId: app.id,
                    serviceIds: Array.isArray(app.serviceIds) ? app.serviceIds : [],
                    notes: app.notes || ''
                });
            }
            setActiveTab('sales');
        }
    };

    return (
        <div className="space-y-6 text-left">
            <PageHeader
                title="Randevu Defteri"
                description="Gelecek rezervasyonları takip edin, gelenleri tek tıkla hizmete dönüştürün."
                actions={
                    <button type="button" onClick={() => setIsOpenModal(true)} className="btn btn-primary">
                        <Icons.Plus />
                        <span>Yeni Randevu Al</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending */}
                <div className="surface-card rounded-2xl p-4 space-y-3">
                    <ColumnHeader label="Sırada Bekleyenler" count={buckets.pending.length} accent="amber" />
                    <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                        {buckets.pending.length === 0 ? (
                            <p className="empty-state">Kuyrukta randevu bulunmuyor.</p>
                        ) : (
                            buckets.pending.map(app => {
                                const cust = customers.find(c => c.id === app.customerId);
                                const srvNames = (app.serviceIds || []).map(id => services.find(s => s.id === id)?.name || 'Hizmet').join(' · ');
                                return (
                                    <PendingCard
                                        key={app.id}
                                        app={app}
                                        cust={cust}
                                        srvNames={srvNames}
                                        onConvert={() => convertToSale(app)}
                                        onComplete={() => changeStatus(app.id, APPOINTMENT_STATUS.COMPLETED)}
                                        onCancel={() => changeStatus(app.id, APPOINTMENT_STATUS.CANCELLED)}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Completed */}
                <div className="surface-card rounded-2xl p-4 space-y-3">
                    <ColumnHeader label="Tamamlananlar" count={buckets.completed.length} accent="emerald" />
                    <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                        {buckets.completed.length === 0 ? (
                            <p className="empty-state">Tamamlanan randevu yok.</p>
                        ) : (
                            buckets.completed.map(app => {
                                const cust = customers.find(c => c.id === app.customerId);
                                return (
                                    <div key={app.id} className="bg-darkBg-deep border border-darkBg-border rounded-lg p-3 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="plate-chip">{cust?.plate || '—'}</span>
                                            <span className="text-[10px] text-gray-500 font-mono-num">{formatDateTime(app.datetime)}</span>
                                        </div>
                                        <p className="font-bold text-gray-200 mt-1.5 truncate">{cust?.name || 'Bilinmiyor'}</p>
                                        <span className="pill pill-emerald mt-1.5"><Icons.Check />Tamamlandı</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Cancelled */}
                <div className="surface-card rounded-2xl p-4 space-y-3">
                    <ColumnHeader label="İptal Edilenler" count={buckets.cancelled.length} accent="rose" />
                    <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                        {buckets.cancelled.length === 0 ? (
                            <p className="empty-state">İptal edilen kayıt yok.</p>
                        ) : (
                            buckets.cancelled.map(app => {
                                const cust = customers.find(c => c.id === app.customerId);
                                return (
                                    <div key={app.id} className="bg-darkBg-deep border border-darkBg-border rounded-lg p-3 text-xs opacity-80">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="plate-chip" style={{ filter: 'grayscale(0.4)' }}>{cust?.plate || '—'}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(app.id, APPOINTMENT_STATUS.PENDING)}
                                                className="text-[10px] text-brand-300 hover:text-brand-200 underline-offset-2 hover:underline"
                                            >
                                                Kuyruğa al
                                            </button>
                                        </div>
                                        <p className="font-bold text-gray-300 mt-1.5 truncate">{cust?.name || 'Bilinmiyor'}</p>
                                        <span className="pill pill-rose mt-1.5">İptal</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isOpenModal}
                onClose={() => { setIsOpenModal(false); resetForm(); }}
                title="Yeni Randevu Kaydet"
                kicker="Rezervasyon"
                description="Plakayı kontrol edin; sistemde varsa müşteri otomatik bağlanır."
                icon={<Icons.Calendar />}
                size="lg"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => { setIsOpenModal(false); resetForm(); }} className="btn btn-ghost flex-1">
                            Vazgeç
                        </button>
                        <button type="submit" form="appt-form" className="btn btn-primary flex-1">
                            Randevuyu Kaydet
                        </button>
                    </div>
                }
            >
                <form id="appt-form" onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="field-label">Plaka *</label>
                            <input
                                type="text"
                                required
                                value={plate}
                                onChange={(e) => setPlate(normalizePlate(e.target.value))}
                                placeholder="34 ABC 123"
                                className="field font-mono-num text-center uppercase tracking-[0.2em] text-base"
                            />
                        </div>
                        <div>
                            <label className="field-label">Ad Soyad *</label>
                            <input
                                type="text"
                                required
                                value={custName}
                                onChange={(e) => setCustName(e.target.value)}
                                placeholder="Ahmet Yılmaz"
                                className="field"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="field-label">Telefon</label>
                            <input
                                type="text"
                                value={custPhone}
                                onChange={(e) => setCustPhone(e.target.value)}
                                placeholder="05..."
                                className="field font-mono-num"
                            />
                        </div>
                        <div>
                            <label className="field-label">Araç Tipi</label>
                            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="field">
                                {VEHICLE_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="field-label">Randevu Tarihi & Saati *</label>
                        <input
                            type="datetime-local"
                            required
                            value={datetime}
                            onChange={(e) => setDatetime(e.target.value)}
                            className="field font-mono-num"
                        />
                    </div>

                    <div>
                        <label className="field-label">Hizmetler</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto bg-darkBg-deep p-2 border border-darkBg-border rounded-lg">
                            {services.length === 0 && (
                                <p className="empty-state col-span-2">Önce katalogda hizmet tanımlamalısınız.</p>
                            )}
                            {services.map(srv => {
                                const checked = selectedServiceIds.includes(srv.id);
                                return (
                                    <label
                                        key={srv.id}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-[11px] transition ${
                                            checked ? 'bg-brand-500/15 text-brand-100 ring-1 ring-brand-500/30' : 'text-gray-300 hover:bg-darkBg-hover'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                                setSelectedServiceIds(prev =>
                                                    checked ? prev.filter(id => id !== srv.id) : [...prev, srv.id]
                                                );
                                            }}
                                            className="rounded bg-darkBg-deep border-gray-700 text-brand-500 focus:ring-brand-500"
                                        />
                                        <span className="truncate">{srv.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="field-label">Not (opsiyonel)</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Saat 11'den önce gelmesin vb."
                            className="field resize-none"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};
