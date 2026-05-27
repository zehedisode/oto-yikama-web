const { useState, useMemo } = React;

import { parsePositiveNumber, formatCurrency } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Modal } from '../ui/Modal.jsx';
import { StatTile } from '../ui/StatTile.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

const EXPENSE_CATEGORIES = [
    'Kira',
    'Fatura',
    'Malzeme Alımı',
    'Personel',
    'Diğer'
];

export const FinanceTab = ({
    transactions,
    expenses,
    setExpenses,
    sales,
    isSensitiveHidden,
    setIsSensitiveHidden,
    requestPinApproval,
    showNotification
}) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [category, setCategory] = useState('Diğer');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetId: null });
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');

    const totals = useMemo(() => {
        const wash = transactions.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.totalPrice, 0);
        const product = sales.reduce((s, x) => s + x.totalPrice, 0);
        const out = expenses.reduce((s, e) => s + e.amount, 0);
        return { wash, product, gross: wash + product, out, net: wash + product - out };
    }, [transactions, sales, expenses]);

    const filteredExpenses = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr-TR');
        return expenses
            .filter(e => filterCat === 'all' || e.category === filterCat)
            .filter(e => !term || `${e.category} ${e.description || ''}`.toLocaleLowerCase('tr-TR').includes(term))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, filterCat, search]);

    const handleAddExpense = (e) => {
        e.preventDefault();
        const parsed = parsePositiveNumber(amount);
        if (!parsed) {
            showNotification("Geçerli bir gider tutarı girin.", "error");
            return;
        }
        const newExpense = {
            id: generateUUID(),
            category,
            amount: parsed,
            description,
            date: new Date().toISOString()
        };
        setExpenses(prev => [newExpense, ...prev]);
        showNotification("Gider kalemi muhasebeye işlendi.");
        setIsOpenModal(false);
        setAmount('');
        setDescription('');
        setCategory('Diğer');
    };

    const handleDeleteRequest = (id) => {
        requestPinApproval("Gider silmek için PIN onayı verin.", () => {
            setDeleteConfirm({ isOpen: true, targetId: id });
        });
    };

    const confirmDeleteExpense = () => {
        setExpenses(prev => prev.filter(e => e.id !== deleteConfirm.targetId));
        showNotification("Gider kalemi silindi.", "warning");
        setDeleteConfirm({ isOpen: false, targetId: null });
    };

    return (
        <div className="space-y-6 relative text-left">
            <CustomConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Gider Kaydını Sil?"
                message="Bu gider kalemi muhasebe kayıtlarından kalıcı olarak silinir."
                onConfirm={confirmDeleteExpense}
                onCancel={() => setDeleteConfirm({ isOpen: false, targetId: null })}
            />

            {isSensitiveHidden && (
                <div className="absolute inset-0 z-10 modal-backdrop flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-darkBg-border">
                    <span className="inline-flex w-12 h-12 rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30 items-center justify-center mb-3">
                        <Icons.Shield />
                    </span>
                    <h3 className="text-lg font-extrabold text-white mb-1" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                        Finansal Veriler Kilitli
                    </h3>
                    <p className="text-xs text-gray-400 mb-4 max-w-sm">Gelir, gider ve kâr detaylarına ulaşmak için güvenlik PIN kodunuzu girin.</p>
                    <button
                        type="button"
                        onClick={() => {
                            requestPinApproval("Finansal verilere erişmek için doğrulama yapın.", () => {
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
                title="Kasa & Giderler"
                description="Cari döneme ait hizmet, ürün ve gider hareketlerini bir bakışta yönetin."
                actions={
                    <button type="button" onClick={() => setIsOpenModal(true)} className="btn btn-danger">
                        <Icons.Plus />
                        <span>Gider Fişi Ekle</span>
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile label="Toplam Gelir" value={formatCurrency(totals.gross)} sub="Hizmet + Ürün" icon={<Icons.TrendingUp />} accent="emerald" />
                <StatTile label="Hizmet Cirosu" value={formatCurrency(totals.wash)} icon={<Icons.Car />} accent="brand" />
                <StatTile label="Toplam Gider" value={formatCurrency(totals.out)} icon={<Icons.Wallet />} accent="rose" />
                <StatTile label="Net Kasa" value={formatCurrency(totals.net)} sub={totals.net >= 0 ? 'Kâr' : 'Zarar'} icon={<Icons.Coins />} accent={totals.net >= 0 ? 'brand' : 'rose'} />
            </div>

            {/* Filter row */}
            <div className="surface-card rounded-xl p-3 flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icons.Search /></span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Açıklama veya kategori ara..."
                        className="field pl-10"
                    />
                </div>
                <div className="segment shrink-0 overflow-x-auto max-w-full">
                    <button type="button" data-active={filterCat === 'all'} onClick={() => setFilterCat('all')}>Tümü</button>
                    {EXPENSE_CATEGORIES.map(cat => (
                        <button key={cat} type="button" data-active={filterCat === cat} onClick={() => setFilterCat(cat)}>{cat}</button>
                    ))}
                </div>
            </div>

            <div className="surface-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-darkBg-border flex items-center justify-between">
                    <span className="section-title text-[14px]"><Icons.Wallet />Gider Defteri</span>
                    <span className="pill pill-rose font-mono-num">{filteredExpenses.length}</span>
                </div>
                {filteredExpenses.length === 0 ? (
                    <p className="empty-state">Filtreyle eşleşen gider kalemi yok.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Kategori</th>
                                    <th>Açıklama</th>
                                    <th className="text-right">Tutar</th>
                                    <th className="text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id}>
                                        <td className="font-mono-num">{new Date(exp.date).toLocaleDateString('tr-TR')}</td>
                                        <td><span className="pill pill-rose">{exp.category}</span></td>
                                        <td className="text-gray-200 font-medium">{exp.description || 'Masraf kaydı'}</td>
                                        <td className="text-right font-mono-num font-extrabold text-rose-300">{formatCurrency(exp.amount)}</td>
                                        <td className="text-center">
                                            <button type="button" onClick={() => handleDeleteRequest(exp.id)} className="text-gray-500 hover:text-rose-300 transition" title="Sil">
                                                <Icons.Trash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isOpenModal}
                onClose={() => setIsOpenModal(false)}
                title="Gider Fişi Kaydı"
                kicker="Yeni gider"
                description="Kategori, tutar ve kısa bir açıklama girerek defteri güncelleyin."
                icon={<Icons.Wallet />}
                accent="rose"
                size="sm"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsOpenModal(false)} className="btn btn-ghost flex-1">Vazgeç</button>
                        <button type="submit" form="exp-form" className="btn btn-danger flex-1">Gideri Kaydet</button>
                    </div>
                }
            >
                <form id="exp-form" onSubmit={handleAddExpense} className="space-y-4 text-xs">
                    <div>
                        <label className="field-label">Kategori *</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">Tutar (₺) *</label>
                        <input
                            type="number"
                            required
                            min={0}
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="field font-mono-num text-right text-base"
                        />
                    </div>
                    <div>
                        <label className="field-label">Açıklama *</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Örn: Elektrik fatura ödemesi"
                            className="field"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};
