import { DEFAULT_ADMIN_USER, DEFAULT_SERVICES, DEFAULT_PRODUCTS } from './seed.js';
import { DEFAULT_SETTINGS } from './app-core.js';

export const DB_KEYS = {
    USERS: 'otoyikama_users',
    CUSTOMERS: 'otoyikama_customers',
    SERVICES: 'otoyikama_services',
    TRANSACTIONS: 'otoyikama_transactions',
    APPOINTMENTS: 'otoyikama_appointments',
    EXPENSES: 'otoyikama_expenses',
    PRODUCTS: 'otoyikama_products',
    SALES: 'otoyikama_sales',
    CAMPAIGNS: 'otoyikama_campaigns',
    SETTINGS: 'otoyikama_settings'
};

export const APP_STORAGE_KEYS = Object.values(DB_KEYS);

export const generateUUID = () => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch (e) {
        // crypto.randomUUID kullanılamıyorsa fallback'e düş.
    }
    return 'uid_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36);
};

export const asArray = (value) => Array.isArray(value) ? value : [];

export const createCleanDatabase = () => ({
    users: DEFAULT_ADMIN_USER(),
    customers: [],
    services: DEFAULT_SERVICES(),
    transactions: [],
    appointments: [],
    expenses: [],
    products: DEFAULT_PRODUCTS(),
    sales: [],
    campaigns: [],
    settings: { ...DEFAULT_SETTINGS }
});

export const normalizeBackupData = (parsedData) => ({
    users: asArray(parsedData.users).length > 0 ? asArray(parsedData.users) : DEFAULT_ADMIN_USER(),
    customers: asArray(parsedData.customers),
    services: asArray(parsedData.services).length > 0 ? asArray(parsedData.services) : DEFAULT_SERVICES(),
    transactions: asArray(parsedData.transactions),
    appointments: asArray(parsedData.appointments),
    expenses: asArray(parsedData.expenses),
    products: asArray(parsedData.products),
    sales: asArray(parsedData.sales),
    campaigns: asArray(parsedData.campaigns),
    settings: { ...DEFAULT_SETTINGS, ...(parsedData.settings || {}) }
});

export const persistDatabaseObject = (data) => {
    db.set(DB_KEYS.USERS, data.users);
    db.set(DB_KEYS.CUSTOMERS, data.customers);
    db.set(DB_KEYS.SERVICES, data.services);
    db.set(DB_KEYS.TRANSACTIONS, data.transactions);
    db.set(DB_KEYS.APPOINTMENTS, data.appointments);
    db.set(DB_KEYS.EXPENSES, data.expenses);
    db.set(DB_KEYS.PRODUCTS, data.products);
    db.set(DB_KEYS.SALES, data.sales);
    db.set(DB_KEYS.CAMPAIGNS, data.campaigns);
    db.set(DB_KEYS.SETTINGS, data.settings);
};

export const db = {
    get: (key, defaultValue = []) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Veri okuma hatası:', key, e);
            return defaultValue;
        }
    },
    set: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Veri yazma hatası:', key, e);
            return false;
        }
    },
    seed: () => {
        const users = db.get(DB_KEYS.USERS, null);
        if (users === null) {
            db.set(DB_KEYS.USERS, DEFAULT_ADMIN_USER());
        }

        const services = db.get(DB_KEYS.SERVICES, null);
        if (services === null) {
            db.set(DB_KEYS.SERVICES, DEFAULT_SERVICES());
        }

        const products = db.get(DB_KEYS.PRODUCTS, null);
        if (products === null) {
            db.set(DB_KEYS.PRODUCTS, DEFAULT_PRODUCTS());
        }

        const campaigns = db.get(DB_KEYS.CAMPAIGNS, null);
        if (campaigns === null) {
            db.set(DB_KEYS.CAMPAIGNS, [
                {
                    id: 'camp-1',
                    name: 'SUV Araçlarda Bahar Kampanyası',
                    type: 'PERCENTAGE',
                    value: 15,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                    isActive: true,
                    applicableServices: ['srv-1', 'srv-2'],
                    applicableVehicleTypes: ['SUV'],
                    minSpend: 0
                }
            ]);
        }

        const settings = db.get(DB_KEYS.SETTINGS, null);
        if (!settings) {
            db.set(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
        }

        const customers = db.get(DB_KEYS.CUSTOMERS, null);
        if (customers === null) {
            db.set(DB_KEYS.CUSTOMERS, [
                { id: 'cust-1', plate: '34ABC123', name: 'Ahmet Yılmaz', phone: '0532 111 22 33', vehicleType: 'SEDAN', createdAt: new Date(Date.now() - 10*24*60*60*1000).toISOString() },
                { id: 'cust-2', plate: '06XYZ99', name: 'Caner Özdemir', phone: '0544 555 44 33', vehicleType: 'SUV', createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
                { id: 'cust-3', plate: '35IZM35', name: 'Zeynep Aksoy', phone: '0555 333 22 11', vehicleType: 'MOTOSIKLET', createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString() }
            ]);

            db.set(DB_KEYS.TRANSACTIONS, [
                { id: 'tr-1', customerId: 'cust-1', serviceIds: ['srv-1'], totalPrice: 250.00, discountAmount: 0.00, campaignIds: [], date: new Date(Date.now() - 4*24*60*60*1000).toISOString(), status: 'COMPLETED', notes: 'Standart temiz yıkama', isLoyaltyReward: false },
                { id: 'tr-2', customerId: 'cust-2', serviceIds: ['srv-1', 'srv-4'], totalPrice: 637.50, discountAmount: 112.50, campaignIds: ['camp-1'], date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), status: 'COMPLETED', notes: 'Kampanya uygulandı', isLoyaltyReward: false }
            ]);

            db.set(DB_KEYS.APPOINTMENTS, [
                { id: 'ap-1', customerId: 'cust-3', serviceIds: ['srv-1'], datetime: new Date(Date.now() + 1*24*60*60*1000).toISOString(), status: 'BEKLEYOR', notes: 'Zamanında gelecek.' }
            ]);

            db.set(DB_KEYS.EXPENSES, [
                { id: 'exp-1', category: 'Kira', amount: 12000.00, description: 'Mayıs ayı dükkan kirası', date: new Date().toISOString() },
                { id: 'exp-2', category: 'Malzeme Alımı', amount: 1500.00, description: 'Yıkama şampuanları ve cilalar', date: new Date().toISOString() }
            ]);

            db.set(DB_KEYS.SALES, [
                { id: 'sale-1', productId: 'prod-1', customerId: 'cust-1', quantity: 1, unitPrice: 150.00, totalPrice: 150.00, date: new Date(Date.now() - 4*24*60*60*1000).toISOString() }
            ]);
        } else {
            if (db.get(DB_KEYS.TRANSACTIONS, null) === null) db.set(DB_KEYS.TRANSACTIONS, []);
            if (db.get(DB_KEYS.APPOINTMENTS, null) === null) db.set(DB_KEYS.APPOINTMENTS, []);
            if (db.get(DB_KEYS.EXPENSES, null) === null) db.set(DB_KEYS.EXPENSES, []);
            if (db.get(DB_KEYS.SALES, null) === null) db.set(DB_KEYS.SALES, []);
        }
    }
};
