// PIN brute-force koruması için kalıcı (localStorage) sayaç ve cooldown yönetimi.
// Sayfa yenilense / sekme kapatılıp açılsa bile başarısız denemeler hatırlanır;
// bu sayede saldırgan refresh ile sayacı sıfırlayamaz.

const LOCK_KEY = 'otoyikama_pin_attempts';

// Her 5 başarısız denemede bir cooldown başlatılır.
export const PIN_ATTEMPT_LIMIT = 5;
// Cooldown süresi (ms). 5 başarısızlıkta 30sn, 10'da 60sn, 15'de 120sn ... şeklinde artar.
const BASE_COOLDOWN_MS = 30 * 1000;

const safeParse = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

export const getPinLockState = () => {
    if (typeof localStorage === 'undefined') {
        return { failedAttempts: 0, lockedUntil: 0 };
    }
    const parsed = safeParse(localStorage.getItem(LOCK_KEY));
    if (!parsed || typeof parsed !== 'object') {
        return { failedAttempts: 0, lockedUntil: 0 };
    }
    return {
        failedAttempts: Number(parsed.failedAttempts) || 0,
        lockedUntil: Number(parsed.lockedUntil) || 0
    };
};

const persist = (state) => {
    try {
        localStorage.setItem(LOCK_KEY, JSON.stringify(state));
    } catch {
        // sessizce yok say; depolama dolu/devre dışıysa yine de RAM'deki state ile devam ederiz.
    }
};

export const recordFailedPinAttempt = () => {
    const current = getPinLockState();
    const failedAttempts = current.failedAttempts + 1;

    let lockedUntil = current.lockedUntil;
    if (failedAttempts > 0 && failedAttempts % PIN_ATTEMPT_LIMIT === 0) {
        const tier = Math.floor(failedAttempts / PIN_ATTEMPT_LIMIT);
        lockedUntil = Date.now() + BASE_COOLDOWN_MS * tier;
    }

    const next = { failedAttempts, lockedUntil };
    persist(next);
    return next;
};

export const resetPinLockState = () => {
    persist({ failedAttempts: 0, lockedUntil: 0 });
};

export const getCooldownRemainingMs = () => {
    const { lockedUntil } = getPinLockState();
    return Math.max(0, lockedUntil - Date.now());
};

export const isPinLockedOut = () => getCooldownRemainingMs() > 0;
