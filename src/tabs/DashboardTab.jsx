const { useMemo, useState } = React;

import { VEHICLE_TYPES, normalizePlate, formatCurrency, computeLoyaltyStats } from '../core/app-core.js';
import { formatDateTime } from '../core/format.js';
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

    const backupReminder = useMemo(() => {
        const reminderDays = Math.max(1, Number(settings?.backup_reminder_days) || 7);
        const last = settings?.last_backup_at ? new Date(settings.last_backup_at) : null;
        if (!last || Number.isNaN(last.getTime())) {
            return { needsBackup: true, daysSince: null, lastDate: null, reminderDays };
        }
        const diffMs = Date.now() - last.getTime();
        const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return {
            needsBackup: daysSince >= reminderDays,
            daysSince,
            lastDate: last,
            reminderDays
        };
    }, [settings?.last_backup_at, settings?.backup_reminder_days]);

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

            {backupReminder.needsBackup && (
                <button
                    type="button"
                    onClick={() => setActiveTab('backup')}
                    className="w-full text-left bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3 transition"
                >
                    <span className="shrink-0 mt-0.5 text-amber-400"><Icons.AlertTriangle /></span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-amber-200">
                            {backupReminder.lastDate
                                ? `Yedeklemenin üzerinden ${backupReminder.daysSince} gün geçti`
                                : 'Hiç yedek alınmamış'}
                        </p>
                        <p className="text-[11px] text-amber-100/70 mt-0.5">
                            Verilerin tamamı yalnızca tarayıcıda saklanır. {backupReminder.reminderDays} günde bir JSON yedeği indirmeniz önerilir.
                            <span className="text-amber-200 font-bold ml-1 underline">Yedeklemeye git →</span>
                        </p>
                    </div>
                </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="surface-card kpi-card p-5 rounded-xl flex items-center justify-between">
                    <div className="relative">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.18em] block mb-1">Toplam Brüt Ciro</span>
                        <span className={`kpi-value text-[26px] block transition duration-200 ${isSensitiveHidden ? 'blur-md select-none' : 'text-emerald-300'}`}>
                            {formatCurrency(totalGrossRevenue)}
                        </span>
                    </div>
                    <div className="relative p-3 bg-emerald-500/10 text-emerald-300 rounded-lg ring-1 ring-emerald-500/30 shadow-[0_10px_24px_-12px_rgba(16,185,129,0.55)]">
                        <Icons.Coins />
                    </div>
                </div>

                <div className="surface-card kpi-card p-5 rounded-xl flex items-center justify-between">
                    <div className="relative">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.18em] block mb-1">Net Kâr / Zarar</span>
                        <span className={`kpi-value text-[26px] block transition duration-200 ${isSensitiveHidden ? 'blur-md select-none' : netProfit >= 0 ? 'text-brand-300' : 'text-rose-300'}`}>
                            {formatCurrency(netProfit)}
                        </span>
                    </div>
                    <div className="relative p-3 bg-brand-500/10 text-brand-300 rounded-lg ring-1 ring-brand-500/30 shadow-[0_10px_24px_-12px_rgba(6,182,212,0.55)]">
                        <Icons.Car />
                    </div>
                </div>

                <div className="surface-card kpi-card p-5 rounded-xl flex items-center justify-between">
                    <div className="relative">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.18em] block mb-1">Kayıtlı Giderler</span>
                        <span className={`kpi-value text-[26px] block transition duration-200 ${isSensitiveHidden ? 'blur-md select-none' : 'text-rose-300'}`}>
                            {formatCurrency(totalExpenses)}
                        </span>
                    </div>
                    <div className="relative p-3 bg-rose-500/10 text-rose-300 rounded-lg ring-1 ring-rose-500/30 shadow-[0_10px_24px_-12px_rgba(244,63,94,0.45)]">
                        <Icons.Wallet />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setActiveTab('appointments')}
                    className="surface-card kpi-card p-5 rounded-xl flex items-center justify-between text-left hover:border-amber-500/40 transition"
                >
                    <div className="relative">
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.18em] block mb-1">Bekleyen Randevular</span>
                        <span className="kpi-value text-[26px] block text-amber-300">
                            {activeAppointments} <span className="text-sm text-amber-200/70 font-bold">adet</span>
                        </span>
                    </div>
                    <div className="relative p-3 bg-amber-500/10 text-amber-300 rounded-lg ring-1 ring-amber-500/30 shadow-[0_10px_24px_-12px_rgba(245,158,11,0.5)]">
                        <Icons.Calendar />
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CustomFinanceChart 
                        washIncome={completedWashRevenues} 
                        productIncome={productRevenues} 
                        totalExpenses={totalExpenses} 
                        isSensitiveHidden={isSensitiveHidden}
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
                                    <span className="plate-chip">{customer.plate}</span>
                                    <span className="text-[10px] bg-emerald-500/15 text-emerald-200 font-extrabold px-2 py-0.5 rounded-full ring-1 ring-emerald-500/30">
                                        {stats.availableRewards}× bedava
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-white mt-2 truncate">{customer.name}</p>
                                <p className="text-[10px] text-gray-400 truncate font-mono-num">{customer.phone}</p>
                                <p className="text-[10px] text-emerald-300 font-semibold mt-2">
                                    <span className="font-mono-num font-extrabold">{stats.paidVisits}</span> ücretli yıkama tamamlandı
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
                            className="w-full bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-center uppercase font-mono-num font-bold text-xl tracking-[0.18em] focus:outline-none focus:border-brand-500 text-brand-200 placeholder:text-gray-600"
                        />
                        <button 
                            type="button"
                            onClick={() => {
                                const val = normalizePlate(quickPlate);
                                if (val) {
                                    handleQuickSaleRedirect(val);
                                }
                            }}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg text-sm transition shadow-[0_10px_24px_-12px_rgba(6,182,212,0.7)]"
                        >
                            Sorgula &amp; İşlem Başlat
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
                                            <span className="plate-chip mr-2">{cust?.plate || 'BELİRSİZ'}</span>
                                            <span className="text-gray-200 font-medium">{cust?.name || 'Misafir'}</span>
                                            <span className="text-gray-500 block text-[10px] mt-0.5 font-mono-num">{formatDateTime(tr.date)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-mono-num font-bold block ${isSensitiveHidden ? 'blur-sm select-none' : 'text-emerald-300'}`}>
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
