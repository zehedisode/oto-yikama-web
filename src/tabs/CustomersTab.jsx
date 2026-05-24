const { useState, useMemo } = React;

import { VEHICLE_TYPES, normalizePlate, formatCurrency, computeLoyaltyStats } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

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
    
    const [viewHistoryCust, setViewHistoryCust] = useState(null);
    const [editCustomer, setEditCustomer] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPlate, setEditPlate] = useState('');
    const [editVehicleType, setEditVehicleType] = useState('SEDAN');

    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetId: null });

    const customerLoyalty = useMemo(() => {
        const map = new Map();
        customers.forEach(c => {
            map.set(c.id, computeLoyaltyStats(c.id, transactions, loyaltyTarget));
        });
        return map;
    }, [customers, transactions, loyaltyTarget]);

    const readyCount = useMemo(() => {
        let count = 0;
        customerLoyalty.forEach(stats => {
            if (stats.ready) count += 1;
        });
        return count;
    }, [customerLoyalty]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(search.toLowerCase());
            const plateMatch = c.plate.toLowerCase().includes(search.toLowerCase());
            const phoneMatch = c.phone.includes(search);
            const typeMatch = filterType === 'ALL' || c.vehicleType === filterType;
            const stats = customerLoyalty.get(c.id);
            const readyMatch = !showOnlyReady || (stats && stats.ready);
            return (nameMatch || plateMatch || phoneMatch) && typeMatch && readyMatch;
        });
    }, [customers, search, filterType, showOnlyReady, customerLoyalty]);

    const getCustomerWashHistory = (custId) => {
        return transactions
            .filter(t => t.customerId === custId && t.status === 'COMPLETED')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const handleDeleteRequest = (id) => {
        setDeleteConfirm({ isOpen: true, targetId: id });
    };

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
        const relatedSales = sales.filter(s => s.customerId === id);

        setCustomers(prev => prev.filter(c => c.id !== id));
        setTransactions(prev => prev.filter(t => t.customerId !== id));
        setAppointments(prev => prev.filter(a => a.customerId !== id));
        setSales(prev => prev.filter(s => s.customerId !== id));
        if (relatedSales.length > 0) {
            setProducts(prev => prev.map(product => {
                const returnedQuantity = relatedSales
                    .filter(s => s.productId === product.id)
                    .reduce((sum, s) => sum + (s.quantity || 0), 0);
                return returnedQuantity > 0 ? { ...product, stock: product.stock + returnedQuantity } : product;
            }));
        }

        showNotification("Müşteri ve bağlı işlem kayıtları silindi.", "warning");
        setDeleteConfirm({ isOpen: false, targetId: null });
    };

    return (
        <div className="space-y-6 text-left">
            <CustomConfirmModal 
                isOpen={deleteConfirm.isOpen}
                title="Müşteri Kaydını Sil?"
                message="Bu müşteriyle ilişkili randevu, hizmet ve market satış kayıtları da silinir; market stokları geri eklenir."
                onConfirm={confirmDeleteCustomer}
                onCancel={() => setDeleteConfirm({ isOpen: false, targetId: null })}
            />

            <PageHeader
                title="Müşteri Portföyü"
                description="Müşterilerinizi, araç sınıflarını ve sadakat geçmişlerini görüntüleyin."
                actions={
                    <button
                        type="button"
                        onClick={() => setShowOnlyReady(prev => !prev)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition border ${
                            showOnlyReady
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow shadow-emerald-500/20'
                                : 'bg-darkBg-card hover:bg-darkBg-hover text-emerald-300 border-emerald-700/40'
                        }`}
                    >
                        <Icons.Gift />
                        <span>{showOnlyReady ? 'Tüm Müşteriler' : `Ödüle Hazır (${readyCount})`}</span>
                    </button>
                }
            />

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                        <Icons.Search />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Plaka, İsim ya da Telefon numarası ile ara..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-darkBg-card border border-darkBg-border pl-10 pr-4 py-2.5 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-white"
                    />
                </div>
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-darkBg-card border border-darkBg-border px-4 py-2.5 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-white"
                >
                    <option value="ALL">Tüm Araç Sınıfları</option>
                    {VEHICLE_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label.toLocaleUpperCase('tr-TR')}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-12 col-span-3">Aranan kriterlere uygun müşteri bulunamadı.</p>
                ) : (
                    filteredCustomers.map(cust => {
                        const history = getCustomerWashHistory(cust.id);
                        const stats = customerLoyalty.get(cust.id) || computeLoyaltyStats(cust.id, transactions, loyaltyTarget);
                        const progressPercent = stats.ready ? 100 : (stats.progress / stats.target) * 100;
                        return (
                            <div
                                key={cust.id}
                                className={`bg-darkBg-card border p-5 rounded-xl shadow space-y-4 flex flex-col justify-between transition ${
                                    stats.ready ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-darkBg-border'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-extrabold bg-brand-500/10 text-brand-400 px-3 py-1 rounded-md tracking-wider uppercase">{cust.plate}</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] bg-darkBg-deep border border-darkBg-border text-gray-400 px-2 py-0.5 rounded-full font-semibold">{cust.vehicleType}</span>
                                            {stats.ready && (
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 animate-pulse">
                                                    <Icons.Gift /> {stats.availableRewards} Bedava
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold text-white">{cust.name}</h4>
                                        <p className="text-xs text-gray-400">{cust.phone}</p>
                                    </div>

                                    <div className="bg-darkBg-deep border border-darkBg-border rounded-lg p-2.5 space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-semibold">
                                            <span className="text-gray-400">Sadakat</span>
                                            <span className={stats.ready ? 'text-emerald-300 font-extrabold' : 'text-gray-300'}>
                                                {stats.ready ? 'Bedava yıkama hazır' : `${stats.progress} / ${stats.target}`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-darkBg-card rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${stats.ready ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        {!stats.ready && (
                                            <p className="text-[10px] text-gray-500">
                                                Hediyeye <span className="text-brand-400 font-extrabold">{stats.nextRewardIn}</span> ücretli yıkama kaldı.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-darkBg-border pt-3 flex justify-between items-center text-xs">
                                    <div className="text-left">
                                        <span className="text-gray-500 block text-[10px]">Toplam Ziyaret</span>
                                        <span className="font-extrabold text-white text-sm">{history.length} Defa</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        <button 
                                            type="button"
                                            onClick={() => setViewHistoryCust(cust)}
                                            className="px-3 py-1.5 bg-brand-900/30 text-brand-400 hover:bg-brand-600 hover:text-white rounded font-bold text-[10px] transition"
                                        >
                                            Hizmet Geçmişi
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEditCustomer(cust)}
                                            className="px-3 py-1.5 bg-darkBg-deep text-gray-300 hover:bg-darkBg-hover rounded font-bold text-[10px] transition"
                                        >
                                            Düzenle
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleDeleteRequest(cust.id)}
                                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition"
                                            title="Müşteriyi Sil"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {editCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                            <div className="text-left">
                                <h3 className="text-base font-bold text-white">Müşteri Kartını Düzenle</h3>
                                <p className="text-xs text-gray-400">Plaka değişirse mevcut işlem geçmişi aynı müşteri kartına bağlı kalır.</p>
                            </div>
                            <button type="button" onClick={closeEditCustomer} className="text-gray-400 hover:text-white">
                                <Icons.X />
                            </button>
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
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500 uppercase"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Araç Tipi</label>
                                    <select
                                        value={editVehicleType}
                                        onChange={(e) => setEditVehicleType(e.target.value)}
                                        className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                    >
                                        {VEHICLE_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Müşteri Ad Soyadı *</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Telefon</label>
                                <input
                                    type="text"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={closeEditCustomer} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition">
                                    Vazgeç
                                </button>
                                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition">
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewHistoryCust && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xl bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-darkBg-border pb-2">
                            <div className="text-left">
                                <h3 className="text-base font-bold text-white">{viewHistoryCust.name} — Hizmet Kartı</h3>
                                <p className="text-xs text-gray-400">{viewHistoryCust.plate} | {viewHistoryCust.phone}</p>
                            </div>
                            <button type="button" onClick={() => setViewHistoryCust(null)} className="text-gray-400 hover:text-white">
                                <Icons.X />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-300">Önceki Siparişler / Yıkamalar</h4>
                            {getCustomerWashHistory(viewHistoryCust.id).length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-6">Müşteriye ait tamamlanmış bir hizmet kaydı bulunmamaktadır.</p>
                            ) : (
                                <div className="space-y-3">
                                    {getCustomerWashHistory(viewHistoryCust.id).map(tr => {
                                        const srvs = tr.serviceIds.map(id => services.find(s => s.id === id)?.name || 'Hizmet').join(', ');
                                        return (
                                            <div key={tr.id} className="bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-xs flex justify-between items-center">
                                                <div className="text-left space-y-1">
                                                    <span className="text-[10px] text-gray-500">{new Date(tr.date).toLocaleString('tr-TR')}</span>
                                                    <p className="font-bold text-gray-200">{srvs}</p>
                                                    {tr.notes && <p className="text-[10px] text-amber-500/80 bg-amber-500/5 p-1 rounded">Not: {tr.notes}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-extrabold text-emerald-400 block">{formatCurrency(tr.totalPrice)}</span>
                                                    <span className="text-[10px] text-gray-400">{tr.isLoyaltyReward ? 'Ödül' : 'Tahsil Edildi'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button 
                            type="button"
                            onClick={() => setViewHistoryCust(null)}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded text-xs transition"
                        >
                            Pencereyi Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
