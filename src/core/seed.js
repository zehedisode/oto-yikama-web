export const DEFAULT_ADMIN_USER = () => [
    { id: 'admin-1', name: 'Yönetici', pinCode: '1234', createdAt: new Date().toISOString() }
];

export const DEFAULT_SERVICES = () => [
    {
        id: 'srv-1',
        name: 'İç & Dış Yıkama Standart',
        prices: { SEDAN: 250, SUV: 300, MINIBUS: 350, TICARI: 320, MOTOSIKLET: 150 },
        duration: 45,
        isActive: true
    },
    {
        id: 'srv-2',
        name: 'Detaylı Koltuk Temizliği',
        prices: { SEDAN: 1200, SUV: 1400, MINIBUS: 1800, TICARI: 1500, MOTOSIKLET: 500 },
        duration: 120,
        isActive: true
    },
    {
        id: 'srv-3',
        name: 'Pasta Cila & Boya Koruma',
        prices: { SEDAN: 2500, SUV: 3000, MINIBUS: 3500, TICARI: 3000, MOTOSIKLET: 1200 },
        duration: 240,
        isActive: true
    },
    {
        id: 'srv-4',
        name: 'Motor Koruma & Temizleme',
        prices: { SEDAN: 400, SUV: 450, MINIBUS: 500, TICARI: 500, MOTOSIKLET: 300 },
        duration: 35,
        isActive: true
    }
];

export const DEFAULT_PRODUCTS = () => [
    { id: 'prod-1', name: 'Hızlı Cila Spreyi (300ml)', category: 'Hızlı Satış', price: 150.00, cost: 70.00, stock: 25, unit: 'Adet', isActive: true },
    { id: 'prod-2', name: 'Mikrofiber Kurulama Bezi', category: 'Ekipman', price: 90.00, cost: 40.00, stock: 40, unit: 'Adet', isActive: true },
    { id: 'prod-3', name: 'Oto Parfümü (Kavun)', category: 'Kozmetik', price: 40.00, cost: 15.00, stock: 80, unit: 'Adet', isActive: true }
];
