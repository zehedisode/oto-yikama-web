const { useState, useEffect, useMemo } = React;

import { normalizePlate, validateTurkishPlate, formatCurrency, VEHICLE_TYPES, computeLoyaltyStats } from '../core/app-core.js';
import { generateUUID } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Icons } from '../core/icons.jsx';

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
        if (quickPlateContext) {
            setPlate(quickPlateContext);
        }
    }, [quickPlateContext]);

    const loyaltyStats = useMemo(() => {
        if (!matchedCustomer) {
            return { paidVisits: 0, availableRewards: 0, nextRewardIn: 0, target: settings.loyalty_target_visits || 5, progress: 0, ready: false };
        }
        const stats = computeLoyaltyStats(matchedCustomer.id, transactions, settings.loyalty_target_visits);
        return {
            visitsCount: stats.paidVisits,
            paidVisits: stats.paidVisits,
            availableRewards: stats.availableRewards,
            nextRewardIn: stats.nextRewardIn,
            target: stats.target,
            progress: stats.progress,
            ready: stats.ready
        };
    }, [matchedCustomer, transactions, settings.loyalty_target_visits]);

    const currentVehicleType = matchedCustomer ? matchedCustomer.vehicleType : vehicleType;
    
    const originalPrice = useMemo(() => {
        return selectedServiceIds.reduce((sum, sId) => {
            const service = services.find(s => s.id === sId && s.isActive);
            if (service && service.prices[currentVehicleType]) {
                return sum + service.prices[currentVehicleType];
            }
            return sum;
        }, 0);
    }, [selectedServiceIds, services, currentVehicleType]);

    const campaignDetails = useMemo(() => {
        let totalDiscount = 0;
        const appliedCampaigns = [];

        campaigns.forEach(camp => {
            if (!camp.isActive) return;
            if (camp.applicableVehicleTypes.length > 0 && !camp.applicableVehicleTypes.includes(currentVehicleType)) return;
            if (camp.minSpend > 0 && originalPrice < camp.minSpend) return;

            const containsService = selectedServiceIds.some(sId => camp.applicableServices.includes(sId));
            if (selectedServiceIds.length > 0 && camp.applicableServices.length > 0 && !containsService) return;

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
                vehicleType: vehicleType,
                createdAt: new Date().toISOString()
            };
            setCustomers(prev => [...prev, newCust]);
            customerId = newCust.id;
            showNotification("Yeni müşteri profili kaydedildi.");
        } else if (matchedCustomer) {
            customerId = matchedCustomer.id;
        } else {
            showNotification("Lütfen müşteri bilgilerini doğrulayın.", "error");
            return;
        }

        const newTransaction = {
            id: generateUUID(),
            customerId: customerId,
            serviceIds: selectedServiceIds,
            totalPrice: finalPrice,
            discountAmount: isRewardRedeemed ? originalPrice : campaignDetails.discountAmount,
            campaignIds: isRewardRedeemed ? [] : campaignDetails.appliedCampaigns.map(c => c.id),
            date: new Date().toISOString(),
            status: 'COMPLETED',
            notes: notes + (isRewardRedeemed ? ' [SADAKAT ÖDÜL KULLANIMI]' : ''),
            isLoyaltyReward: isRewardRedeemed
        };

        setTransactions(prev => [...prev, newTransaction]);
        showNotification("Satış işlemi başarıyla tamamlandı. Kayıt sisteme işlendi!");
        
        setPlate('');
        setSelectedServiceIds([]);
        setNotes('');
        setIsRewardRedeemed(false);
        setCustName('');
        setCustPhone('');
        setQuickPlateContext('');
    };

    return (
        <div className="space-y-6 text-left">
            <PageHeader
                title="Yeni Satış ve Hizmet Kaydı"
                description="Plaka girildiğinde mevcut CRM kaydı otomatik taranır; yeni araçlar aynı akışta kaydedilir."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4">
                    <h3 className="text-sm font-bold text-gray-300 border-b border-darkBg-border pb-2">1. Araç & Müşteri Tanımı</h3>
                    
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-semibold block">Araç Plakası</label>
                        <input 
                            type="text" 
                            value={plate}
                            onChange={(e) => setPlate(normalizePlate(e.target.value))}
                            placeholder="Örn: 34ABC123" 
                            className="w-full bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-center uppercase tracking-wider font-extrabold text-xl focus:outline-none focus:border-brand-500 text-white"
                        />
                    </div>

                    {matchedCustomer && (
                        <div className="bg-brand-950/20 border border-brand-800/30 p-4 rounded-lg space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><Icons.Check /> Kayıtlı Müşteri</span>
                                <span className="text-[10px] bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded-full">{matchedCustomer.vehicleType}</span>
                            </div>
                            <p className="text-sm font-bold text-white">{matchedCustomer.name}</p>
                            <p className="text-xs text-gray-400">{matchedCustomer.phone}</p>
                            
                            <div className="border-t border-darkBg-border pt-2 mt-2 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Sadakat Programı</span>
                                    <span className="text-white font-bold">{loyaltyStats.paidVisits} / {loyaltyStats.target} ücretli yıkama</span>
                                </div>
                                <div className="w-full bg-darkBg-deep rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-300 ${loyaltyStats.ready ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                        style={{ width: `${loyaltyStats.ready ? 100 : (loyaltyStats.progress / loyaltyStats.target) * 100}%` }}
                                    />
                                </div>
                                {loyaltyStats.ready ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded flex items-center justify-between text-emerald-400 text-xs animate-pulse">
                                        <span className="font-semibold flex items-center gap-1">
                                            <Icons.Gift /> Hediye Yıkama Hazır
                                        </span>
                                        <span className="font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px]">{loyaltyStats.availableRewards} adet</span>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Hediyeye <span className="text-brand-400 font-extrabold">{loyaltyStats.nextRewardIn}</span> ücretli yıkama kaldı.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {isNewCustomerMode && (
                        <div className="bg-amber-950/10 border border-amber-900/30 p-4 rounded-lg space-y-3 animate-fade-in">
                            <p className="text-xs text-amber-400 font-bold flex items-center gap-2"><Icons.AlertTriangle /> Yeni Araç / Müşteri Profili</p>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Müşteri Ad Soyadı</label>
                                <input 
                                    type="text" 
                                    value={custName}
                                    onChange={(e) => setCustName(e.target.value)}
                                    placeholder="Ahmet Yılmaz" 
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Telefon Numarası</label>
                                <input 
                                    type="text" 
                                    value={custPhone}
                                    onChange={(e) => setCustPhone(e.target.value)}
                                    placeholder="05..." 
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Araç Tipi</label>
                                <select 
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white"
                                >
                                    {VEHICLE_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.label.toLocaleUpperCase('tr-TR')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4 flex flex-col">
                    <div className="flex items-center justify-between border-b border-darkBg-border pb-2">
                        <h3 className="text-sm font-bold text-gray-300">2. Hizmet Seçimi</h3>
                        <span className="text-[10px] bg-brand-500/15 text-brand-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {currentVehicleType}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">
                            <span className="font-bold text-white">{selectedServiceIds.length}</span> hizmet seçildi
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-400">{formatCurrency(originalPrice)}</span>
                            {selectedServiceIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedServiceIds([])}
                                    className="text-gray-400 hover:text-red-400 underline-offset-2 hover:underline transition"
                                >
                                    Temizle
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                        {services.filter(s => s.isActive).length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-8 col-span-full">
                                Aktif hizmet bulunamadı. Hizmet Kataloğu sekmesinden ekleyin.
                            </p>
                        )}
                        {services.map(srv => {
                            if (!srv.isActive) return null;
                            const price = srv.prices[currentVehicleType] || 0;
                            const isChecked = selectedServiceIds.includes(srv.id);
                            const toggle = () => {
                                if (isChecked) {
                                    setSelectedServiceIds(prev => prev.filter(id => id !== srv.id));
                                } else {
                                    setSelectedServiceIds(prev => [...prev, srv.id]);
                                }
                            };
                            return (
                                <button
                                    type="button"
                                    key={srv.id}
                                    onClick={toggle}
                                    aria-pressed={isChecked}
                                    className={`relative text-left p-4 rounded-lg border transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
                                        isChecked
                                            ? 'bg-brand-600/15 border-brand-500 shadow shadow-brand-500/10'
                                            : 'bg-darkBg-deep border-darkBg-border hover:border-brand-500/60 hover:bg-darkBg-hover'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                            isChecked
                                                ? 'bg-brand-500 border-brand-500 text-white'
                                                : 'border-gray-600 text-transparent'
                                        }`}
                                        aria-hidden="true"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>

                                    <div className="pr-7 space-y-2">
                                        <p className={`text-xs font-bold leading-snug ${isChecked ? 'text-white' : 'text-gray-200'}`}>
                                            {srv.name}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 text-[10px]">
                                            <span className="inline-flex items-center gap-1 text-gray-400">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {srv.duration} dk
                                            </span>
                                            <span className={`font-extrabold ${isChecked ? 'text-emerald-300' : 'text-gray-200'}`}>
                                                {formatCurrency(price)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-1 pt-2 border-t border-darkBg-border">
                        <label className="text-xs text-gray-400 font-semibold block">İş Emri / Satış Notu</label>
                        <textarea 
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Araçta çizikler var, jant temizliği vb."
                            className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white resize-none"
                        />
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow flex flex-col justify-between space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 border-b border-darkBg-border pb-2 mb-4">3. Ödeme Detayları</h3>
                        
                        {loyaltyStats.availableRewards > 0 && (
                            <div className="mb-4 bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center space-x-2">
                                        <Icons.Gift />
                                        <div className="text-left">
                                            <span className="text-xs font-bold text-white block">Müşteri Ödülü Kullanılsın</span>
                                            <span className="text-[10px] text-emerald-400">Ücretsiz Yıkama Tanımla (0 ₺)</span>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={isRewardRedeemed}
                                        onChange={(e) => setIsRewardRedeemed(e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 bg-darkBg-deep focus:ring-emerald-500 border-emerald-700"
                                    />
                                </label>
                            </div>
                        )}

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-gray-400">
                                <span>Araç Tipi Sınıfı</span>
                                <span className="font-bold text-gray-200">{currentVehicleType}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Brüt Hizmet Tutarı</span>
                                <span className="font-bold text-gray-200">{formatCurrency(originalPrice)}</span>
                            </div>
                            {campaignDetails.discountAmount > 0 && !isRewardRedeemed && (
                                <div className="flex justify-between text-emerald-400">
                                    <span>Kampanya İndirimi ({campaignDetails.appliedCampaigns.map(c => c.name).join(', ')})</span>
                                    <span className="font-bold">- {formatCurrency(campaignDetails.discountAmount)}</span>
                                </div>
                            )}
                            {isRewardRedeemed && (
                                <div className="flex justify-between text-emerald-400">
                                    <span>Sadakat Programı İndirimi</span>
                                    <span className="font-bold">- {formatCurrency(originalPrice)}</span>
                                </div>
                            )}
                            <hr className="border-darkBg-border my-2" />
                            <div className="flex justify-between text-sm font-extrabold text-white">
                                <span>Tahsil Edilecek Tutar</span>
                                <span className="text-lg text-emerald-400">{formatCurrency(finalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleSaveCheckout}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg text-sm transition shadow-lg shadow-emerald-950/20 active:scale-95"
                    >
                        Faturayı Onayla & Tamamla
                    </button>
                </div>
            </div>
        </div>
    );
};
