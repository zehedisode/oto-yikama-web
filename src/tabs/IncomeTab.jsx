const { useState, useMemo } = React;

import { formatCurrency, PAYMENT_METHODS, getPaymentLabel, LOYALTY_REWARD_PAYMENT, ANONYMOUS_CUSTOMER_ID } from '../core/app-core.js';
import { formatDateTime, formatDate } from '../core/format.js';
import { RANGE_OPTIONS, isWithinRange } from '../core/date-range.js';
import { useEntityMap } from '../core/lookups.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { StatTile } from '../ui/StatTile.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

const FILTERS = [
    { id: 'all', label: 'Tümü' },
    { id: 'service', label: 'Hizmet' },
    { id: 'product', label: 'Ürün' }
];

const escapeCsv = (value) => {
    const str = String(value ?? '');
    if (/[",;\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const IncomeTab = ({
    transactions,
    setTransactions,
    sales,
    setSales,
    products,
    setProducts,
    customers,
    services,
    isSensitiveHidden,
    setIsSensitiveHidden,
    requestPinApproval,
    showNotification
}) => {
    const [typeFilter, setTypeFilter] = useState('all');
    const [rangeFilter, setRangeFilter] = useState('30d');
    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, row: null });

    const customerMap = useEntityMap(customers);
    const serviceMap = useEntityMap(services);
    const productMap = useEntityMap(products);

    const incomeRows = useMemo(() => {
        const serviceRows = transactions
            .filter(t => t.status === 'COMPLETED')
            .map(t => {
                const cust = customerMap.get(t.customerId);
                const snap = t.customerSnapshot;
                const serviceNames = (t.serviceIds || [])
                    .map(id => serviceMap.get(id)?.name)
                    .filter(Boolean)
                    .join(', ');
                return {
                    id: `tx-${t.id}`,
                    rawId: t.id,
                    kind: 'service',
                    date: t.date,
                    amount: t.totalPrice || 0,
                    discount: t.discountAmount || 0,
                    title: serviceNames || 'Hizmet',
                    plate: cust?.plate || snap?.plate || '',
                    customerName: cust?.name || snap?.name || (t.customerId === ANONYMOUS_CUSTOMER_ID ? 'Anonim Müşteri' : 'Misafir'),
                    isLoyaltyReward: !!t.isLoyaltyReward,
                    paymentMethod: t.isLoyaltyReward ? LOYALTY_REWARD_PAYMENT : (t.paymentMethod || 'cash'),
                    note: t.notes || ''
                };
            });

        const productRows = sales.map(s => {
            const cust = customerMap.get(s.customerId);
            const snap = s.customerSnapshot;
            const prod = productMap.get(s.productId);
            const productName = prod?.name || s.productSnapshot?.name || 'Ürün';
            return {
                id: `sl-${s.id}`,
                rawId: s.id,
                productId: s.productId,
                quantity: s.quantity,
                kind: 'product',
                date: s.date,
                amount: s.totalPrice || 0,
                discount: 0,
                title: `${productName} × ${s.quantity}`,
                plate: cust?.plate || snap?.plate || '',
                customerName: cust?.name || snap?.name || (s.customerId === ANONYMOUS_CUSTOMER_ID ? 'Anonim Müşteri' : 'Cari Müşteri'),
                isLoyaltyReward: false,
                paymentMethod: s.paymentMethod || 'cash',
                note: ''
            };
        });

        return [...serviceRows, ...productRows].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, sales, customerMap, serviceMap, productMap]);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr-TR');
        return incomeRows.filter(row => {
            if (typeFilter !== 'all' && row.kind !== typeFilter) return false;
            if (!isWithinRange(row.date, rangeFilter)) return false;
            if (paymentFilter !== 'all' && row.paymentMethod !== paymentFilter) return false;
            if (term) {
                const haystack = `${row.plate} ${row.customerName} ${row.title}`.toLocaleLowerCase('tr-TR');
                if (!haystack.includes(term)) return false;
            }
            return true;
        });
    }, [incomeRows, typeFilter, rangeFilter, search, paymentFilter]);

    const summary = useMemo(() => {
        const result = {
            total: 0,
            service: 0,
            product: 0,
            count: filteredRows.length,
            loyaltyCount: 0,
            byPayment: { cash: 0, card: 0, transfer: 0, unpaid: 0, [LOYALTY_REWARD_PAYMENT]: 0 }
        };
        filteredRows.forEach(row => {
            result.total += row.amount;
            if (row.kind === 'service') result.service += row.amount;
            if (row.kind === 'product') result.product += row.amount;
            if (row.isLoyaltyReward) result.loyaltyCount += 1;
            if (result.byPayment[row.paymentMethod] !== undefined) {
                result.byPayment[row.paymentMethod] += row.amount;
            }
        });
        return result;
    }, [filteredRows]);

    const requestDelete = (row) => {
        requestPinApproval(
            row.kind === 'service'
                ? "Hizmet gelir kaydını silmek için PIN doğrulayın."
                : "Ürün satışını silmek için PIN doğrulayın.",
            () => setDeleteConfirm({ isOpen: true, row })
        );
    };

    const confirmDelete = () => {
        const row = deleteConfirm.row;
        if (!row) return;
        if (row.kind === 'service') {
            setTransactions(prev => prev.filter(t => t.id !== row.rawId));
            showNotification("Hizmet gelir kaydı silindi.", "warning");
        } else {
            // Ürün satışı silinince stoğu geri ekle
            setSales(prev => prev.filter(s => s.id !== row.rawId));
            setProducts(prev => prev.map(p => p.id === row.productId
                ? { ...p, stock: (p.stock || 0) + (row.quantity || 0) }
                : p
            ));
            showNotification("Ürün satışı silindi, stok iade edildi.", "warning");
        }
        setDeleteConfirm({ isOpen: false, row: null });
    };

    const handleExportCsv = () => {
        if (filteredRows.length === 0) {
            showNotification("Dışa aktarılacak gelir kaydı yok.", "error");
            return;
        }
        const header = ['Tarih', 'Tip', 'Plaka', 'Müşteri', 'Açıklama', 'İndirim', 'Tutar', 'Ödeme'];
        const lines = [header.join(';')];
        filteredRows.forEach(row => {
            lines.push([
                formatDateTime(row.date),
                row.kind === 'service' ? 'Hizmet' : 'Ürün',
                row.plate,
                row.customerName,
                row.isLoyaltyReward ? `${row.title} (Sadakat Ödülü)` : row.title,
                row.discount ? row.discount.toFixed(2) : '0.00',
                row.amount.toFixed(2),
                getPaymentLabel(row.paymentMethod)
            ].map(escapeCsv).join(';'));
        });
        const csv = '\uFEFF' + lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `gelir-kayitlari-${stamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification("Gelir kayıtları CSV olarak indirildi.");
    };

    return (
        <div className="space-y-6 relative text-left">
            <CustomConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Gelir Kaydını Sil?"
                message="Bu kayıt finans raporlarından kalıcı olarak çıkarılır. Ürün satışıysa ilgili stok geri eklenir."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, row: null })}
            />

            {isSensitiveHidden && (
                <div className="absolute inset-0 z-10 modal-backdrop flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-darkBg-border">
                    <span className="inline-flex w-12 h-12 rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30 items-center justify-center mb-3">
                        <Icons.Shield />
                    </span>
                    <h3 className="text-lg font-extrabold text-white mb-1" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                        Gelir Kayıtları Kilitli
                    </h3>
                    <p className="text-xs text-gray-400 mb-4 max-w-sm">Tüm gelir hareketlerini görmek için güvenlik PIN kodunuzu girin.</p>
                    <button
                        type="button"
                        onClick={() => {
                            requestPinApproval("Gelir kayıtlarına erişmek için doğrulama yapın.", () => {
                                setIsSensitiveHidden(false);
                            });
                        }}
                        className="btn btn-primary"
                    >
                        PIN ile Kilidi Aç
                    </button>
                </div>
            )}

            <PageHeader
                title="Gelir Kayıtları"
                description="Tamamlanan tüm hizmet ve ürün satışlarından gelen gelir hareketleri."
                actions={
                    <button type="button" onClick={handleExportCsv} className="btn btn-success">
                        <Icons.Download />
                        <span>CSV İndir</span>
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile label="Toplam Gelir" value={formatCurrency(summary.total)} icon={<Icons.TrendingUp />} accent="emerald" />
                <StatTile label="Hizmet Geliri" value={formatCurrency(summary.service)} icon={<Icons.Car />} accent="brand" />
                <StatTile label="Ürün Geliri" value={formatCurrency(summary.product)} icon={<Icons.Package />} accent="amber" />
                <StatTile label="Kayıt Adedi" value={summary.count} sub={summary.loyaltyCount > 0 ? `${summary.loyaltyCount} sadakat ödülü dahil` : null} icon={<Icons.Clipboard />} accent="neutral" />
            </div>

            <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setTypeFilter(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    typeFilter === opt.id
                                        ? 'bg-brand-600 border-brand-500 text-white'
                                        : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-brand-500/60'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {RANGE_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setRangeFilter(opt.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    rangeFilter === opt.id
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-emerald-500/60'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icons.Search /></span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Plaka, müşteri adı veya hizmet ara..."
                        className="w-full bg-darkBg-deep border border-darkBg-border pl-10 pr-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-white"
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Ödeme</span>
                    <button
                        type="button"
                        onClick={() => setPaymentFilter('all')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                            paymentFilter === 'all'
                                ? 'bg-brand-600 border-brand-500 text-white'
                                : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white'
                        }`}
                    >
                        Tümü
                    </button>
                    {PAYMENT_METHODS.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPaymentFilter(p.id)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition flex items-center gap-1 ${
                                paymentFilter === p.id
                                    ? 'bg-brand-600 border-brand-500 text-white'
                                    : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                            <span className="opacity-60 ml-1">{summary.byPayment[p.id] > 0 ? formatCurrency(summary.byPayment[p.id]) : ''}</span>
                        </button>
                    ))}
                </div>

                {filteredRows.length === 0 ? (
                    <p className="text-xs text-gray-500 py-10 text-center">
                        Seçili filtrelerle eşleşen gelir kaydı yok.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-400">
                            <thead className="bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border">
                                <tr>
                                    <th className="p-3">Tarih</th>
                                    <th className="p-3">Tip</th>
                                    <th className="p-3">Plaka / Müşteri</th>
                                    <th className="p-3">Açıklama</th>
                                    <th className="p-3 text-right">İndirim</th>
                                    <th className="p-3 text-right">Tutar</th>
                                    <th className="p-3 text-center">Ödeme</th>
                                    <th className="p-3 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-darkBg-border">
                                {filteredRows.map(row => (
                                    <tr key={row.id} className="hover:bg-darkBg-hover">
                                        <td className="p-3 whitespace-nowrap">
                                            <span className="block text-gray-200 font-semibold">
                                                {formatDate(row.date)}
                                            </span>
                                            <span className="block text-[10px] text-gray-500">
                                                {new Date(row.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {row.kind === 'service' ? (
                                                <span className="bg-brand-500/15 text-brand-300 px-2 py-0.5 rounded text-[10px] font-bold">Hizmet</span>
                                            ) : (
                                                <span className="bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Ürün</span>
                                            )}
                                            {row.isLoyaltyReward && (
                                                <span className="ml-1 bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">Ödül</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {row.plate && (
                                                <span className="font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                                    {row.plate}
                                                </span>
                                            )}
                                            <span className="text-gray-200 font-medium">{row.customerName}</span>
                                        </td>
                                        <td className="p-3 text-gray-300">{row.title}</td>
                                        <td className="p-3 text-right">
                                            {row.discount > 0 ? (
                                                <span className="text-emerald-400 font-semibold">- {formatCurrency(row.discount)}</span>
                                            ) : (
                                                <span className="text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className={`font-extrabold ${row.amount === 0 ? 'text-gray-400' : 'text-emerald-400'}`}>
                                                {formatCurrency(row.amount)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-[10px] bg-darkBg-deep border border-darkBg-border text-gray-300 px-2 py-0.5 rounded font-bold">
                                                {row.paymentMethod === LOYALTY_REWARD_PAYMENT ? '🎁 Ödül' : `${PAYMENT_METHODS.find(p => p.id === row.paymentMethod)?.icon || ''} ${getPaymentLabel(row.paymentMethod)}`}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => requestDelete(row)}
                                                className="text-gray-500 hover:text-red-400 transition"
                                                title="Gelir kaydını sil"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-darkBg-deep border-t border-darkBg-border">
                                    <td className="p-3 font-bold text-white" colSpan={5}>
                                        Filtrelenmiş Toplam ({summary.count} kayıt)
                                    </td>
                                    <td className="p-3 text-right font-extrabold text-emerald-400 text-sm">
                                        {formatCurrency(summary.total)}
                                    </td>
                                    <td className="p-3"></td>
                                    <td className="p-3"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
