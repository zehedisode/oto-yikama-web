const { useState, useMemo } = React;

import { parsePositiveNumber, parsePositiveInteger, formatCurrency, VEHICLE_TYPES } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Icons } from '../core/icons.jsx';

const DEFAULT_PRICES = { SEDAN: 500, SUV: 600, MINIBUS: 700, TICARI: 640, MOTOSIKLET: 300 };

export const ServicesTab = ({ services, setServices, showNotification }) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editId, setEditId] = useState('');
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(true);

    const [srvName, setSrvName] = useState('');
    const [duration, setDuration] = useState(45);
    const [prices, setPrices] = useState(DEFAULT_PRICES);

    const filtered = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr-TR');
        return services.filter(s => {
            if (!showInactive && !s.isActive) return false;
            if (term && !s.name.toLocaleLowerCase('tr-TR').includes(term)) return false;
            return true;
        });
    }, [services, search, showInactive]);

    const resetForm = () => {
        setEditId('');
        setSrvName('');
        setDuration(45);
        setPrices(DEFAULT_PRICES);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!srvName.trim()) {
            showNotification("Hizmet adı girilmelidir.", "error");
            return;
        }

        const pricesObj = Object.fromEntries(
            VEHICLE_TYPES.map(t => [t.id, parsePositiveNumber(prices[t.id])])
        );
        const payload = {
            name: srvName.trim(),
            duration: parsePositiveInteger(duration, 45),
            prices: pricesObj
        };

        if (editId) {
            setServices(prev => prev.map(s => s.id === editId ? { ...s, ...payload } : s));
            showNotification("Hizmet başarıyla güncellendi.");
        } else {
            setServices(prev => [...prev, { id: generateUUID(), ...payload, isActive: true }]);
            showNotification("Yeni hizmet kataloğa eklendi.");
        }
        setIsOpenModal(false);
        resetForm();
    };

    const openEdit = (srv) => {
        setEditId(srv.id);
        setSrvName(srv.name);
        setDuration(srv.duration);
        setPrices({ ...DEFAULT_PRICES, ...(srv.prices || {}) });
        setIsOpenModal(true);
    };

    const openNew = () => {
        resetForm();
        setIsOpenModal(true);
    };

    const toggleActive = (id, current) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !current } : s));
        showNotification("Hizmet durumu güncellendi.");
    };

    return (
        <div className="space-y-6 text-left">
            <PageHeader
                title="Hizmet Kataloğu"
                description="Yıkama paketleri ve araç sınıflarına göre fiyat listesi."
                actions={
                    <button type="button" onClick={openNew} className="btn btn-primary">
                        <Icons.Plus />
                        <span>Paket Ekle</span>
                    </button>
                }
            />

            {/* Search + filter bar */}
            <div className="surface-card rounded-xl p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icons.Search /></span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hizmet adında ara..."
                        className="field pl-10"
                    />
                </div>
                <div className="segment shrink-0">
                    <button type="button" data-active={showInactive} onClick={() => setShowInactive(true)}>Tümü</button>
                    <button type="button" data-active={!showInactive} onClick={() => setShowInactive(false)}>Sadece Aktif</button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="surface-card rounded-2xl p-10 text-center">
                    <span className="inline-flex w-12 h-12 mx-auto rounded-full bg-darkBg-deep border border-darkBg-border items-center justify-center text-gray-500 mb-2">
                        <Icons.Clipboard />
                    </span>
                    <p className="text-sm text-gray-300 font-bold">Aramaya uygun hizmet yok</p>
                    <p className="empty-state mt-1">Yeni paket ekleyerek kataloğunuzu oluşturun.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(srv => {
                        const priceList = VEHICLE_TYPES.map(t => ({ ...t, price: srv.prices?.[t.id] || 0 }));
                        const minPrice = Math.min(...priceList.map(p => p.price).filter(v => v > 0));
                        const maxPrice = Math.max(...priceList.map(p => p.price));
                        return (
                            <div
                                key={srv.id}
                                className={`surface-card rounded-xl p-5 flex flex-col gap-4 transition ${srv.isActive ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-[15px] font-extrabold text-white truncate" style={{ fontFamily: '"Bricolage Grotesque", sans-serif', letterSpacing: '-0.01em' }}>
                                            {srv.name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                                            <span className="inline-flex items-center gap-1"><Icons.Calendar /><span className="font-mono-num">{srv.duration} dk</span></span>
                                            <span className="inline-flex items-center gap-1 font-mono-num text-emerald-300">
                                                {minPrice === maxPrice
                                                    ? formatCurrency(maxPrice)
                                                    : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`pill ${srv.isActive ? 'pill-emerald' : 'pill-rose'}`}>
                                        {srv.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>

                                <div className="bg-darkBg-deep rounded-lg border border-darkBg-border divide-y divide-darkBg-border/60">
                                    {priceList.map(p => (
                                        <div key={p.id} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                                            <span className="text-gray-400 uppercase tracking-wider">{p.label}</span>
                                            <span className="font-mono-num font-bold text-gray-100">{formatCurrency(p.price)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-darkBg-border pt-3 flex gap-2">
                                    <button type="button" onClick={() => openEdit(srv)} className="btn btn-soft flex-1 text-xs py-1.5">
                                        Düzenle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleActive(srv.id, srv.isActive)}
                                        className={`btn flex-1 text-xs py-1.5 ${srv.isActive ? 'btn-ghost hover:!text-rose-200' : 'btn-success'}`}
                                    >
                                        {srv.isActive ? 'Durdur' : 'Aktifleştir'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isOpenModal}
                onClose={() => { setIsOpenModal(false); resetForm(); }}
                title={editId ? 'Hizmet Paketini Düzenle' : 'Kataloğa Yeni Hizmet Ekle'}
                kicker={editId ? 'Düzenle' : 'Yeni paket'}
                description="Araç sınıflarına göre fiyatları belirleyin. Boşluk bırakılan sınıflar 0 ₺ olarak kaydedilir."
                icon={<Icons.Clipboard />}
                size="lg"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => { setIsOpenModal(false); resetForm(); }} className="btn btn-ghost flex-1">
                            İptal
                        </button>
                        <button type="submit" form="srv-form" className="btn btn-primary flex-1">
                            {editId ? 'Güncelle' : 'Kaydet'}
                        </button>
                    </div>
                }
            >
                <form id="srv-form" onSubmit={handleSave} className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="field-label">Paket Adı *</label>
                            <input
                                type="text"
                                required
                                value={srvName}
                                onChange={(e) => setSrvName(e.target.value)}
                                placeholder="Örn: Premium İç-Dış"
                                className="field"
                            />
                        </div>
                        <div>
                            <label className="field-label">Süre (dk) *</label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="field font-mono-num text-center"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="section-kicker"><span className="status-dot status-dot-brand" />Araç Sınıfı Fiyatları (₺)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {VEHICLE_TYPES.map(t => (
                                <div key={t.id}>
                                    <label className="field-label">{t.label}</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={prices[t.id] ?? 0}
                                        onChange={(e) => setPrices(prev => ({ ...prev, [t.id]: e.target.value }))}
                                        className="field font-mono-num text-right"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
