const { useState, useMemo } = React;

import { parsePositiveNumber, VEHICLE_TYPES, formatCurrency } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fromLocalInput = (value, fallback) => {
    if (!value) return fallback;
    const d = new Date(value + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
};

const todayInput = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const addDaysInput = (days, fromInput) => {
    const base = fromInput ? new Date(fromInput + 'T00:00:00') : new Date();
    if (Number.isNaN(base.getTime())) return todayInput();
    base.setDate(base.getDate() + days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
};

const daysBetween = (startInput, endInput) => {
    if (!startInput || !endInput) return null;
    const a = new Date(startInput + 'T00:00:00').getTime();
    const b = new Date(endInput + 'T00:00:00').getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
};

const isExpired = (camp) => {
    if (!camp.endDate) return false;
    return new Date(camp.endDate).getTime() < Date.now();
};

const DURATION_PRESETS = [
    { id: 7, label: '7 Gün' },
    { id: 15, label: '15 Gün' },
    { id: 30, label: '30 Gün' },
    { id: 90, label: '3 Ay' }
];

export const CampaignsTab = ({
    campaigns,
    setCampaigns,
    services,
    showNotification
}) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editId, setEditId] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('PERCENTAGE');
    const [value, setValue] = useState(10);
    const [vehicleClasses, setVehicleClasses] = useState([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [startDate, setStartDate] = useState(todayInput());
    const [endDate, setEndDate] = useState(addDaysInput(15));
    const [openEnded, setOpenEnded] = useState(false);
    const [minSpend, setMinSpend] = useState(0);
    const [formError, setFormError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetId: null });

    const resetForm = () => {
        setEditId('');
        setName('');
        setType('PERCENTAGE');
        setValue(10);
        setVehicleClasses([]);
        setSelectedServiceIds([]);
        setStartDate(todayInput());
        setEndDate(addDaysInput(15));
        setOpenEnded(false);
        setMinSpend(0);
        setFormError('');
    };

    const closeModal = () => {
        setIsOpenModal(false);
        resetForm();
    };

    const openNew = () => {
        resetForm();
        setIsOpenModal(true);
    };

    const openEdit = (camp) => {
        setEditId(camp.id);
        setName(camp.name || '');
        setType(camp.type || 'PERCENTAGE');
        setValue(camp.value || 0);
        setVehicleClasses(Array.isArray(camp.applicableVehicleTypes) ? [...camp.applicableVehicleTypes] : []);
        setSelectedServiceIds(Array.isArray(camp.applicableServices) ? [...camp.applicableServices] : []);
        setStartDate(toLocalInput(camp.startDate) || todayInput());
        setEndDate(toLocalInput(camp.endDate) || addDaysInput(15));
        setOpenEnded(!camp.endDate);
        setMinSpend(camp.minSpend || 0);
        setFormError('');
        setIsOpenModal(true);
    };

    const toggleVehicle = (id) => {
        setVehicleClasses(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    const toggleService = (id) => {
        setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const applyDurationPreset = (days) => {
        setOpenEnded(false);
        setEndDate(addDaysInput(days, startDate));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        if (!name.trim()) {
            setFormError('Kampanya adı zorunludur.');
            showNotification('Kampanya adı zorunludur.', 'error');
            return;
        }

        const numericValue = parsePositiveNumber(value);
        if (numericValue <= 0) {
            setFormError('İndirim değeri sıfırdan büyük olmalıdır.');
            showNotification('İndirim değeri sıfırdan büyük olmalıdır.', 'error');
            return;
        }
        if (type === 'PERCENTAGE' && numericValue > 90) {
            setFormError('Yüzde indirimi en fazla 90 olabilir.');
            showNotification('Yüzde indirimi en fazla 90 olabilir.', 'error');
            return;
        }

        const startIso = fromLocalInput(startDate, new Date().toISOString());
        const endIso = openEnded
            ? null
            : fromLocalInput(endDate, new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString());

        if (endIso && new Date(endIso).getTime() < new Date(startIso).getTime()) {
            setFormError('Bitiş tarihi başlangıçtan önce olamaz.');
            showNotification('Bitiş tarihi başlangıçtan önce olamaz.', 'error');
            return;
        }

        const payload = {
            name: name.trim(),
            type,
            value: numericValue,
            startDate: startIso,
            endDate: endIso,
            isActive: true,
            applicableServices: selectedServiceIds,
            applicableVehicleTypes: vehicleClasses,
            minSpend: parsePositiveNumber(minSpend)
        };

        if (editId) {
            setCampaigns(prev => prev.map(c => c.id === editId ? { ...c, ...payload } : c));
            showNotification('Kampanya güncellendi.');
        } else {
            setCampaigns(prev => [{ id: generateUUID(), ...payload }, ...prev]);
            showNotification('Yeni kampanya aktif edildi.');
        }
        closeModal();
    };

    const toggleActive = (camp) => {
        setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, isActive: !c.isActive } : c));
        showNotification(camp.isActive ? 'Kampanya durduruldu.' : 'Kampanya yeniden aktif edildi.');
    };

    const requestDelete = (id) => setDeleteConfirm({ isOpen: true, targetId: id });

    const confirmDelete = () => {
        setCampaigns(prev => prev.filter(c => c.id !== deleteConfirm.targetId));
        setDeleteConfirm({ isOpen: false, targetId: null });
        showNotification('Kampanya silindi.', 'warning');
    };

    const previewVehicleLabels = useMemo(() => {
        if (vehicleClasses.length === 0) return 'Tüm Araçlar';
        return vehicleClasses
            .map(id => VEHICLE_TYPES.find(v => v.id === id)?.label || id)
            .join(', ');
    }, [vehicleClasses]);

    const previewServiceLabels = useMemo(() => {
        if (selectedServiceIds.length === 0) return 'Tüm Hizmetler';
        if (selectedServiceIds.length === 1) {
            return services.find(s => s.id === selectedServiceIds[0])?.name || 'Hizmet';
        }
        return `${selectedServiceIds.length} hizmet seçildi`;
    }, [selectedServiceIds, services]);

    const durationDays = useMemo(() => {
        if (openEnded) return null;
        return daysBetween(startDate, endDate);
    }, [openEnded, startDate, endDate]);

    return (
        <div className="space-y-6 text-left">
            <CustomConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Kampanyayı Sil?"
                message="Bu kampanya kalıcı olarak kaldırılır. Geçmiş satışlardaki uygulanmış indirimler etkilenmez."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, targetId: null })}
            />

            <PageHeader
                title="İndirim & Kampanyalar"
                description="Satışlarda otomatik uygulanan sepet ve araç sınıfı indirimlerini belirleyin."
                actions={
                    <button type="button" onClick={openNew} className="btn btn-primary">
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
                        const serviceLabel = camp.applicableServices && camp.applicableServices.length > 0
                            ? (camp.applicableServices.length === 1
                                ? services.find(s => s.id === camp.applicableServices[0])?.name || 'Belirsiz Hizmet'
                                : `${camp.applicableServices.length} hizmet`)
                            : 'Tüm Hizmetler';
                        const expired = isExpired(camp);

                        return (
                            <div
                                key={camp.id}
                                className={`bg-darkBg-card border rounded-xl p-5 shadow space-y-3 transition ${
                                    expired
                                        ? 'border-red-500/30 opacity-70'
                                        : camp.isActive
                                            ? 'border-darkBg-border'
                                            : 'border-dashed border-amber-500/30 opacity-70'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-left space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-extrabold">
                                                {camp.type === 'PERCENTAGE' ? `% ${camp.value} İNDİRİM` : `${camp.value} ₺ İNDİRİM`}
                                            </span>
                                            {expired ? (
                                                <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded font-extrabold">SÜRESİ DOLDU</span>
                                            ) : camp.isActive ? (
                                                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-extrabold">AKTİF</span>
                                            ) : (
                                                <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-extrabold">DURDURULDU</span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-bold text-white">{camp.name}</h4>
                                        <div className="text-[10px] text-gray-400 space-y-0.5">
                                            <p>Araç: <span className="text-emerald-400 font-bold">{vehicleLabels}</span></p>
                                            <p>Hizmet: <span className="text-gray-200">{serviceLabel}</span></p>
                                            <p>
                                                Tarih: <span className="text-gray-200">{toLocalInput(camp.startDate) || '—'}</span>
                                                {' → '}
                                                <span className="text-gray-200">{camp.endDate ? toLocalInput(camp.endDate) : 'Süresiz'}</span>
                                            </p>
                                            {camp.minSpend > 0 && (
                                                <p>Min. Sepet: <span className="text-gray-200">{formatCurrency(camp.minSpend)}</span></p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-darkBg-border pt-2 flex flex-wrap gap-2 text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(camp)}
                                        className="flex-1 bg-brand-900/20 text-brand-400 hover:bg-brand-600 hover:text-white py-1.5 rounded font-bold transition"
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleActive(camp)}
                                        className={`flex-1 py-1.5 rounded font-bold transition ${
                                            camp.isActive
                                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white'
                                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                        }`}
                                    >
                                        {camp.isActive ? 'Durdur' : 'Aktifleştir'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => requestDelete(camp.id)}
                                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition"
                                        title="Kampanyayı Sil"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-darkBg-card border border-darkBg-border rounded-xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
                        {/* Modal başlık */}
                        <div className="px-6 py-4 border-b border-darkBg-border flex items-start justify-between gap-4 bg-gradient-to-r from-brand-900/30 via-darkBg-card to-darkBg-card">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0">
                                    <Icons.Percent />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-white truncate">
                                        {editId ? 'Kampanyayı Düzenle' : 'İndirim Kampanyası Tanımla'}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Satışta otomatik uygulanacak indirim kuralını adım adım yapılandırın.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white shrink-0 p-1 rounded hover:bg-darkBg-hover transition"
                                aria-label="Kapat"
                            >
                                <Icons.X />
                            </button>
                        </div>

                        {/* Form gövdesi */}
                        <form
                            id="campaign-form"
                            onSubmit={handleSubmit}
                            className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs"
                        >
                            {/* Bölüm: Temel Bilgi */}
                            <section className="space-y-2">
                                <header className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                    <span>Temel Bilgi</span>
                                </header>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Kampanya Adı *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Örn: Hafta İçi Sedan İndirimi"
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                            </section>

                            {/* Bölüm: İndirim */}
                            <section className="space-y-2">
                                <header className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                    <span>İndirim Yapısı</span>
                                </header>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setType('PERCENTAGE')}
                                        className={`p-3 rounded-lg border text-left transition ${
                                            type === 'PERCENTAGE'
                                                ? 'border-brand-500 bg-brand-500/10 text-white'
                                                : 'border-darkBg-border bg-darkBg-deep text-gray-300 hover:border-brand-500/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded flex items-center justify-center ${type === 'PERCENTAGE' ? 'bg-brand-500/20 text-brand-300' : 'bg-darkBg-card text-gray-400'}`}>
                                                <Icons.Percent />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs">Yüzde (%)</div>
                                                <div className="text-[10px] text-gray-400">Sepet üzerinden oransal</div>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('FIXED')}
                                        className={`p-3 rounded-lg border text-left transition ${
                                            type === 'FIXED'
                                                ? 'border-brand-500 bg-brand-500/10 text-white'
                                                : 'border-darkBg-border bg-darkBg-deep text-gray-300 hover:border-brand-500/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded flex items-center justify-center ${type === 'FIXED' ? 'bg-brand-500/20 text-brand-300' : 'bg-darkBg-card text-gray-400'}`}>
                                                <Icons.Wallet />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs">Sabit Tutar (₺)</div>
                                                <div className="text-[10px] text-gray-400">Fişten doğrudan düşer</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">İndirim Değeri *</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min={0}
                                            step={type === 'PERCENTAGE' ? '1' : '5'}
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 pr-10 rounded text-white focus:outline-none focus:border-brand-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none">
                                            {type === 'PERCENTAGE' ? '%' : '₺'}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Bölüm: Geçerlilik Tarihi */}
                            <section className="space-y-2">
                                <header className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                        <span>Geçerlilik</span>
                                    </div>
                                    <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={openEnded}
                                            onChange={(e) => setOpenEnded(e.target.checked)}
                                            className="accent-brand-500"
                                        />
                                        <span>Süresiz</span>
                                    </label>
                                </header>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold">Başlangıç</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-gray-400 block font-semibold">Bitiş</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            disabled={openEnded}
                                            className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {DURATION_PRESETS.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyDurationPreset(preset.id)}
                                            disabled={openEnded}
                                            className="px-2.5 py-1 text-[10px] rounded border border-darkBg-border bg-darkBg-deep text-gray-300 hover:border-brand-500/60 hover:text-brand-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            +{preset.label}
                                        </button>
                                    ))}
                                    {durationDays !== null && durationDays >= 0 && (
                                        <span className="ml-auto text-[10px] text-gray-500 self-center">
                                            Süre: <span className="text-gray-200 font-bold">{durationDays} gün</span>
                                        </span>
                                    )}
                                </div>
                            </section>

                            {/* Bölüm: Kapsam */}
                            <section className="space-y-3">
                                <header className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                    <span>Kapsam</span>
                                </header>

                                {/* Araç sınıfları */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-400 block font-semibold">Araç Sınıfları</label>
                                        <button
                                            type="button"
                                            onClick={() => setVehicleClasses([])}
                                            className="text-[10px] text-gray-500 hover:text-brand-300 transition"
                                        >
                                            Tümünü temizle
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {VEHICLE_TYPES.map(t => {
                                            const active = vehicleClasses.includes(t.id);
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => toggleVehicle(t.id)}
                                                    className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 ${
                                                        active
                                                            ? 'bg-brand-500/20 text-brand-200 border-brand-500'
                                                            : 'bg-darkBg-deep text-gray-300 border-darkBg-border hover:border-brand-500/40'
                                                    }`}
                                                >
                                                    {active && <span className="w-3 h-3 inline-flex items-center justify-center"><Icons.Check /></span>}
                                                    <span>{t.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        Boş bırakılırsa tüm araç sınıfları için geçerli olur.
                                    </p>
                                </div>

                                {/* Hizmetler */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-400 block font-semibold">Hizmetler</label>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedServiceIds([])}
                                            className="text-[10px] text-gray-500 hover:text-brand-300 transition"
                                        >
                                            Tümünü temizle
                                        </button>
                                    </div>
                                    {services.length === 0 ? (
                                        <p className="text-[10px] text-gray-500 italic bg-darkBg-deep border border-darkBg-border rounded p-2">
                                            Henüz tanımlı hizmet yok. Kampanya tüm hizmetlere uygulanır.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 -m-1">
                                            {services.map(s => {
                                                const active = selectedServiceIds.includes(s.id);
                                                return (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleService(s.id)}
                                                        className={`px-2.5 py-1.5 rounded text-[11px] font-bold border transition ${
                                                            active
                                                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/60'
                                                                : 'bg-darkBg-deep text-gray-300 border-darkBg-border hover:border-emerald-500/40'
                                                        }`}
                                                    >
                                                        {s.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-500">
                                        Boş bırakılırsa kampanya tüm hizmetlerde geçerli olur.
                                    </p>
                                </div>
                            </section>

                            {/* Bölüm: Koşul */}
                            <section className="space-y-2">
                                <header className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                    <span>Koşul</span>
                                </header>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Min. Sepet Tutarı</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={0}
                                            step="10"
                                            value={minSpend}
                                            onChange={(e) => setMinSpend(e.target.value)}
                                            className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 pr-10 rounded text-white focus:outline-none focus:border-brand-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none">₺</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        0 ise asgari sepet koşulu uygulanmaz.
                                    </p>
                                </div>
                            </section>

                            {/* Önizleme */}
                            <section className="space-y-2">
                                <header className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                    <span>Önizleme</span>
                                </header>
                                <div className="bg-darkBg-deep border border-darkBg-border rounded-lg p-3 space-y-1.5">
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-extrabold">
                                            {type === 'PERCENTAGE'
                                                ? `% ${parsePositiveNumber(value)} İNDİRİM`
                                                : `${parsePositiveNumber(value)} ₺ İNDİRİM`}
                                        </span>
                                        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-extrabold">
                                            AKTİF
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white">
                                        {name.trim() || 'Kampanya Adı'}
                                    </h4>
                                    <div className="text-[10px] text-gray-400 space-y-0.5">
                                        <p>Araç: <span className="text-emerald-400 font-bold">{previewVehicleLabels}</span></p>
                                        <p>Hizmet: <span className="text-gray-200">{previewServiceLabels}</span></p>
                                        <p>
                                            Tarih: <span className="text-gray-200">{startDate || '—'}</span>
                                            {' → '}
                                            <span className="text-gray-200">{openEnded ? 'Süresiz' : (endDate || '—')}</span>
                                        </p>
                                        {parsePositiveNumber(minSpend) > 0 && (
                                            <p>Min. Sepet: <span className="text-gray-200">{formatCurrency(parsePositiveNumber(minSpend))}</span></p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {formError && (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
                                    <span className="shrink-0 mt-0.5"><Icons.AlertTriangle /></span>
                                    <span>{formError}</span>
                                </div>
                            )}
                        </form>

                        {/* Sabit alt aksiyon çubuğu */}
                        <div className="px-6 py-3 border-t border-darkBg-border bg-darkBg-card flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition text-xs"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                form="campaign-form"
                                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition text-xs flex items-center justify-center gap-2"
                            >
                                <Icons.Check />
                                <span>{editId ? 'Güncelle' : 'Aktif Et'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
