export const DEFAULT_SETTINGS = Object.freeze({
    loyalty_target_visits: 5,
    idle_lock_time: 60,
    pin_security_enabled: true,
    last_backup_at: null,
    backup_reminder_days: 7
});

// PIN uzunluk sınırları. Eski sürümlerle geriye dönük uyumlu olmak için
// minimum 4'te tutuldu; üst sınır kullanıcıya esneklik sağlar.
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 12;

export const VEHICLE_TYPES = Object.freeze([
    { id: 'SEDAN', label: 'Sedan' },
    { id: 'SUV', label: 'SUV' },
    { id: 'MINIBUS', label: 'Minibüs' },
    { id: 'TICARI', label: 'Ticari' },
    { id: 'MOTOSIKLET', label: 'Motosiklet' }
]);

export const PAYMENT_METHODS = Object.freeze([
    { id: 'cash', label: 'Nakit', icon: '💵' },
    { id: 'card', label: 'Kart', icon: '💳' },
    { id: 'transfer', label: 'Havale / EFT', icon: '🏦' },
    { id: 'unpaid', label: 'Açık Hesap', icon: '⏳' }
]);

// Sadakat ödülü ile yapılan satışlarda paymentMethod alanına yazılan özel sentinel değer.
// PAYMENT_METHODS listesinin dışında durur; raporlar bunu gördüğünde "Ödül" olarak gösterir.
export const LOYALTY_REWARD_PAYMENT = 'reward';

// Müşteri kartı silindiğinde geçmiş işlemlerin işaretlendiği sentinel id.
// Ciroyu ve gelir kayıtlarını korur; UI'da "Anonim Müşteri" olarak gösterilir.
export const ANONYMOUS_CUSTOMER_ID = 'ANONIM_MUSTERI';

// Hızlı market satışlarında müşteri seçilmediğinde kullanılan sentinel id.
// UI'da "Cari Müşteri (Kayıtsız)" olarak gösterilir.
export const WALK_IN_CUSTOMER_ID = 'CARI_MUSTERI';

export const getPaymentLabel = (id) => {
    if (id === LOYALTY_REWARD_PAYMENT) return 'Sadakat Ödülü';
    return PAYMENT_METHODS.find(p => p.id === id)?.label || 'Nakit';
};

export const APPOINTMENT_STATUS = Object.freeze({
    PENDING: 'BEKLEYOR',
    COMPLETED: 'TAMAMLANDI',
    CANCELLED: 'IPTAL'
});

export const TRANSACTION_STATUS = Object.freeze({
    COMPLETED: 'COMPLETED'
});

export const createEmptyPinGate = () => ({
    isOpen: false,
    onSuccess: null,
    onFail: null,
    customText: ''
});

export const normalizePlate = (value = '') => {
    return value.toString().toUpperCase().replace(/\s+/g, '').trim();
};

export const validateTurkishPlate = (plate) => {
    const clean = normalizePlate(plate);
    if (!clean) return false;
    return /^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/.test(clean);
};

export const formatCurrency = (value = 0) => {
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${numericValue.toLocaleString('tr-TR')} ₺`;
};

export const parsePositiveNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const parsePositiveInteger = (value, fallback = 0) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const hasOwn = (object, key) => {
    return Object.prototype.hasOwnProperty.call(object, key);
};

// Tek noktadan sadakat hesaplaması.
// Kural: "loyalty_target_visits" kadar UCRETLI yikama biriktiren musteri,
// bir sonraki (target+1) yikamada bedava hizmet kazanir. Ornegin target=5 ise
// 5 ucretli yikamadan sonra 6. yikama odul olarak verilebilir.
export const computeLoyaltyStats = (customerId, transactions, target = 5) => {
    const safeTarget = Math.max(1, parsePositiveInteger(target, 5));
    const empty = {
        target: safeTarget,
        paidVisits: 0,
        rewardVisits: 0,
        progress: 0,
        availableRewards: 0,
        nextRewardIn: safeTarget,
        ready: false,
        completed: 0
    };
    if (!customerId || !Array.isArray(transactions)) return empty;

    const completed = transactions.filter(
        (t) => t && t.customerId === customerId && t.status === 'COMPLETED'
    );
    const paidVisits = completed.filter((t) => !t.isLoyaltyReward).length;
    const rewardVisits = completed.filter((t) => t.isLoyaltyReward).length;

    const earnedRewards = Math.floor(paidVisits / safeTarget);
    const availableRewards = Math.max(0, earnedRewards - rewardVisits);
    const progress = paidVisits % safeTarget;
    const nextRewardIn = safeTarget - progress;

    return {
        target: safeTarget,
        paidVisits,
        rewardVisits,
        progress,
        availableRewards,
        nextRewardIn: availableRewards > 0 ? 0 : nextRewardIn,
        ready: availableRewards > 0,
        completed: completed.length
    };
};
