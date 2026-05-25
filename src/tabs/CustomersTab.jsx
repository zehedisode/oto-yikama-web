const { useState, useMemo } = React;

import { VEHICLE_TYPES, normalizePlate, formatCurrency, computeLoyaltyStats } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

const initials = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toLocaleUpperCase('tr-TR');
};

const SORT_OPTIONS = [
    { id: 'recent', label: 'En Yeni' },
    { id: 'visits', label: 'Çok Ziyaret' },
    { id: 'loyalty', label: 'Sadakat' },
    { id: 'name', label: 'Ad (A-Z)' }
];

// Daire şeklinde sadakat ilerleme indikatörü
const LoyaltyRing = ({ progress, target, ready }) => {
    const r = 22;
    const c = 2 * Math.PI * r;
    const pct = ready ? 1 : Math.min(progress / target, 1);
    const offset = c * (1 - pct);
    return (
        <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                <circle cx="30" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-darkBg-deep" />
                <circle
                    cx="30"
                    cy="30"
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    className={ready ? 'text-emerald-400' : 'text-brand-500'}
                    style={{ transition: 'stroke-dashoffset 400ms' }}
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-extrabold ${ready ? 'text-emerald-300' : 'text-white'}`}>
                {ready ? '✓' : `${progress}/${target}`}
            </span>
        </div>
    );
};

export const CustomersTab = ({
    customers,
    setCustomers,
    transactions,
    setTransactions,
    appointments,
    setAppointments,
    sales,
    setSales,
    products,
    setProducts,
    services,
    settings,
    showNotification
}) => {
    const loyaltyTarget = settings?.loyalty_target_visits || 5;
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [showOnlyReady, setShowOnlyReady] = useState(false);
    const [sortBy, setSortBy] = useState('recent');

    const [viewHistoryCust, setViewHistoryCust] = useState(null);
    const [editCustomer, setEditCustomer] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPlate, setEditPlate] = useState('');
    const [editVehicleType, setEditVehicleType] = useState('SEDAN');

    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetId: null });

    const customerStats = useMemo(() => {
        const map = new Map();
        customers.forEach(c => {
            const stats = computeLoyaltyStats(c.id, transactions, loyaltyTarget);
            const completedTx = transactions.filter(t => t.customerId === c.id && t.status === 'COMPLETED');
            const totalSpent = completedTx.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
            const lastVisit = completedTx.reduce((latest, t) => {
                const d = new Date(t.date).getTime();
                return d > latest ? d : latest;
            }, 0);
            map.set(c.id, { stats, totalSpent, lastVisit, visitCount: completedTx.length });
        });
        return map;
    }, [customers, transactions, loyaltyTarget]);

    const summary = useMemo(() => {
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        let readyCount = 0;
        let newThisMonth = 0;
        let totalVisits = 0;
        customers.forEach(c => {
            const meta = customerStats.get(c.id);
            if (meta?.stats.ready) readyCount += 1;
            if (new Date(c.createdAt).getTime() >= monthAgo) newThisMonth += 1;
            totalVisits += meta?.visitCount || 0;
        });
        return {
            total: customers.length,
            readyCount,
            newThisMonth,
            avgVisits: customers.length > 0 ? (totalVisits / customers.length) : 0
        };
    }, [customers, customerStats]);

    const filteredCustomers = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr-TR');
        let list = customers.filter(c => {
            const meta = customerStats.get(c.id);
            const haystack = `${c.name} ${c.plate} ${c.phone}`.toLocaleLowerCase('tr-TR');
            if (term && !haystack.includes(term)) return false;
            if (filterType !== 'ALL' && c.vehicleType !== filterType) return false;
            if (showOnlyReady && !meta?.stats.ready) return false;
            return true;
        });

        list.sort((a, b) => {
            const ma = customerStats.get(a.id);
            const mb = customerStats.get(b.id);
            switch (sortBy) {
                case 'visits':
                    return (mb?.visitCount || 0) - (ma?.visitCount || 0);
                case 'loyalty': {
                    const ra = ma?.stats.ready ? 1000 : (ma?.stats.progress || 0);
                    const rb = mb?.stats.ready ? 1000 : (mb?.stats.progress || 0);
                    return rb - ra;
                }
                case 'name':
                    return a.name.localeCompare(b.name, 'tr-TR');
                case 'recent':
                default:
                    return (mb?.lastVisit || new Date(b.createdAt).getTime()) - (ma?.lastVisit || new Date(a.createdAt).getTime());
            }
        });

        return list;
    }, [customers, customerStats, search, filterType, showOnlyReady, sortBy]);

    const openEditCustomer = (customer) => {
        setEditCustomer(customer);
        setEditName(customer.name || '');
        setEditPhone(customer.phone || '');
        setEditPlate(customer.plate || '');
        setEditVehicleType(customer.vehicleType || 'SEDAN');
    };

    const closeEditCustomer = () => {
        setEditCustomer(null);
        setEditName('');
        setEditPhone('');
        setEditPlate('');
        setEditVehicleType('SEDAN');
    };

    const saveEditedCustomer = (e) => {
        e.preventDefault();
        const cleanPlate = normalizePlate(editPlate);
        if (!editName.trim() || !cleanPlate) {
            showNotification("Müşteri adı ve plaka zorunludur.", "error");
            return;
        }
        const hasDuplicatePlate = customers.some(c => c.id !== editCustomer.id && normalizePlate(c.plate) === cleanPlate);
        if (hasDuplicatePlate) {
            showNotification("Bu plaka başka bir müşteri kaydında kullanılıyor.", "error");
            return;
        }
        setCustomers(prev => prev.map(c => c.id === editCustomer.id ? {
            ...c,
            name: editName.trim(),
            phone: editPhone.trim() || 'Belirtilmedi',
            plate: cleanPlate,
            vehicleType: editVehicleType
        } : c));
        showNotification("Müşteri kartı güncellendi.");
        closeEditCustomer();
    };

    const confirmDeleteCustomer = () => {
        const id = deleteConfirm.targetId;
        const target = customers.find(c => c.id === id);
        const snapshotFromCustomer = target
            ? { plate: target.plate, name: target.name, phone: target.phone, vehicleType: target.vehicleType }
            : null;

        setCustomers(prev => prev.filter(c => c.id !== id));
        setTransactions(prev => prev.map(t => t.customerId === id
            ? { ...t, customerId: 'ANONIM_MUSTERI', customerSnapshot: t.customerSnapshot || snapshotFromCustomer }
            : t
        ));
        setSales(prev => prev.map(s => s.customerId === id
            ? { ...s, customerId: 'ANONIM_MUSTERI', customerSnapshot: s.customerSnapshot || snapshotFromCustomer }
            : s
        ));
        setAppointments(prev => prev.filter(a => a.customerId !== id));
        showNotification("Müşteri kartı silindi. Geçmiş gelir kayıtları korundu.", "warning");
        setDeleteConfirm({ isOpen: false, targetId: null });
    };

    const formatRelative = (timestamp) => {
        if (!timestamp) return 'Hiç ziyaret yok';
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        if (days === 0) return 'Bugün';
        if (days === 1) return 'Dün';
        if (days < 7) return `${days} gün önce`;
        if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
        if (days < 365) return `${Math.floor(days / 30)} ay önce`;
        return `${Math.floor(days / 365)} yıl önce`;
    };

    return (
        <div className="space-y-6 text-left">
            <CustomConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Müşteri Kaydını Sil?"
                message="Müşteri kartı kaldırılır, bekleyen randevuları iptal edilir. Geçmiş gelirler 'Anonim Müşteri' olarak korunur, ciro değişmez."
                onConfirm={confirmDeleteCustomer}
                onCancel={() => setDeleteConfirm({ isOpen: false, targetId: null })}
            />

            <PageHeader
                title="Müşteri Portföyü (CRM)"
                description={`Sadakat hedefi: her ${loyaltyTarget} ücretli yıkama sonrası 1 bedava yıkama.`}
                actions={
                    showOnlyReady && (
                        <button
                            type="button"
                            onClick={() => setShowOnlyReady(false)}
                            className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold hover:bg-emerald-600/30 transition flex items-center gap-2"
                        >
                            <Icons.X />
                            <span>Filtreyi Kaldır</span>
                        </button>
                    )
                }
            />

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Toplam Müşteri" value={summary.total} icon={<Icons.Users />} accent="brand" />
                <KpiCard
                    label="Ödüle Hazır"
                    value={summary.readyCount}
                    icon={<Icons.Gift />}
                    accent="emerald"
                    onClick={() => setShowOnlyReady(prev => !prev)}
                    active={showOnlyReady}
                />
                <KpiCard label="Son 30 Günde Yeni" value={summary.newThisMonth} icon={<Icons.Plus />} accent="amber" />
                <KpiCard label="Müşteri Başı Ziyaret" value={summary.avgVisits.toFixed(1)} icon={<Icons.Car />} accent="indigo" />
            </div>

            {/* Search + filters */}
            <div className="bg-darkBg-card border border-darkBg-border rounded-2xl p-4 shadow-lg space-y-3">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icons.Search /></span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Plaka, ad veya telefon ile ara..."
                        className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 pl-10 pr-3 py-2.5 rounded-lg text-sm text-white outline-none transition"
                    />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">Araç</span>
                        <button
                            type="button"
                            onClick={() => setFilterType('ALL')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                                filterType === 'ALL'
                                    ? 'bg-brand-600 border-brand-500 text-white'
                                    : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white'
                            }`}
                        >
                            Tümü
                        </button>
                        {VEHICLE_TYPES.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setFilterType(t.id)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                                    filterType === t.id
                                        ? 'bg-brand-600 border-brand-500 text-white'
                                        : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">Sıralama</span>
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSortBy(opt.id)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                                    sortBy === opt.id
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Customer cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCustomers.length === 0 ? (
                    <div className="col-span-full bg-darkBg-card border border-darkBg-border rounded-2xl p-10 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-darkBg-deep flex items-center justify-center text-gray-600 mb-3">
                            <Icons.Users />
                        </div>
                        <p className="text-sm text-gray-400">Aranan kriterlere uygun müşteri bulunamadı.</p>
                    </div>
                ) : (
                    filteredCustomers.map(cust => {
                        const meta = customerStats.get(cust.id);
                        const stats = meta?.stats || computeLoyaltyStats(cust.id, transactions, loyaltyTarget);

                        return (
                            <div
                                key={cust.id}
                                className={`group relative bg-darkBg-card border rounded-2xl p-4 shadow-lg space-y-4 flex flex-col transition hover:-translate-y-0.5 hover:shadow-brand-500/10 ${
                                    stats.ready ? 'border-emerald-500/40' : 'border-darkBg-border hover:border-brand-500/40'
                                }`}
                            >
                                {stats.ready && (
                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1 animate-pulse">
                                        <Icons.Gift />
                                        <span>{stats.availableRewards}× BEDAVA</span>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-500/30 flex items-center justify-center text-brand-300 font-extrabold text-base shrink-0">
                                        {initials(cust.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate">{cust.name}</h4>
                                        <p className="text-xs text-gray-400 truncate">{cust.phone}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-extrabold bg-brand-500/15 text-brand-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                {cust.plate}
                                            </span>
                                            <span className="text-[9px] bg-darkBg-deep text-gray-400 px-1.5 py-0.5 rounded">
                                                {cust.vehicleType}
                                            </span>
                                        </div>
                                    </div>
                                    <LoyaltyRing progress={stats.progress} target={stats.target} ready={stats.ready} />
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <Stat label="Ziyaret" value={meta?.visitCount || 0} />
                                    <Stat label="Harcama" value={formatCurrency(meta?.totalSpent || 0)} compact />
                                    <Stat label="Son" value={formatRelative(meta?.lastVisit)} compact />
                                </div>

                                {stats.ready ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-[11px] text-emerald-300 font-semibold flex items-center gap-2">
                                        <Icons.Gift />
                                        <span>Bedava yıkama hak kazandı! Hizmet kaydında ödülü kullan.</span>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-gray-500 text-center bg-darkBg-deep border border-darkBg-border rounded-lg p-2">
                                        Hediyeye <span className="text-brand-400 font-extrabold">{stats.nextRewardIn}</span> ücretli yıkama kaldı
                                    </p>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-darkBg-border">
                                    <button
                                        type="button"
                                        onClick={() => setViewHistoryCust(cust)}
                                        className="flex-1 px-2 py-1.5 rounded-lg bg-brand-600/15 hover:bg-brand-600 text-brand-300 hover:text-white text-[10px] font-bold transition"
                                    >
                                        Geçmiş
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openEditCustomer(cust)}
                                        className="flex-1 px-2 py-1.5 rounded-lg bg-darkBg-deep hover:bg-darkBg-hover text-gray-300 text-[10px] font-bold transition"
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirm({ isOpen: true, targetId: cust.id })}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                        title="Müşteriyi Sil"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {editCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-darkBg-card border border-darkBg-border rounded-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                            <div>
                                <h3 className="text-base font-bold text-white">Müşteri Kartını Düzenle</h3>
                                <p className="text-xs text-gray-400">Plaka değişikliği geçmiş işlemleri etkilemez.</p>
                            </div>
                            <button type="button" onClick={closeEditCustomer} className="text-gray-400 hover:text-white"><Icons.X /></button>
                        </div>

                        <form onSubmit={saveEditedCustomer} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Plaka *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editPlate}
                                        onChange={(e) => setEditPlate(normalizePlate(e.target.value))}
                                        className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white uppercase tracking-wider outline-none transition"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Araç Tipi</label>
                                    <select
                                        value={editVehicleType}
                                        onChange={(e) => setEditVehicleType(e.target.value)}
                                        className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white outline-none transition"
                                    >
                                        {VEHICLE_TYPES.map(t => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Ad Soyad *</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white outline-none transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Telefon</label>
                                <input
                                    type="text"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white outline-none transition"
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={closeEditCustomer} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-lg transition">
                                    Vazgeç
                                </button>
                                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-lg transition">
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewHistoryCust && (
                <HistoryModal
                    customer={viewHistoryCust}
                    transactions={transactions}
                    services={services}
                    sales={sales}
                    products={products}
                    stats={customerStats.get(viewHistoryCust.id)}
                    onClose={() => setViewHistoryCust(null)}
                />
            )}
        </div>
    );
};

const KpiCard = ({ label, value, icon, accent = 'brand', onClick, active }) => {
    const colors = {
        brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', activeBg: 'bg-brand-600' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', activeBg: 'bg-emerald-600' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', activeBg: 'bg-amber-600' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', activeBg: 'bg-indigo-600' }
    };
    const c = colors[accent] || colors.brand;
    return (
        <button
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            disabled={!onClick}
            className={`text-left bg-darkBg-card border rounded-2xl p-4 shadow-lg transition ${
                active ? `border-${accent}-500/60 ring-1 ring-${accent}-500/40` : 'border-darkBg-border'
            } ${onClick ? 'hover:border-brand-500/40 cursor-pointer' : 'cursor-default'}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">{label}</span>
                    <span className="text-2xl font-extrabold text-white tracking-tight mt-1 block">{value}</span>
                </div>
                <span className={`p-2.5 rounded-lg ${c.bg} ${c.text}`}>{icon}</span>
            </div>
        </button>
    );
};

const Stat = ({ label, value, compact = false }) => (
    <div className="bg-darkBg-deep border border-darkBg-border rounded-lg p-2">
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block">{label}</span>
        <span className={`font-bold text-white block truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>{value}</span>
    </div>
);

const HistoryModal = ({ customer, transactions, services, sales, products, stats, onClose }) => {
    const history = useMemo(() => {
        return transactions
            .filter(t => t.customerId === customer.id && t.status === 'COMPLETED')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, customer.id]);

    const productHistory = useMemo(() => {
        return sales
            .filter(s => s.customerId === customer.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [sales, customer.id]);

    const serviceMap = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])), [services]);
    const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-darkBg-card border border-darkBg-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b border-darkBg-border pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-extrabold">
                            {initials(customer.name)}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">{customer.name}</h3>
                            <p className="text-xs text-gray-400">{customer.plate} · {customer.phone}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><Icons.X /></button>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Stat label="Ücretli" value={stats.stats.paidVisits} />
                        <Stat label="Ödül Kullanım" value={stats.stats.rewardVisits} />
                        <Stat label="Hak Edilen" value={stats.stats.paidVisits >= stats.stats.target ? Math.floor(stats.stats.paidVisits / stats.stats.target) : 0} />
                        <Stat label="Toplam Harcama" value={formatCurrency(stats.totalSpent)} compact />
                    </div>
                )}

                <div>
                    <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2">
                        <Icons.Car />
                        <span>Hizmet Geçmişi ({history.length})</span>
                    </h4>
                    {history.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">Tamamlanmış hizmet kaydı yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {history.map(tr => {
                                const srvNames = (tr.serviceIds || []).map(id => serviceMap[id]?.name || 'Hizmet').join(', ');
                                return (
                                    <div key={tr.id} className={`bg-darkBg-deep border rounded-lg p-3 text-xs flex justify-between items-start gap-3 ${tr.isLoyaltyReward ? 'border-emerald-500/30' : 'border-darkBg-border'}`}>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] text-gray-500">{new Date(tr.date).toLocaleString('tr-TR')}</span>
                                                {tr.isLoyaltyReward && (
                                                    <span className="text-[9px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                                                        <Icons.Gift /> ÖDÜL
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-bold text-gray-200 mt-1">{srvNames}</p>
                                            {tr.notes && <p className="text-[10px] text-amber-500/80 mt-1">{tr.notes}</p>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`font-extrabold block ${tr.isLoyaltyReward ? 'text-emerald-400' : 'text-emerald-400'}`}>
                                                {tr.isLoyaltyReward ? '0 ₺' : formatCurrency(tr.totalPrice)}
                                            </span>
                                            {tr.discountAmount > 0 && !tr.isLoyaltyReward && (
                                                <span className="text-[9px] text-emerald-400">-{formatCurrency(tr.discountAmount)} indirim</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {productHistory.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2">
                            <Icons.Package />
                            <span>Ürün Alımları ({productHistory.length})</span>
                        </h4>
                        <div className="space-y-2">
                            {productHistory.map(s => {
                                const prod = productMap[s.productId];
                                return (
                                    <div key={s.id} className="bg-darkBg-deep border border-darkBg-border rounded-lg p-3 text-xs flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-200">{prod?.name || 'Ürün'} × {s.quantity}</p>
                                            <span className="text-[10px] text-gray-500">{new Date(s.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <span className="font-extrabold text-emerald-400">{formatCurrency(s.totalPrice)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-darkBg-deep hover:bg-darkBg-hover text-white font-bold py-2.5 rounded-lg text-xs transition"
                >
                    Kapat
                </button>
            </div>
        </div>
    );
};
