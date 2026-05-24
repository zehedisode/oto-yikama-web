const { useMemo, useState } = React;

import { VEHICLE_TYPES, normalizePlate, formatCurrency, computeLoyaltyStats } from '../core/app-core.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomFinanceChart } from '../ui/FinanceChart.jsx';
import { Icons } from '../core/icons.jsx';

export const DashboardTab = ({ 
    transactions, 
    expenses, 
    appointments, 
    customers, 
    sales, 
    setActiveTab, 
    setQuickPlateContext,
    isSensitiveHidden,
    setIsSensitiveHidden,
    requestPinApproval,
    settings
}) => {
    const loyaltyTarget = settings?.loyalty_target_visits || 5;
    const [quickPlate, setQuickPlate] = useState('');

    const completedWashRevenues = useMemo(() => {
        return transactions
            .filter(t => t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.totalPrice, 0);
    }, [transactions]);

    const productRevenues = useMemo(() => {
        return sales.reduce((sum, s) => sum + s.totalPrice, 0);
    }, [sales]);

    const totalGrossRevenue = completedWashRevenues + productRevenues;

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);

    const netProfit = totalGrossRevenue - totalExpenses;

    const activeAppointments = useMemo(() => {
        return appointments.filter(a => a.status === 'BEKLEYOR').length;
    }, [appointments]);

    const recentWashes = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }, [transactions]);

    const vehicleStats = useMemo(() => {
        const stats = VEHICLE_TYPES.reduce((acc, type) => {
            acc[type.id] = 0;
            return acc;
        }, {});
        customers.forEach(c => {
            if (stats[c.vehicleType] !== undefined) {
                stats[c.vehicleType]++;
            }
        });
        return stats;
    }, [customers]);

    const loyaltyReadyCustomers = useMemo(() => {
        return customers
            .map(c => ({ customer: c, stats: computeLoyaltyStats(c.id, transactions, loyaltyTarget) }))
            .filter(item => item.stats.ready)
            .sort((a, b) => b.stats.availableRewards - a.stats.availableRewards);
    }, [customers, transactions, loyaltyTarget]);

    const handleQuickSaleRedirect = (plateNum) => {
        setQuickPlateContext(plateNum);
        setActiveTab('sales');
    };

    const toggleSensitiveData = () => {
        if (isSensitiveHidden) {
            requestPinApproval("Finansal verileri görmek için PIN kodunuzu doğrulayın.", () => {
                setIsSensitiveHidden(false);
            });
        } else {
            setIsSensitiveHidden(true);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Kontrol Paneli"
                description="Yerel kayıtlar, randevu kuyruğu, gelir-gider özeti ve hızlı işlem akışları."
                actions={
                    <>
                    <button
                        type="button"
                        onClick={() => handleQuickSaleRedirect('')}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition shadow-md shadow-brand-500/10 active:scale-95"
                    >
                        <Icons.Plus />
                        <span>Yeni Hizmet Girişi</span>
                    </button>
                    <button
                        type="button"
                        onClick={toggleSensitiveData}
                        className="px-4 py-2 bg-darkBg-card hover:bg-darkBg-hover border border-darkBg-border rounded-lg text-sm font-semibold text-gray-300 flex items-center space-x-2 transition"
                    >
                        {isSensitiveHidden ? <Icons.Eye /> : <Icons.EyeOff />}
                        <span>{isSensitiveHidden ? "Tüm Kilitleri Aç" : "Kasa Detaylarını Gizle"}</span>
                    </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow">
                    <div>
                        <span className="text-xs text-gray-400 font-semibold block">Toplam Brüt Ciro</span>
                        <span className={`text-2xl font-extrabold tracking-tight transition duration-200 ${isSensitiveHidden ? 'blur-md select-none' : 'text-emerald-400'}`}>
                            {formatCurrency(totalGrossRevenue)}
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Icons.Coins />
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow">
                    <div>
                        <span className="text-xs text-gray-400 font-semibold block">Net Kâr / Zarar</span>
                        <span className={`text-2xl font-extrabold tracking-tight transition duration-200 ${isSensitiveHidden ? 'blur-md select-none' : netProfit >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                            {formatCurrency(netProfit)}
                        </span>
                    </div>
                    <div className="p-3 bg-brand-500/10 text-brand-400 rounded-lg">
                        <Icons.Car />
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow">
                    <div>
                        <span className="text-xs text-gray-400 font-semibold block">Kayıtlı Giderler</span>
                        <span className={`text-2xl font-extrabold tracking-tight transition duration-200 ${isSensitiveHidden ? 'blur-md select-none' : 'text-red-400'}`}>
                            {formatCurrency(totalExpenses)}
                        </span>
                    </div>
                    <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
                        <Icons.Wallet />
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow cursor-pointer" onClick={() => setActiveTab('appointments')}>
                    <div>
                        <span className="text-xs text-gray-400 font-semibold block">Bekleyen Randevular</span>
                        <span className="text-2xl font-extrabold tracking-tight text-amber-400">
                            {activeAppointments} Adet
                        </span>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                        <Icons.Calendar />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CustomFinanceChart 
                        washIncome={completedWashRevenues} 
                        productIncome={productRevenues} 
                        totalExpenses={totalExpenses} 
                    />
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow flex flex-col justify-between text-left">
                    <div>
                        <h3 className="text-base font-bold text-gray-200 mb-1">Müşteri Araç Dağılımı</h3>
                        <p className="text-xs text-gray-500 mb-4">Sistemde kayıtlı toplam {customers.length} müşterinin araç tipleri</p>
                    </div>

                    <div className="space-y-3">
                        {VEHICLE_TYPES.map(({ id, label }) => {
                            const count = vehicleStats[id] || 0;
                            const percent = customers.length > 0 ? (count / customers.length) * 100 : 0;
                            return (
                                <div key={id} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-gray-300">{label}</span>
                                        <span className="text-gray-400">{count} Araç ({percent.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-darkBg-deep rounded-full h-2">
                                        <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-darkBg-card border border-emerald-500/30 rounded-xl p-5 shadow text-left">
                <div className="flex items-center justify-between border-b border-darkBg-border pb-3 mb-3">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <span className="text-emerald-400"><Icons.Gift /></span>
                            Bedava Yıkama Hak Eden Müşteriler
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Her {loyaltyTarget} ücretli yıkama sonrası 1 bedava yıkama. Listeyi arayıp müşteriyi bilgilendirebilirsiniz.
                        </p>
                    </div>
                    <span className="text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-extrabold whitespace-nowrap">
                        {loyaltyReadyCustomers.length} müşteri
                    </span>
                </div>

                {loyaltyReadyCustomers.length === 0 ? (
                    <p className="text-xs text-gray-500 py-6 text-center">
                        Şu an bedava yıkama hak eden müşteri bulunmuyor. Müşteriler {loyaltyTarget} ücretli yıkamayı tamamladığında burada listelenir.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1">
                        {loyaltyReadyCustomers.map(({ customer, stats }) => (
                            <button
                                type="button"
                                key={customer.id}
                                onClick={() => handleQuickSaleRedirect(customer.plate)}
                                className="text-left bg-darkBg-deep border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/20 rounded-lg p-3 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                title="Hizmet girişine git"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded uppercase tracking-wider">{customer.plate}</span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                                        {stats.availableRewards}× bedava
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-white mt-2 truncate">{customer.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{customer.phone}</p>
                                <p className="text-[10px] text-emerald-400 font-semibold mt-2">
                                    {stats.paidVisits} ücretli yıkama tamamlandı
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white mb-2">Hızlı Plaka Sorgulama</h3>
                        <p className="text-xs text-gray-400 mb-4">Müşteri kaydını ve sadakat puanını kontrol etmek için plaka yazın.</p>
                    </div>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Örn: 34ABC123" 
                            maxLength={12}
                            value={quickPlate}
                            onChange={(e) => setQuickPlate(normalizePlate(e.target.value))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && quickPlate) {
                                    handleQuickSaleRedirect(quickPlate);
                                }
                            }}
                            className="w-full bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-center uppercase tracking-wider font-bold text-lg focus:outline-none focus:border-brand-500 text-white"
                        />
                        <button 
                            type="button"
                            onClick={() => {
                                const val = normalizePlate(quickPlate);
                                if (val) {
                                    handleQuickSaleRedirect(val);
                                }
                            }}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-lg text-sm transition"
                        >
                            Sorgula & İşlem Başlat
                        </button>
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow">
                    <h3 className="text-base font-bold text-white mb-3">Son Yapılan Hizmet Girişleri</h3>
                    {recentWashes.length === 0 ? (
                        <p className="text-xs text-gray-500 py-6 text-center">Henüz yapılmış bir yıkama kaydı bulunmuyor.</p>
                    ) : (
                        <div className="divide-y divide-darkBg-border">
                            {recentWashes.map((tr) => {
                                const cust = customers.find(c => c.id === tr.customerId);
                                return (
                                    <div key={tr.id} className="py-3 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md mr-2">{cust?.plate || 'BELİRSİZ'}</span>
                                            <span className="text-gray-300 font-medium">{cust?.name || 'Misafir'}</span>
                                            <span className="text-gray-500 block text-[10px]">{new Date(tr.date).toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold block ${isSensitiveHidden ? 'blur-sm select-none' : 'text-emerald-400'}`}>
                                                {formatCurrency(tr.totalPrice)}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {tr.isLoyaltyReward ? 'Ödül Temizliği' : 'Standart Ödeme'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
