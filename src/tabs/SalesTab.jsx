const { useState, useEffect, useMemo } = React;

import { normalizePlate, validateTurkishPlate, formatCurrency, VEHICLE_TYPES, computeLoyaltyStats, PAYMENT_METHODS, LOYALTY_REWARD_PAYMENT } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Icons } from '../core/icons.jsx';
import { ReceiptPrint } from '../ui/ReceiptPrint.jsx';

const initials = (name) => {
    if (!name) return '?';
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toLocaleUpperCase('tr-TR');
};

export const SalesTab = ({
    customers,
    setCustomers,
    services,
    transactions,
    setTransactions,
    campaigns,
    settings,
    quickPlateContext,
    setQuickPlateContext,
    pendingFromAppointment,
    setPendingFromAppointment,
    appointments,
    setAppointments,
    showNotification
}) => {
    const [plate, setPlate] = useState(quickPlateContext || '');
    const [matchedCustomer, setMatchedCustomer] = useState(null);
    const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);

    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('SEDAN');

    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [notes, setNotes] = useState('');
    const [isRewardRedeemed, setIsRewardRedeemed] = useState(false);

    const [serviceSearch, setServiceSearch] = useState('');
    const [showCartMobile, setShowCartMobile] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [receipt, setReceipt] = useState(null);

    // Plaka değiştikçe müşteri eşleşmesi
    useEffect(() => {
        const cleanPlate = normalizePlate(plate);
        if (cleanPlate.length >= 4) {
            const match = customers.find(c => normalizePlate(c.plate) === cleanPlate);
            if (match) {
                setMatchedCustomer(match);
                setIsNewCustomerMode(false);
            } else {
                setMatchedCustomer(null);
                setIsNewCustomerMode(true);
            }
        } else {
            setMatchedCustomer(null);
            setIsNewCustomerMode(false);
        }
    }, [plate, customers]);

    useEffect(() => {
        if (quickPlateContext) setPlate(quickPlateContext);
    }, [quickPlateContext]);

    useEffect(() => {
        if (pendingFromAppointment) {
            if (Array.isArray(pendingFromAppointment.serviceIds) && pendingFromAppointment.serviceIds.length > 0) {
                setSelectedServiceIds(pendingFromAppointment.serviceIds);
            }
            if (pendingFromAppointment.notes) setNotes(pendingFromAppointment.notes);
        }
    }, [pendingFromAppointment]);

    const loyaltyStats = useMemo(() => {
        if (!matchedCustomer) {
            return { paidVisits: 0, availableRewards: 0, nextRewardIn: 0, target: settings.loyalty_target_visits || 5, progress: 0, ready: false };
        }
        return computeLoyaltyStats(matchedCustomer.id, transactions, settings.loyalty_target_visits);
    }, [matchedCustomer, transactions, settings.loyalty_target_visits]);

    const currentVehicleType = matchedCustomer ? matchedCustomer.vehicleType : vehicleType;

    const visibleServices = useMemo(() => {
        const term = serviceSearch.trim().toLocaleLowerCase('tr-TR');
        return services
            .filter(s => s.isActive)
            .filter(s => !term || s.name.toLocaleLowerCase('tr-TR').includes(term));
    }, [services, serviceSearch]);

    const selectedServices = useMemo(() => {
        return selectedServiceIds
            .map(id => services.find(s => s.id === id))
            .filter(Boolean);
    }, [selectedServiceIds, services]);

    const originalPrice = useMemo(() => {
        return selectedServices.reduce((sum, s) => sum + (s.prices?.[currentVehicleType] || 0), 0);
    }, [selectedServices, currentVehicleType]);

    const totalDuration = useMemo(() => {
        return selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
    }, [selectedServices]);

    const campaignDetails = useMemo(() => {
        let totalDiscount = 0;
        const appliedCampaigns = [];
        const now = Date.now();

        campaigns.forEach(camp => {
            if (!camp.isActive) return;
            if (camp.startDate && new Date(camp.startDate).getTime() > now) return;
            if (camp.endDate && new Date(camp.endDate).getTime() < now) return;
            if (camp.applicableVehicleTypes?.length > 0 && !camp.applicableVehicleTypes.includes(currentVehicleType)) return;
            if (camp.minSpend > 0 && originalPrice < camp.minSpend) return;
            const containsService = selectedServiceIds.some(sId => (camp.applicableServices || []).includes(sId));
            if (selectedServiceIds.length > 0 && camp.applicableServices?.length > 0 && !containsService) return;

            if (camp.type === 'PERCENTAGE') {
                totalDiscount += (originalPrice * camp.value) / 100;
            } else if (camp.type === 'FIXED') {
                totalDiscount += camp.value;
            }
            appliedCampaigns.push(camp);
        });

        return {
            discountAmount: Math.min(totalDiscount, originalPrice),
            appliedCampaigns
        };
    }, [originalPrice, campaigns, currentVehicleType, selectedServiceIds]);

    const finalPrice = isRewardRedeemed ? 0 : Math.max(0, originalPrice - campaignDetails.discountAmount);

    const toggleService = (id) => {
        setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setPlate('');
        setSelectedServiceIds([]);
        setNotes('');
        setIsRewardRedeemed(false);
        setCustName('');
        setCustPhone('');
        setQuickPlateContext('');
        setServiceSearch('');
        setShowCartMobile(false);
        setPaymentMethod('cash');
    };

    const handleSaveCheckout = () => {
        if (!plate) {
            showNotification("Lütfen işlem yapabilmek için araç plakası girin.", "error");
            return;
        }
        if (isNewCustomerMode && !validateTurkishPlate(plate)) {
            showNotification("Plaka formatı geçersiz. Örn: 34ABC123", "error");
            return;
        }
        if (selectedServiceIds.length === 0) {
            showNotification("En az 1 adet hizmet seçmelisiniz.", "error");
            return;
        }

        let customerId = '';
        let snapshot = null;

        if (isNewCustomerMode) {
            if (!custName || !custPhone) {
                showNotification("Yeni müşteri için Ad Soyad ve Telefon gereklidir.", "error");
                return;
            }
            const newCust = {
                id: generateUUID(),
                plate: normalizePlate(plate),
                name: custName,
                phone: custPhone,
                vehicleType,
                createdAt: new Date().toISOString()
            };
            setCustomers(prev => [...prev, newCust]);
            customerId = newCust.id;
            snapshot = { plate: newCust.plate, name: newCust.name, phone: newCust.phone, vehicleType };
            showNotification("Yeni müşteri profili kaydedildi.");
        } else if (matchedCustomer) {
            customerId = matchedCustomer.id;
            snapshot = {
                plate: matchedCustomer.plate,
                name: matchedCustomer.name,
                phone: matchedCustomer.phone,
                vehicleType: matchedCustomer.vehicleType
            };
        } else {
            showNotification("Lütfen müşteri bilgilerini doğrulayın.", "error");
            return;
        }

        const newTransaction = {
            id: generateUUID(),
            customerId,
            customerSnapshot: snapshot,
            serviceIds: selectedServiceIds,
            totalPrice: finalPrice,
            discountAmount: isRewardRedeemed ? originalPrice : campaignDetails.discountAmount,
            campaignIds: isRewardRedeemed ? [] : campaignDetails.appliedCampaigns.map(c => c.id),
            paymentMethod: isRewardRedeemed ? LOYALTY_REWARD_PAYMENT : paymentMethod,
            date: new Date().toISOString(),
            status: 'COMPLETED',
            notes: notes + (isRewardRedeemed ? ' [SADAKAT ÖDÜL KULLANIMI]' : ''),
            isLoyaltyReward: isRewardRedeemed
        };

        setTransactions(prev => [...prev, newTransaction]);
        showNotification("Satış işlemi başarıyla tamamlandı!");

        // Fiş hazırla
        setReceipt({
            date: newTransaction.date,
            customer: snapshot,
            lines: selectedServices.map(s => ({
                label: s.name,
                amount: s.prices?.[currentVehicleType] || 0
            })),
            subTotal: originalPrice,
            discount: isRewardRedeemed ? originalPrice : campaignDetails.discountAmount,
            total: finalPrice,
            paymentMethod: isRewardRedeemed ? LOYALTY_REWARD_PAYMENT : paymentMethod,
            note: notes
        });

        if (pendingFromAppointment?.appointmentId && typeof setAppointments === 'function') {
            setAppointments(prev => prev.map(a => a.id === pendingFromAppointment.appointmentId
                ? { ...a, status: 'TAMAMLANDI' }
                : a
            ));
        }
        if (typeof setPendingFromAppointment === 'function') {
            setPendingFromAppointment(null);
        }
        resetForm();
    };

    const canCheckout = plate && selectedServiceIds.length > 0 && (matchedCustomer || (isNewCustomerMode && custName && custPhone));

    return (
        <div className="space-y-6 text-left pb-32 lg:pb-0">
            <PageHeader
                title="Hızlı Satış / Kasa"
                description="Plakayı girin, hizmetleri seçin, tek tuşla tahsilatı tamamlayın."
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                {/* SOL: Ana akış */}
                <div className="space-y-5">
                    {/* Plaka inputu - büyük ve odaklı */}
                    <div className="bg-gradient-to-br from-darkBg-card to-darkBg-deep border border-darkBg-border rounded-2xl p-5 shadow-lg">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2">
                            Araç Plakası
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400">
                                <Icons.Car />
                            </span>
                            <input
                                type="text"
                                autoFocus
                                value={plate}
                                onChange={(e) => setPlate(normalizePlate(e.target.value))}
                                placeholder="34ABC123"
                                maxLength={10}
                                className="w-full bg-darkBg-deep border-2 border-darkBg-border focus:border-brand-500 pl-14 pr-4 py-4 rounded-xl text-center uppercase tracking-[0.3em] font-extrabold text-3xl text-white outline-none transition"
                            />
                            {plate && (
                                <button
                                    type="button"
                                    onClick={() => setPlate('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-darkBg-card hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                                    aria-label="Plakayı temizle"
                                >
                                    <Icons.X />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Müşteri kartı */}
                    {matchedCustomer && (
                        <div className="bg-darkBg-card border border-emerald-500/30 rounded-2xl p-5 shadow-lg animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-extrabold text-lg shrink-0">
                                    {initials(matchedCustomer.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                            <Icons.Check /> Kayıtlı Müşteri
                                        </span>
                                        <span className="text-[10px] bg-brand-500/15 text-brand-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            {matchedCustomer.vehicleType}
                                        </span>
                                    </div>
                                    <p className="text-base font-bold text-white truncate mt-0.5">{matchedCustomer.name}</p>
                                    <p className="text-xs text-gray-400">{matchedCustomer.phone}</p>
                                </div>
                            </div>

                            {/* Sadakat */}
                            <div className="mt-4 pt-3 border-t border-darkBg-border">
                                <div className="flex justify-between items-center mb-2 text-xs">
                                    <span className="text-gray-400 font-semibold">Sadakat İlerlemesi</span>
                                    <span className="text-white font-bold">
                                        {loyaltyStats.paidVisits} / {loyaltyStats.target}
                                    </span>
                                </div>
                                <div className="w-full bg-darkBg-deep rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${loyaltyStats.ready ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                        style={{ width: `${loyaltyStats.ready ? 100 : (loyaltyStats.progress / loyaltyStats.target) * 100}%` }}
                                    />
                                </div>
                                {loyaltyStats.ready ? (
                                    <label className="mt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 cursor-pointer hover:bg-emerald-500/15 transition">
                                        <div className="flex items-center gap-2 text-emerald-300">
                                            <Icons.Gift />
                                            <div>
                                                <span className="text-xs font-bold block">{loyaltyStats.availableRewards} adet bedava yıkama hakkı</span>
                                                <span className="text-[10px] text-emerald-400/80">Bu satışta kullan (tutar 0 ₺ olur)</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isRewardRedeemed}
                                            onChange={(e) => setIsRewardRedeemed(e.target.checked)}
                                            className="w-5 h-5 rounded text-emerald-600 bg-darkBg-deep border-emerald-700 focus:ring-emerald-500"
                                        />
                                    </label>
                                ) : (
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Hediyeye <span className="text-brand-400 font-extrabold">{loyaltyStats.nextRewardIn}</span> ücretli yıkama kaldı.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {isNewCustomerMode && (
                        <div className="bg-darkBg-card border border-amber-500/30 rounded-2xl p-5 shadow-lg animate-fade-in space-y-3">
                            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                                <Icons.AlertTriangle />
                                <span>Yeni müşteri kaydı oluşturulacak</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={custName}
                                    onChange={(e) => setCustName(e.target.value)}
                                    placeholder="Müşteri Ad Soyad *"
                                    className="bg-darkBg-deep border border-darkBg-border focus:border-amber-500 px-3 py-2.5 rounded-lg text-sm text-white outline-none transition"
                                />
                                <input
                                    type="text"
                                    value={custPhone}
                                    onChange={(e) => setCustPhone(e.target.value)}
                                    placeholder="Telefon *"
                                    className="bg-darkBg-deep border border-darkBg-border focus:border-amber-500 px-3 py-2.5 rounded-lg text-sm text-white outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2">Araç Tipi</label>
                                <div className="flex flex-wrap gap-2">
                                    {VEHICLE_TYPES.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setVehicleType(t.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                                vehicleType === t.id
                                                    ? 'bg-amber-600 border-amber-500 text-white'
                                                    : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-amber-500/60'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hizmet seçimi */}
                    <div className="bg-darkBg-card border border-darkBg-border rounded-2xl p-5 shadow-lg space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h3 className="text-sm font-bold text-white">Hizmet Seçimi</h3>
                                <p className="text-[11px] text-gray-500">
                                    Fiyatlar <span className="text-brand-300 font-bold">{currentVehicleType}</span> sınıfına göre.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icons.Search /></span>
                                <input
                                    type="text"
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                    placeholder="Hizmet ara..."
                                    className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 pl-9 pr-3 py-2 rounded-lg text-xs text-white outline-none transition"
                                />
                            </div>
                        </div>

                        {visibleServices.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-10">
                                {serviceSearch ? 'Aramayla eşleşen hizmet yok.' : 'Aktif hizmet yok. Hizmet Kataloğu sekmesinden ekleyin.'}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {visibleServices.map(srv => {
                                    const price = srv.prices?.[currentVehicleType] || 0;
                                    const isChecked = selectedServiceIds.includes(srv.id);
                                    const unavailable = price === 0;
                                    return (
                                        <button
                                            key={srv.id}
                                            type="button"
                                            disabled={unavailable}
                                            onClick={() => !unavailable && toggleService(srv.id)}
                                            aria-pressed={isChecked}
                                            className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 group ${
                                                unavailable
                                                    ? 'bg-darkBg-deep/50 border-darkBg-border/50 opacity-40 cursor-not-allowed'
                                                    : isChecked
                                                        ? 'bg-brand-600/15 border-brand-500 shadow-lg shadow-brand-500/10'
                                                        : 'bg-darkBg-deep border-darkBg-border hover:border-brand-500/60 hover:bg-darkBg-hover active:scale-[0.98]'
                                            }`}
                                        >
                                            <div className={`absolute top-3 right-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${
                                                isChecked ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-700 text-transparent group-hover:border-brand-500/50'
                                            }`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="pr-8 space-y-3">
                                                <p className={`text-sm font-bold leading-snug ${isChecked ? 'text-white' : 'text-gray-200'}`}>
                                                    {srv.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-darkBg-card px-2 py-1 rounded-full">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {srv.duration} dk
                                                    </span>
                                                    <span className={`font-extrabold text-base ${unavailable ? 'text-gray-600' : isChecked ? 'text-emerald-300' : 'text-white'}`}>
                                                        {unavailable ? 'Uygulanmaz' : formatCurrency(price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Notlar */}
                    <div className="bg-darkBg-card border border-darkBg-border rounded-2xl p-5 shadow-lg">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2">
                            İş Emri / Not
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Aracın çizikleri, jant talebi, müşteri talebi..."
                            className="w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 px-3 py-2.5 rounded-lg text-xs text-white outline-none transition resize-none"
                        />
                    </div>
                </div>

                {/* SAĞ: Sticky cart (desktop) */}
                <aside className="hidden lg:block">
                    <div className="sticky top-4 space-y-4">
                        <CartPanel
                            selectedServices={selectedServices}
                            currentVehicleType={currentVehicleType}
                            originalPrice={originalPrice}
                            campaignDetails={campaignDetails}
                            isRewardRedeemed={isRewardRedeemed}
                            finalPrice={finalPrice}
                            totalDuration={totalDuration}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            onRemove={(id) => toggleService(id)}
                            onCheckout={handleSaveCheckout}
                            canCheckout={canCheckout}
                        />
                    </div>
                </aside>
            </div>

            {/* Mobile sticky bottom bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-darkBg-card border-t border-darkBg-border shadow-2xl z-30">
                {showCartMobile && (
                    <div className="p-4 max-h-[60vh] overflow-y-auto border-b border-darkBg-border">
                        <CartPanel
                            selectedServices={selectedServices}
                            currentVehicleType={currentVehicleType}
                            originalPrice={originalPrice}
                            campaignDetails={campaignDetails}
                            isRewardRedeemed={isRewardRedeemed}
                            finalPrice={finalPrice}
                            totalDuration={totalDuration}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            onRemove={(id) => toggleService(id)}
                            onCheckout={handleSaveCheckout}
                            canCheckout={canCheckout}
                            compact
                        />
                    </div>
                )}
                <div className="p-3 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCartMobile(prev => !prev)}
                        className="flex-1 text-left"
                    >
                        <span className="text-[10px] text-gray-400 block">
                            {selectedServices.length} hizmet • {totalDuration} dk
                        </span>
                        <span className="text-xl font-extrabold text-emerald-400">
                            {formatCurrency(finalPrice)}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveCheckout}
                        disabled={!canCheckout}
                        className={`px-5 py-3 rounded-xl font-extrabold text-sm transition shadow-lg ${
                            canCheckout
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-darkBg-deep text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        Tahsil Et
                    </button>
                </div>
            </div>

            <ReceiptPrint
                isOpen={!!receipt}
                data={receipt}
                onClose={() => setReceipt(null)}
            />
        </div>
    );
};

const CartPanel = ({
    selectedServices,
    currentVehicleType,
    originalPrice,
    campaignDetails,
    isRewardRedeemed,
    finalPrice,
    totalDuration,
    paymentMethod,
    setPaymentMethod,
    onRemove,
    onCheckout,
    canCheckout,
    compact = false
}) => (
    <div className={`bg-darkBg-card border border-darkBg-border rounded-2xl shadow-lg ${compact ? '' : 'p-5'}`}>
        {!compact && (
            <div className="flex items-center justify-between border-b border-darkBg-border pb-3 mb-3">
                <h3 className="text-sm font-bold text-white">Sepet</h3>
                <span className="text-[10px] bg-brand-500/15 text-brand-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {currentVehicleType}
                </span>
            </div>
        )}

        {selectedServices.length === 0 ? (
            <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-darkBg-deep mx-auto flex items-center justify-center text-gray-600 mb-2">
                    <Icons.Clipboard />
                </div>
                <p className="text-xs text-gray-500">Henüz hizmet seçilmedi.</p>
            </div>
        ) : (
            <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto pr-1">
                {selectedServices.map(srv => (
                    <div key={srv.id} className="flex items-center justify-between gap-2 bg-darkBg-deep border border-darkBg-border rounded-lg p-2.5 group">
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-200 truncate">{srv.name}</p>
                            <p className="text-[10px] text-gray-500">{srv.duration} dk</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-emerald-400">
                                {formatCurrency(srv.prices?.[currentVehicleType] || 0)}
                            </span>
                            <button
                                type="button"
                                onClick={() => onRemove(srv.id)}
                                className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition"
                                aria-label="Hizmeti çıkar"
                            >
                                <Icons.X />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="space-y-2 text-xs border-t border-darkBg-border pt-3">
            <div className="flex justify-between text-gray-400">
                <span>Toplam Süre</span>
                <span className="font-bold text-gray-200">{totalDuration} dk</span>
            </div>
            <div className="flex justify-between text-gray-400">
                <span>Ara Toplam</span>
                <span className="font-bold text-gray-200">{formatCurrency(originalPrice)}</span>
            </div>
            {!isRewardRedeemed && campaignDetails.discountAmount > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between text-emerald-400">
                        <span>Kampanya İndirimi</span>
                        <span className="font-bold">- {formatCurrency(campaignDetails.discountAmount)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {campaignDetails.appliedCampaigns.map(c => (
                            <span key={c.id} className="text-[9px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {isRewardRedeemed && (
                <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1"><Icons.Gift /> Sadakat Ödülü</span>
                    <span className="font-bold">- {formatCurrency(originalPrice)}</span>
                </div>
            )}
        </div>

        <div className="border-t border-darkBg-border mt-3 pt-3 flex items-end justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Tahsil Edilecek</span>
            <span className="text-2xl font-extrabold text-emerald-400">
                {formatCurrency(finalPrice)}
            </span>
        </div>

        {!isRewardRedeemed && (
            <div className="mt-3">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2">Ödeme Yöntemi</label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PAYMENT_METHODS.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPaymentMethod(p.id)}
                            className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 ${
                                paymentMethod === p.id
                                    ? 'bg-brand-600 border-brand-500 text-white'
                                    : 'bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-brand-500/40'
                            }`}
                        >
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <button
            type="button"
            onClick={onCheckout}
            disabled={!canCheckout}
            className={`w-full mt-4 py-3 rounded-xl font-extrabold text-sm transition shadow-lg ${
                canCheckout
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-[0.98]'
                    : 'bg-darkBg-deep text-gray-600 cursor-not-allowed'
            }`}
        >
            Tahsil Et & Tamamla
        </button>
    </div>
);
