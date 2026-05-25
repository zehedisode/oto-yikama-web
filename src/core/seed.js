export const DEFAULT_ADMIN_USER = () => [
    { id: 'admin-1', name: 'Yönetici', pinCode: '1234', createdAt: new Date().toISOString() }
];

export const DEFAULT_SERVICES = () => [
    {
        id: 'srv-1',
        name: 'İç & Dış Yıkama Standart',
        prices: { SEDAN: 500, SUV: 600, MINIBUS: 700, TICARI: 640, MOTOSIKLET: 300 },
        duration: 45,
        isActive: true
    },
    {
        id: 'srv-2',
        name: 'Detaylı Koltuk Temizliği',
        prices: { SEDAN: 2400, SUV: 2800, MINIBUS: 3600, TICARI: 3000, MOTOSIKLET: 1000 },
        duration: 120,
        isActive: true
    },
    {
        id: 'srv-3',
        name: 'Pasta Cila & Boya Koruma',
        prices: { SEDAN: 2500, SUV: 3000, MINIBUS: 3500, TICARI: 3000, MOTOSIKLET: 1200 },
        duration: 180,
        isActive: true
    },
    {
        id: 'srv-4',
        name: 'Motor Koruma & Temizleme',
        prices: { SEDAN: 800, SUV: 900, MINIBUS: 1000, TICARI: 1000, MOTOSIKLET: 600 },
        duration: 35,
        isActive: true
    },
    {
        id: 'srv-5',
        name: 'Hızlı Dış Yıkama',
        prices: { SEDAN: 300, SUV: 350, MINIBUS: 400, TICARI: 380, MOTOSIKLET: 200 },
        duration: 20,
        isActive: true
    },
    {
        id: 'srv-6',
        name: 'Halı & Paspas Yıkama',
        prices: { SEDAN: 600, SUV: 700, MINIBUS: 900, TICARI: 800, MOTOSIKLET: 0 },
        duration: 60,
        isActive: true
    },
    {
        id: 'srv-7',
        name: 'Jant & Lastik Parlatma',
        prices: { SEDAN: 250, SUV: 300, MINIBUS: 350, TICARI: 320, MOTOSIKLET: 150 },
        duration: 25,
        isActive: true
    },
    {
        id: 'srv-8',
        name: 'Tavan & Döşeme Lekesi Sökme',
        prices: { SEDAN: 1500, SUV: 1800, MINIBUS: 2200, TICARI: 1900, MOTOSIKLET: 0 },
        duration: 90,
        isActive: true
    },
    {
        id: 'srv-9',
        name: 'Seramik Nano Kaplama (Premium)',
        prices: { SEDAN: 6500, SUV: 7500, MINIBUS: 9000, TICARI: 8000, MOTOSIKLET: 3500 },
        duration: 360,
        isActive: true
    }
];

export const DEFAULT_PRODUCTS = () => [
    { id: 'prod-1', name: 'Hızlı Cila Spreyi (300ml)', category: 'Hızlı Satış', price: 150.00, cost: 70.00, stock: 25, unit: 'Adet', isActive: true },
    { id: 'prod-2', name: 'Mikrofiber Kurulama Bezi', category: 'Ekipman', price: 90.00, cost: 40.00, stock: 40, unit: 'Adet', isActive: true },
    { id: 'prod-3', name: 'Oto Parfümü (Kavun)', category: 'Kozmetik', price: 40.00, cost: 15.00, stock: 80, unit: 'Adet', isActive: true }
];
