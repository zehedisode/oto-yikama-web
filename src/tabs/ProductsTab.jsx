const { useState, useMemo } = React;

import { parsePositiveNumber, parsePositiveInteger, formatCurrency, PAYMENT_METHODS, WALK_IN_CUSTOMER_ID } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Modal } from '../ui/Modal.jsx';
import { StatTile } from '../ui/StatTile.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';
import { ReceiptPrint } from '../ui/ReceiptPrint.jsx';

const LOW_STOCK = 5;

export const ProductsTab = ({ products, setProducts, sales, setSales, customers, showNotification }) => {
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

    const [search, setSearch] = useState('');

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr-TR');
        if (!term) return products;
        return products.filter(p =>
            `${p.name} ${p.category}`.toLocaleLowerCase('tr-TR').includes(term)
        );
    }, [products, search]);

    const summary = useMemo(() => {
        const skuCount = products.length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK).length;
        const oos = products.filter(p => p.stock <= 0).length;
        const stockValue = products.reduce((s, p) => s + (Number(p.cost) || 0) * (Number(p.stock) || 0), 0);
        return { skuCount, lowStock, oos, stockValue };
    }, [products]);

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
        const payload = {
            name: prodName,
            category: prodCategory,
            price: parsePositiveNumber(prodPrice),
            cost: parsePositiveNumber(prodCost),
            stock: parsePositiveInteger(prodStock),
            unit: prodUnit
        };
        if (editProductId) {
            setProducts(prev => prev.map(p => p.id === editProductId ? { ...p, ...payload } : p));
            showNotification("Ürün bilgileri güncellendi.");
        } else {
            setProducts(prev => [...prev, { id: generateUUID(), ...payload, isActive: true }]);
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
        showNotification("Aksesuar/ürün satışı tamamlandı.");

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
                message="Bu satış kaydı kaldırılır ve satılan adet stoğa geri eklenir."
                onConfirm={confirmDeleteProductSale}
                onCancel={() => setDeleteSaleConfirm({ isOpen: false, targetId: null })}
            />

            <PageHeader
                title="Stok & Market"
                description="Ürünlerin envanterini takip edin, hızlı market satışlarını fişe dökün."
                actions={
                    <>
                    <button type="button" onClick={() => setIsOpenSaleModal(true)} className="btn btn-success">
                        <Icons.TrendingUp />
                        <span>Hızlı Satış</span>
                    </button>
                    <button type="button" onClick={openNewProduct} className="btn btn-primary">
                        <Icons.Plus />
                        <span>Stoğa Ürün Ekle</span>
                    </button>
                    </>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile label="SKU Adedi" value={summary.skuCount} icon={<Icons.Package />} accent="brand" />
                <StatTile label="Düşük Stok" value={summary.lowStock} sub={`≤ ${LOW_STOCK} adet`} icon={<Icons.AlertTriangle />} accent="amber" />
                <StatTile label="Tükenen" value={summary.oos} icon={<Icons.AlertTriangle />} accent="rose" />
                <StatTile label="Stok Değeri" value={formatCurrency(summary.stockValue)} sub="Maliyet bazlı" icon={<Icons.Coins />} accent="emerald" />
            </div>

            <div className="surface-card rounded-xl p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icons.Search /></span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ürün adı veya kategoride ara..."
                        className="field pl-10"
                    />
                </div>
                <span className="pill pill-neutral self-start sm:self-auto"><span className="font-mono-num">{filteredProducts.length}</span> sonuç</span>
            </div>

            <div className="surface-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ürün</th>
                                <th>Kategori</th>
                                <th className="text-right">Maliyet</th>
                                <th className="text-right">Satış</th>
                                <th className="text-center">Stok</th>
                                <th>Birim</th>
                                <th className="text-center">Durum</th>
                                <th className="text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-state">Aramayla eşleşen ürün yok.</td>
                                </tr>
                            ) : (
                                filteredProducts.map(p => {
                                    const oos = p.stock <= 0;
                                    const low = !oos && p.stock <= LOW_STOCK;
                                    return (
                                        <tr key={p.id}>
                                            <td className="font-bold text-white">{p.name}</td>
                                            <td>{p.category}</td>
                                            <td className="text-right font-mono-num">{formatCurrency(p.cost)}</td>
                                            <td className="text-right font-mono-num font-bold text-emerald-300">{formatCurrency(p.price)}</td>
                                            <td className="text-center">
                                                <span className={`pill ${oos ? 'pill-rose' : low ? 'pill-amber' : 'pill-brand'} font-mono-num`}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td>{p.unit}</td>
                                            <td className="text-center">
                                                <span className={`status-dot ${oos ? 'status-dot-rose' : low ? 'status-dot-amber' : 'status-dot-emerald'}`} />
                                                <span className="text-[11px] text-gray-300">{oos ? 'Tükendi' : low ? 'Düşük' : 'Sağlıklı'}</span>
                                            </td>
                                            <td className="text-center">
                                                <button type="button" onClick={() => openEditProduct(p)} className="btn btn-soft text-[10px] py-1 px-2.5">
                                                    Düzenle
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-darkBg-border pb-3 mb-3">
                    <span className="section-title text-[14px]"><Icons.TrendingUp />Market Satış Geçmişi</span>
                    <span className="pill pill-brand font-mono-num">{sales.length}</span>
                </div>
                {sales.length === 0 ? (
                    <p className="empty-state">Henüz market satışı kaydedilmemiş.</p>
                ) : (
                    <div className="divide-y divide-darkBg-border/60">
                        {sales.slice(0, 30).map(s => {
                            const prod = products.find(p => p.id === s.productId);
                            const cust = customers.find(c => c.id === s.customerId);
                            return (
                                <div key={s.id} className="py-2.5 flex justify-between items-center gap-3 text-xs">
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-100 truncate">{prod?.name || s.productSnapshot?.name || 'Ürün'}</p>
                                        <span className="text-[10px] text-gray-400">
                                            {cust?.name || s.customerSnapshot?.name || 'Cari Müşteri'} · adet <span className="font-mono-num">{s.quantity}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <span className="font-mono-num font-bold text-emerald-300 block">{formatCurrency(s.totalPrice)}</span>
                                            <span className="text-[9px] text-gray-500 font-mono-num">{new Date(s.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteSaleConfirm({ isOpen: true, targetId: s.id })}
                                            className="text-gray-500 hover:text-rose-300 transition"
                                            title="Sil"
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

            {/* Product CRUD modal */}
            <Modal
                isOpen={isOpenProdModal}
                onClose={() => { setIsOpenProdModal(false); resetProductForm(); }}
                title={editProductId ? 'Ürünü Düzenle' : 'Yeni Ürün / Stok Kartı'}
                kicker={editProductId ? 'Güncelle' : 'Yeni'}
                description="Maliyet ve satış fiyatı arasındaki fark kâr marjını gösterir."
                icon={<Icons.Package />}
                size="md"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => { setIsOpenProdModal(false); resetProductForm(); }} className="btn btn-ghost flex-1">Vazgeç</button>
                        <button type="submit" form="prod-form" className="btn btn-primary flex-1">{editProductId ? 'Güncelle' : 'Kaydet'}</button>
                    </div>
                }
            >
                <form id="prod-form" onSubmit={handleAddProduct} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="field-label">Ürün Adı *</label>
                            <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="field" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="field-label">Kategori *</label>
                            <input type="text" required value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="field" />
                        </div>
                        <div>
                            <label className="field-label">Maliyet (₺)</label>
                            <input type="number" min={0} step="0.01" value={prodCost} onChange={(e) => setProdCost(e.target.value)} className="field font-mono-num text-right" />
                        </div>
                        <div>
                            <label className="field-label">Satış Fiyatı (₺) *</label>
                            <input type="number" required min={0} step="0.01" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="field font-mono-num text-right" />
                        </div>
                        <div>
                            <label className="field-label">Stok *</label>
                            <input type="number" required min={0} value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="field font-mono-num text-center" />
                        </div>
                        <div>
                            <label className="field-label">Birim</label>
                            <input type="text" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} className="field" />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Quick sale modal */}
            <Modal
                isOpen={isOpenSaleModal}
                onClose={() => setIsOpenSaleModal(false)}
                title="Market Satış Fişi"
                kicker="Hızlı satış"
                description="Stoktan düşülecek ürünü seçin, ödeme yöntemini işaretleyin."
                icon={<Icons.TrendingUp />}
                accent="emerald"
                size="md"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsOpenSaleModal(false)} className="btn btn-ghost flex-1">Vazgeç</button>
                        <button type="submit" form="sale-form" className="btn btn-success flex-1">Ödemeyi Al</button>
                    </div>
                }
            >
                <form id="sale-form" onSubmit={handleDirectSale} className="space-y-4 text-xs">
                    <div>
                        <label className="field-label">Satılacak Ürün *</label>
                        <select required value={selectedProdId} onChange={(e) => setSelectedProdId(e.target.value)} className="field">
                            <option value="">— Ürün seçin —</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                    {p.name} · stok {p.stock} · {formatCurrency(p.price)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">Müşteri (opsiyonel)</label>
                        <select value={selectedCustId} onChange={(e) => setSelectedCustId(e.target.value)} className="field">
                            <option value="">Cari Müşteri (Kayıtsız)</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.plate} — {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">Adet *</label>
                        <input type="number" min={1} required value={saleQty} onChange={(e) => setSaleQty(e.target.value)} className="field font-mono-num text-center text-base" />
                    </div>
                    <div>
                        <label className="field-label">Ödeme Yöntemi</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSalePaymentMethod(p.id)}
                                    className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1.5 ${
                                        salePaymentMethod === p.id
                                            ? 'bg-brand-500/15 border-brand-500/50 text-brand-100 ring-1 ring-brand-500/30'
                                            : 'bg-darkBg-deep border-darkBg-border text-gray-300 hover:border-brand-500/40 hover:text-white'
                                    }`}
                                >
                                    <span>{p.icon}</span>
                                    <span>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>

            <ReceiptPrint
                isOpen={!!productReceipt}
                data={productReceipt}
                onClose={() => setProductReceipt(null)}
            />
        </div>
    );
};
