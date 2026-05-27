const { useState } = React;

import { parsePositiveNumber, parsePositiveInteger, formatCurrency, PAYMENT_METHODS, WALK_IN_CUSTOMER_ID } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';
import { ReceiptPrint } from '../ui/ReceiptPrint.jsx';

export const ProductsTab = ({ 
    products, 
    setProducts, 
    sales, 
    setSales, 
    customers, 
    showNotification 
}) => {
    const [isOpenProdModal, setIsOpenProdModal] = useState(false);
    const [isOpenSaleModal, setIsOpenSaleModal] = useState(false);
    const [editProductId, setEditProductId] = useState('');
    
    const [prodName, setProdName] = useState('');
    const [prodCategory, setProdCategory] = useState('Hızlı Satış');
    const [prodPrice, setProdPrice] = useState(100);
    const [prodCost, setProdCost] = useState(40);
    const [prodStock, setProdStock] = useState(10);
    const [prodUnit, setProdUnit] = useState('Adet');

    const [selectedProdId, setSelectedProdId] = useState('');
    const [selectedCustId, setSelectedCustId] = useState('');
    const [saleQty, setSaleQty] = useState(1);
    const [salePaymentMethod, setSalePaymentMethod] = useState('cash');
    const [productReceipt, setProductReceipt] = useState(null);
    const [deleteSaleConfirm, setDeleteSaleConfirm] = useState({ isOpen: false, targetId: null });

    const resetProductForm = () => {
        setEditProductId('');
        setProdName('');
        setProdCategory('Hızlı Satış');
        setProdPrice(100);
        setProdCost(40);
        setProdStock(10);
        setProdUnit('Adet');
    };

    const openNewProduct = () => {
        resetProductForm();
        setIsOpenProdModal(true);
    };

    const openEditProduct = (p) => {
        setEditProductId(p.id);
        setProdName(p.name || '');
        setProdCategory(p.category || 'Hızlı Satış');
        setProdPrice(p.price);
        setProdCost(p.cost);
        setProdStock(p.stock);
        setProdUnit(p.unit || 'Adet');
        setIsOpenProdModal(true);
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        if (!prodName) return;

        if (editProductId) {
            setProducts(prev => prev.map(p => p.id === editProductId ? {
                ...p,
                name: prodName,
                category: prodCategory,
                price: parsePositiveNumber(prodPrice),
                cost: parsePositiveNumber(prodCost),
                stock: parsePositiveInteger(prodStock),
                unit: prodUnit
            } : p));
            showNotification("Ürün bilgileri güncellendi.");
        } else {
            const newProd = {
                id: generateUUID(),
                name: prodName,
                category: prodCategory,
                price: parsePositiveNumber(prodPrice),
                cost: parsePositiveNumber(prodCost),
                stock: parsePositiveInteger(prodStock),
                unit: prodUnit,
                isActive: true
            };
            setProducts(prev => [...prev, newProd]);
            showNotification("Yeni ürün stoğa eklendi.");
        }

        setIsOpenProdModal(false);
        resetProductForm();
    };

    const handleDirectSale = (e) => {
        e.preventDefault();
        if (!selectedProdId) return;

        const product = products.find(p => p.id === selectedProdId);
        if (!product) return;

        const quantity = Math.max(1, parsePositiveInteger(saleQty, 1));

        if (product.stock < quantity) {
            showNotification(`Yetersiz stok! Mevcut stok: ${product.stock} ${product.unit}`, "error");
            return;
        }

        setProducts(prev => prev.map(p => p.id === selectedProdId ? { ...p, stock: p.stock - quantity } : p));

        const customerSnapshot = selectedCustId
            ? (() => {
                const c = customers.find(x => x.id === selectedCustId);
                return c ? { plate: c.plate, name: c.name, phone: c.phone, vehicleType: c.vehicleType } : null;
            })()
            : null;

        const newSale = {
            id: generateUUID(),
            productId: selectedProdId,
            productSnapshot: { name: product.name, unit: product.unit },
            customerId: selectedCustId || WALK_IN_CUSTOMER_ID,
            customerSnapshot,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
            paymentMethod: salePaymentMethod,
            date: new Date().toISOString()
        };

        setSales(prev => [newSale, ...prev]);
        showNotification("Aksesuar/ürün satışı tamamlandı!");

        // Fiş hazırla
        setProductReceipt({
            date: newSale.date,
            customer: customerSnapshot,
            lines: [{ label: `${product.name} × ${quantity}`, amount: newSale.totalPrice }],
            subTotal: newSale.totalPrice,
            discount: 0,
            total: newSale.totalPrice,
            paymentMethod: salePaymentMethod,
            note: ''
        });

        setIsOpenSaleModal(false);
        setSelectedProdId('');
        setSelectedCustId('');
        setSaleQty(1);
        setSalePaymentMethod('cash');
    };

    const confirmDeleteProductSale = () => {
        const targetSale = sales.find(s => s.id === deleteSaleConfirm.targetId);
        if (!targetSale) {
            setDeleteSaleConfirm({ isOpen: false, targetId: null });
            return;
        }

        setSales(prev => prev.filter(s => s.id !== targetSale.id));
        setProducts(prev => prev.map(product => (
            product.id === targetSale.productId
                ? { ...product, stock: product.stock + (targetSale.quantity || 0) }
                : product
        )));
        showNotification("Ürün satışı silindi ve stok geri eklendi.", "warning");
        setDeleteSaleConfirm({ isOpen: false, targetId: null });
    };

    return (
        <div className="space-y-6 text-left">
            <CustomConfirmModal
                isOpen={deleteSaleConfirm.isOpen}
                title="Ürün Satışını Sil?"
                message="Bu satış kaydı finansmandan kaldırılır ve satılan adet stoğa geri eklenir."
                onConfirm={confirmDeleteProductSale}
                onCancel={() => setDeleteSaleConfirm({ isOpen: false, targetId: null })}
            />

            <PageHeader
                title="Stok Kartları & Market Satışı"
                description="Ürünlerinizin envanter durumunu ve hızlı satış fişlerini yönetin."
                actions={
                    <>
                    <button
                        type="button"
                        onClick={() => setIsOpenSaleModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
                    >
                        <span>Hızlı Satış Yap</span>
                    </button>
                    <button
                        type="button"
                        onClick={openNewProduct}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
                    >
                        <Icons.Plus />
                        <span>Stoğa Ürün Ekle</span>
                    </button>
                    </>
                }
            />

            <div className="bg-darkBg-card border border-darkBg-border rounded-xl overflow-hidden shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-400">
                        <thead className="bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border">
                            <tr>
                                <th className="p-4">Ürün Adı</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4 text-right">Maliyet</th>
                                <th className="p-4 text-right">Satış Fiyatı</th>
                                <th className="p-4 text-center">Mevcut Stok</th>
                                <th className="p-4">Birim</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4 text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-darkBg-border">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Stokta kayıtlı ürün bulunmuyor.</td>
                                </tr>
                            ) : (
                                products.map(p => (
                                    <tr key={p.id} className="hover:bg-darkBg-hover">
                                        <td className="p-4 font-bold text-white">{p.name}</td>
                                        <td className="p-4">{p.category}</td>
                                        <td className="p-4 text-right">{formatCurrency(p.cost)}</td>
                                        <td className="p-4 text-right text-emerald-400 font-bold">{formatCurrency(p.price)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full font-extrabold ${p.stock <= 5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-brand-500/10 text-brand-300'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="p-4">{p.unit}</td>
                                        <td className="p-4">
                                            <span className={`w-2 h-2 rounded-full inline-block ${p.stock > 0 ? 'bg-emerald-400' : 'bg-red-500'}`} />
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => openEditProduct(p)}
                                                className="text-brand-400 hover:text-brand-300 text-[10px] font-bold underline-offset-2 hover:underline transition"
                                            >
                                                Düzenle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow">
                <h3 className="text-sm font-bold text-white mb-3">Tamamlanan Ürün Satış Geçmişi</h3>
                {sales.length === 0 ? (
                    <p className="text-xs text-gray-500 py-6 text-center">Henüz yapılmış bir market satışı bulunmuyor.</p>
                ) : (
                    <div className="divide-y divide-darkBg-border">
                        {sales.map(s => {
                            const prod = products.find(p => p.id === s.productId);
                            const cust = customers.find(c => c.id === s.customerId);
                            return (
                                <div key={s.id} className="py-3 flex justify-between items-center gap-3 text-xs">
                                    <div className="text-left">
                                        <p className="font-bold text-gray-200">{prod?.name || 'Belirsiz Ürün'}</p>
                                        <span className="text-[10px] text-gray-400">{cust?.name || 'Müşteri Kaydı Yok'} | Adet: {s.quantity}</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <span className="font-bold text-emerald-400">{formatCurrency(s.totalPrice)}</span>
                                        <span className="text-[9px] text-gray-500 block">{new Date(s.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteSaleConfirm({ isOpen: true, targetId: s.id })}
                                            className="text-gray-500 hover:text-red-400 transition"
                                            title="Ürün Satışını Sil"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isOpenProdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs">
                        <h3 className="text-base font-bold text-white">{editProductId ? 'Ürün / Stok Kartını Düzenle' : 'Yeni Ürün / Stok Kartı Oluştur'}</h3>
                        
                        <form onSubmit={handleAddProduct} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Ürün Adı *</label>
                                <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Kategori *</label>
                                <input type="text" required value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Maliyet Tutarı (₺) *</label>
                                    <input type="number" required value={prodCost} onChange={(e) => setProdCost(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Satış Fiyatı (₺) *</label>
                                    <input type="number" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Stok Adedi *</label>
                                    <input type="number" required value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-gray-400 block font-semibold">Birim *</label>
                                    <input type="text" required value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => { setIsOpenProdModal(false); resetProductForm(); }} className="flex-1 bg-gray-800 p-2.5 rounded font-bold">Vazgeç</button>
                                <button type="submit" className="flex-1 bg-brand-600 p-2.5 rounded font-bold">{editProductId ? 'Güncelle' : 'Kaydet'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isOpenSaleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs">
                        <h3 className="text-base font-bold text-white">Market Ürünü Satış Fişi</h3>
                        
                        <form onSubmit={handleDirectSale} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Satılacak Ürün *</label>
                                <select 
                                    required 
                                    value={selectedProdId} 
                                    onChange={(e) => setSelectedProdId(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
                                >
                                    <option value="">-- Ürün Seçin --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                            {p.name} (Stok: {p.stock} | {formatCurrency(p.price)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Alıcı Müşteri (Opsiyonel)</label>
                                <select 
                                    value={selectedCustId} 
                                    onChange={(e) => setSelectedCustId(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
                                >
                                    <option value="">Cari Müşteri (Kayıtsız)</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.plate} - {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Satış Adedi *</label>
                                <input 
                                    type="number" 
                                    required 
                                    min={1} 
                                    value={saleQty} 
                                    onChange={(e) => setSaleQty(e.target.value)} 
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white" 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Ödeme Yöntemi</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {PAYMENT_METHODS.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSalePaymentMethod(p.id)}
                                            className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 ${
                                                salePaymentMethod === p.id
                                                    ? 'bg-brand-600 border-brand-500 text-white'
                                                    : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <span>{p.icon}</span>
                                            <span>{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setIsOpenSaleModal(false)} className="flex-1 bg-gray-800 p-2.5 rounded font-bold">Vazgeç</button>
                                <button type="submit" className="flex-1 bg-emerald-600 p-2.5 rounded font-bold">Ödemeyi Al</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ReceiptPrint
                isOpen={!!productReceipt}
                data={productReceipt}
                onClose={() => setProductReceipt(null)}
            />
        </div>
    );
};
