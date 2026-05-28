// Bugün / Son 7 gün / Son 30 gün filtre lojiği — tek noktadan.
// IncomeTab ve Dashboard farklı versiyonlarını yazmasın diye buraya taşındı.

export const RANGE_OPTIONS = Object.freeze([
    { id: 'today', label: 'Bugün' },
    { id: '7d', label: 'Son 7 Gün' },
    { id: '30d', label: 'Son 30 Gün' },
    { id: 'all', label: 'Tümü' }
]);

export const startOfDay = (value) => {
    const d = value instanceof Date ? new Date(value) : new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const isWithinRange = (dateValue, rangeId) => {
    if (!rangeId || rangeId === 'all') return true;
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(d.getTime())) return false;
    const today = startOfDay(new Date());
    if (rangeId === 'today') return startOfDay(d).getTime() === today.getTime();
    const days = rangeId === '7d' ? 7 : rangeId === '30d' ? 30 : 0;
    if (days <= 0) return true;
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() - (days - 1));
    return d >= threshold;
};
