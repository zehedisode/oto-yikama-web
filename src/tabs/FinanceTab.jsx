const { useState } = React;

import { parsePositiveNumber, formatCurrency } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

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

    const washRevenue = transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.totalPrice, 0);

    const productRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalOutflow = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossInflow = washRevenue + productRevenue;
    const netProfit = grossInflow - totalOutflow;

    const handleAddExpense = (e) => {
        e.preventDefault();
        const parsedAmount = parsePositiveNumber(amount);
        if (!parsedAmount) {
            showNotification("Geçerli bir gider tutarı girin.", "error");
            return;
        }

        const newExpense = {
            id: generateUUID(),
            category,
            amount: parsedAmount,
            description,
            date: new Date().toISOString()
        };

        setExpenses(prev => [newExpense, ...prev]);
        showNotification("Gider kalemi muhasebeye işlendi.");
        setIsOpenModal(false);

        setAmount('');
        setDescription('');
    };

    const handleDeleteRequest = (id) => {
        requestPinApproval("Gider silmek için şifrenizi girin.", () => {
            setDeleteConfirm({ isOpen: true, targetId: id });
        });
    };

    const confirmDeleteExpense = () => {
        const id = deleteConfirm.targetId;
        setExpenses(prev => prev.filter(e => e.id !== id));
        showNotification("Gider kalemi başarıyla silindi.", "warning");
        setDeleteConfirm({ isOpen: false, targetId: null });
    };

    return (
        <div className="space-y-6 relative text-left">
            <CustomConfirmModal 
                isOpen={deleteConfirm.isOpen}
                title="Gider Kaydını Sil?"
                message="Bu gider kalemi muhasebe kayıtlarından tamamen silinecektir. Emin misiniz?"
                onConfirm={confirmDeleteExpense}
                onCancel={() => setDeleteConfirm({ isOpen: false, targetId: null })}
            />

            {isSensitiveHidden && (
                <div className="absolute inset-0 z-10 bg-darkBg-deep/45 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-darkBg-border">
                    <span className="text-brand-400 mb-3"><Icons.Shield /></span>
                    <h3 className="text-lg font-bold text-white mb-1">Finansal Veriler Kilitli</h3>
                    <p className="text-xs text-gray-400 mb-4 max-w-sm">Gelir, gider ve kâr detaylarına ulaşmak için güvenlik PIN kodunuzu girmeniz gerekir.</p>
                    <button
                        type="button"
                        onClick={() => {
                            requestPinApproval("Finansal verilere erişmek için doğrulama yapın.", () => {
                                setIsSensitiveHidden(false);
                            });
                        }}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-xs transition"
                    >
                        PIN Kodu ile Kilidi Aç
                    </button>
                </div>
            )}

            <PageHeader
                title="Kasa & Giderler"
                description="Hizmet cirolarını, market gelirlerini ve dükkan masraflarını izleyin."
                actions={
                    <button
                        type="button"
                        onClick={() => setIsOpenModal(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
                    >
                        <Icons.Plus />
                        <span>Gider Fişi Ekle</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow">
                    <span className="text-xs text-gray-400 block font-medium">Toplam Gelir (Hizmet+Ürün)</span>
                    <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">{formatCurrency(grossInflow)}</span>
                </div>
                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow">
                    <span className="text-xs text-gray-400 block font-medium">Toplam Gider / Çıkan Para</span>
                    <span className="text-2xl font-extrabold text-red-400 tracking-tight">{formatCurrency(totalOutflow)}</span>
                </div>
                <div className="bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow">
                    <span className="text-xs text-gray-400 block font-medium">Net Kasa Durumu</span>
                    <span className={`text-2xl font-extrabold tracking-tight ${netProfit >= 0 ? 'text-brand-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</span>
                </div>
            </div>

            <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow">
                <h3 className="text-sm font-bold text-white mb-4">Gider / Ödeme Defteri</h3>
                {expenses.length === 0 ? (
                    <p className="text-xs text-gray-500 py-6 text-center">Herhangi bir dükkan masrafı kaydedilmemiş.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-400">
                            <thead className="bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border">
                                <tr>
                                    <th className="p-3">Tarih</th>
                                    <th className="p-3">Kategori</th>
                                    <th className="p-3">Açıklama / Detay</th>
                                    <th className="p-3 text-right">Tutar</th>
                                    <th className="p-3 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-darkBg-border">
                                {expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-darkBg-hover">
                                        <td className="p-3">{new Date(exp.date).toLocaleDateString('tr-TR')}</td>
                                        <td className="p-3">
                                            <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">{exp.category}</span>
                                        </td>
                                        <td className="p-3 font-medium text-gray-200">{exp.description || 'Masraf kaydı'}</td>
                                        <td className="p-3 text-right font-extrabold text-red-400">{formatCurrency(exp.amount)}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleDeleteRequest(exp.id)}
                                                className="text-gray-500 hover:text-red-400 transition"
                                                title="Gider Kalemini Sil"
                                            >
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

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs">
                        <h3 className="text-base font-bold text-white">Gider Fişi Kaydı</h3>
                        
                        <form onSubmit={handleAddExpense} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Gider Kategorisi *</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
                                >
                                    <option value="Kira">Kira Ödemesi</option>
                                    <option value="Fatura">Su, Elektrik, İnternet Faturası</option>
                                    <option value="Malzeme Alımı">Malzeme & Kimyasal Alımı</option>
                                    <option value="Personel">Personel Maaş & Prim</option>
                                    <option value="Diğer">Diğer Masraflar</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Gider Tutarı (₺) *</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white font-bold" 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Açıklama / Masraf Nedeni *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Elektrik fatura bedeli"
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white" 
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setIsOpenModal(false)} className="flex-1 bg-gray-800 p-2.5 rounded font-bold">Vazgeç</button>
                                <button type="submit" className="flex-1 bg-red-600 p-2.5 rounded font-bold">Gider Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
