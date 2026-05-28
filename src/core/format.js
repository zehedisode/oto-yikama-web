// Tarih ve tarih-saat formatlama helper'ları.
// Tüm tab/UI bileşenleri new Date(x).toLocaleString('tr-TR') yerine bunu çağırır;
// böylece locale veya format kararı tek noktadan değişir.

const TR = 'tr-TR';
const FALLBACK = '—';

const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (value, fallback = FALLBACK) => {
    const d = toDate(value);
    return d ? d.toLocaleString(TR) : fallback;
};

export const formatDate = (value, fallback = FALLBACK) => {
    const d = toDate(value);
    return d ? d.toLocaleDateString(TR) : fallback;
};

export const formatTime = (value, fallback = FALLBACK) => {
    const d = toDate(value);
    return d ? d.toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' }) : fallback;
};

// Tarihler arası kalan gün farkı (yuvarlanmış). value gelecekteyse pozitif gün döner.
export const daysBetween = (from, to = new Date()) => {
    const a = toDate(from);
    const b = toDate(to);
    if (!a || !b) return null;
    const ms = b.getTime() - a.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
};

export const daysSince = (value) => daysBetween(value, new Date());

// "şimdi", "5 dk sonra", "3 gün önce" gibi göreli ifade.
// AppointmentsTab ve CustomersTab kendi versiyonlarını yazmasın diye buraya taşındı.
// Pozitif değerler "sonra", negatif değerler "önce" olarak okunur.
export const formatRelative = (value, fallback = '') => {
    const d = toDate(value);
    if (!d) return fallback;
    const diffMin = Math.round((d.getTime() - Date.now()) / 60000);
    if (Math.abs(diffMin) < 60) {
        if (diffMin === 0) return 'şimdi';
        return diffMin > 0 ? `${diffMin} dk sonra` : `${-diffMin} dk önce`;
    }
    const diffH = Math.round(diffMin / 60);
    if (Math.abs(diffH) < 24) return diffH > 0 ? `${diffH} sa sonra` : `${-diffH} sa önce`;
    const diffD = Math.round(diffH / 24);
    if (Math.abs(diffD) < 7) return diffD > 0 ? `${diffD} gün sonra` : `${-diffD} gün önce`;
    if (Math.abs(diffD) < 30) {
        const w = Math.round(diffD / 7);
        return w > 0 ? `${w} hafta sonra` : `${-w} hafta önce`;
    }
    if (Math.abs(diffD) < 365) {
        const m = Math.round(diffD / 30);
        return m > 0 ? `${m} ay sonra` : `${-m} ay önce`;
    }
    const y = Math.round(diffD / 365);
    return y > 0 ? `${y} yıl sonra` : `${-y} yıl önce`;
};
