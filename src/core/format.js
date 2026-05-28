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
