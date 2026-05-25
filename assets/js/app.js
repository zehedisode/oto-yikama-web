(() => {
  // src/core/app-core.js
  var DEFAULT_SETTINGS = Object.freeze({
    loyalty_target_visits: 5,
    idle_lock_time: 60,
    pin_security_enabled: true
  });
  var VEHICLE_TYPES = Object.freeze([
    { id: "SEDAN", label: "Sedan" },
    { id: "SUV", label: "SUV" },
    { id: "MINIBUS", label: "Minibüs" },
    { id: "TICARI", label: "Ticari" },
    { id: "MOTOSIKLET", label: "Motosiklet" }
  ]);
  var PAYMENT_METHODS = Object.freeze([
    { id: "cash", label: "Nakit", icon: "💵" },
    { id: "card", label: "Kart", icon: "💳" },
    { id: "transfer", label: "Havale / EFT", icon: "🏦" },
    { id: "unpaid", label: "Açık Hesap", icon: "⏳" }
  ]);
  var getPaymentLabel = (id) => {
    var _a;
    return ((_a = PAYMENT_METHODS.find((p) => p.id === id)) == null ? void 0 : _a.label) || "Nakit";
  };
  var APPOINTMENT_STATUS = Object.freeze({
    PENDING: "BEKLEYOR",
    COMPLETED: "TAMAMLANDI",
    CANCELLED: "IPTAL"
  });
  var TRANSACTION_STATUS = Object.freeze({
    COMPLETED: "COMPLETED"
  });
  var createEmptyPinGate = () => ({
    isOpen: false,
    onSuccess: null,
    onFail: null,
    customText: ""
  });
  var normalizePlate = (value = "") => {
    return value.toString().toUpperCase().replace(/\s+/g, "").trim();
  };
  var validateTurkishPlate = (plate) => {
    const clean = normalizePlate(plate);
    if (!clean) return false;
    return /^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/.test(clean);
  };
  var formatCurrency = (value = 0) => {
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${numericValue.toLocaleString("tr-TR")} ₺`;
  };
  var parsePositiveNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  var parsePositiveInteger = (value, fallback = 0) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  var hasOwn = (object, key) => {
    return Object.prototype.hasOwnProperty.call(object, key);
  };
  var computeLoyaltyStats = (customerId, transactions, target = 5) => {
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
      (t) => t && t.customerId === customerId && t.status === "COMPLETED"
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

  // src/core/seed.js
  var DEFAULT_ADMIN_USER = () => [
    { id: "admin-1", name: "Yönetici", pinCode: "1234", createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ];
  var DEFAULT_SERVICES = () => [
    {
      id: "srv-1",
      name: "İç & Dış Yıkama Standart",
      prices: { SEDAN: 500, SUV: 600, MINIBUS: 700, TICARI: 640, MOTOSIKLET: 300 },
      duration: 45,
      isActive: true
    },
    {
      id: "srv-2",
      name: "Detaylı Koltuk Temizliği",
      prices: { SEDAN: 2400, SUV: 2800, MINIBUS: 3600, TICARI: 3e3, MOTOSIKLET: 1e3 },
      duration: 120,
      isActive: true
    },
    {
      id: "srv-3",
      name: "Pasta Cila & Boya Koruma",
      prices: { SEDAN: 2500, SUV: 3e3, MINIBUS: 3500, TICARI: 3e3, MOTOSIKLET: 1200 },
      duration: 180,
      isActive: true
    },
    {
      id: "srv-4",
      name: "Motor Koruma & Temizleme",
      prices: { SEDAN: 800, SUV: 900, MINIBUS: 1e3, TICARI: 1e3, MOTOSIKLET: 600 },
      duration: 35,
      isActive: true
    },
    {
      id: "srv-5",
      name: "Hızlı Dış Yıkama",
      prices: { SEDAN: 300, SUV: 350, MINIBUS: 400, TICARI: 380, MOTOSIKLET: 200 },
      duration: 20,
      isActive: true
    },
    {
      id: "srv-6",
      name: "Halı & Paspas Yıkama",
      prices: { SEDAN: 600, SUV: 700, MINIBUS: 900, TICARI: 800, MOTOSIKLET: 0 },
      duration: 60,
      isActive: true
    },
    {
      id: "srv-7",
      name: "Jant & Lastik Parlatma",
      prices: { SEDAN: 250, SUV: 300, MINIBUS: 350, TICARI: 320, MOTOSIKLET: 150 },
      duration: 25,
      isActive: true
    },
    {
      id: "srv-8",
      name: "Tavan & Döşeme Lekesi Sökme",
      prices: { SEDAN: 1500, SUV: 1800, MINIBUS: 2200, TICARI: 1900, MOTOSIKLET: 0 },
      duration: 90,
      isActive: true
    },
    {
      id: "srv-9",
      name: "Seramik Nano Kaplama (Premium)",
      prices: { SEDAN: 6500, SUV: 7500, MINIBUS: 9e3, TICARI: 8e3, MOTOSIKLET: 3500 },
      duration: 360,
      isActive: true
    }
  ];
  var DEFAULT_PRODUCTS = () => [
    { id: "prod-1", name: "Hızlı Cila Spreyi (300ml)", category: "Hızlı Satış", price: 150, cost: 70, stock: 25, unit: "Adet", isActive: true },
    { id: "prod-2", name: "Mikrofiber Kurulama Bezi", category: "Ekipman", price: 90, cost: 40, stock: 40, unit: "Adet", isActive: true },
    { id: "prod-3", name: "Oto Parfümü (Kavun)", category: "Kozmetik", price: 40, cost: 15, stock: 80, unit: "Adet", isActive: true }
  ];

  // src/core/db.js
  var DB_KEYS = {
    USERS: "otoyikama_users",
    CUSTOMERS: "otoyikama_customers",
    SERVICES: "otoyikama_services",
    TRANSACTIONS: "otoyikama_transactions",
    APPOINTMENTS: "otoyikama_appointments",
    EXPENSES: "otoyikama_expenses",
    PRODUCTS: "otoyikama_products",
    SALES: "otoyikama_sales",
    CAMPAIGNS: "otoyikama_campaigns",
    SETTINGS: "otoyikama_settings",
    SEED_VERSION: "otoyikama_seed_version"
  };
  var CURRENT_SEED_VERSION = 3;
  var APP_STORAGE_KEYS = Object.values(DB_KEYS);
  var generateUUID = () => {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
    } catch (e) {
    }
    return "uid_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
  };
  var asArray = (value) => Array.isArray(value) ? value : [];
  var createCleanDatabase = () => ({
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
  var normalizeBackupData = (parsedData) => ({
    users: asArray(parsedData.users).length > 0 ? asArray(parsedData.users) : DEFAULT_ADMIN_USER(),
    customers: asArray(parsedData.customers),
    services: asArray(parsedData.services).length > 0 ? asArray(parsedData.services) : DEFAULT_SERVICES(),
    transactions: asArray(parsedData.transactions),
    appointments: asArray(parsedData.appointments),
    expenses: asArray(parsedData.expenses),
    products: asArray(parsedData.products),
    sales: asArray(parsedData.sales),
    campaigns: asArray(parsedData.campaigns),
    settings: { ...DEFAULT_SETTINGS, ...parsedData.settings || {} }
  });
  var persistDatabaseObject = (data) => {
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
  var db = {
    get: (key, defaultValue = []) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
      } catch (e) {
        console.error("Veri okuma hatası:", key, e);
        return defaultValue;
      }
    },
    set: (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error("Veri yazma hatası:", key, e);
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
            id: "camp-1",
            name: "SUV Araçlarda Bahar Kampanyası",
            type: "PERCENTAGE",
            value: 15,
            startDate: (/* @__PURE__ */ new Date()).toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
            isActive: true,
            applicableServices: ["srv-1", "srv-2"],
            applicableVehicleTypes: ["SUV"],
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
          { id: "cust-1", plate: "34ABC123", name: "Ahmet Yılmaz", phone: "0532 111 22 33", vehicleType: "SEDAN", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString() },
          { id: "cust-2", plate: "06XYZ99", name: "Caner Özdemir", phone: "0544 555 44 33", vehicleType: "SUV", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString() },
          { id: "cust-3", plate: "35IZM35", name: "Zeynep Aksoy", phone: "0555 333 22 11", vehicleType: "MOTOSIKLET", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString() }
        ]);
        db.set(DB_KEYS.TRANSACTIONS, [
          { id: "tr-1", customerId: "cust-1", serviceIds: ["srv-1"], totalPrice: 250, discountAmount: 0, campaignIds: [], date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3).toISOString(), status: "COMPLETED", notes: "Standart temiz yıkama", isLoyaltyReward: false },
          { id: "tr-2", customerId: "cust-2", serviceIds: ["srv-1", "srv-4"], totalPrice: 637.5, discountAmount: 112.5, campaignIds: ["camp-1"], date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString(), status: "COMPLETED", notes: "Kampanya uygulandı", isLoyaltyReward: false }
        ]);
        db.set(DB_KEYS.APPOINTMENTS, [
          { id: "ap-1", customerId: "cust-3", serviceIds: ["srv-1"], datetime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1e3).toISOString(), status: "BEKLEYOR", notes: "Zamanında gelecek." }
        ]);
        db.set(DB_KEYS.EXPENSES, [
          { id: "exp-1", category: "Kira", amount: 12e3, description: "Mayıs ayı dükkan kirası", date: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "exp-2", category: "Malzeme Alımı", amount: 1500, description: "Yıkama şampuanları ve cilalar", date: (/* @__PURE__ */ new Date()).toISOString() }
        ]);
        db.set(DB_KEYS.SALES, [
          { id: "sale-1", productId: "prod-1", customerId: "cust-1", quantity: 1, unitPrice: 150, totalPrice: 150, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3).toISOString() }
        ]);
      } else {
        if (db.get(DB_KEYS.TRANSACTIONS, null) === null) db.set(DB_KEYS.TRANSACTIONS, []);
        if (db.get(DB_KEYS.APPOINTMENTS, null) === null) db.set(DB_KEYS.APPOINTMENTS, []);
        if (db.get(DB_KEYS.EXPENSES, null) === null) db.set(DB_KEYS.EXPENSES, []);
        if (db.get(DB_KEYS.SALES, null) === null) db.set(DB_KEYS.SALES, []);
      }
      const seedVersion = Number(db.get(DB_KEYS.SEED_VERSION, 1)) || 1;
      if (seedVersion < 2) {
        const currentServices = db.get(DB_KEYS.SERVICES, []);
        const patched = currentServices.map((srv) => {
          if (srv.id === "srv-1" && srv.prices && srv.prices.SEDAN === 250) {
            return {
              ...srv,
              prices: { SEDAN: 500, SUV: 600, MINIBUS: 700, TICARI: 640, MOTOSIKLET: 300 }
            };
          }
          if (srv.id === "srv-2" && srv.prices && srv.prices.SEDAN === 1200) {
            return {
              ...srv,
              prices: { SEDAN: 2400, SUV: 2800, MINIBUS: 3600, TICARI: 3e3, MOTOSIKLET: 1e3 }
            };
          }
          if (srv.id === "srv-3" && srv.prices && srv.prices.SEDAN === 2500) {
            return {
              ...srv,
              prices: { SEDAN: 5e3, SUV: 6e3, MINIBUS: 7e3, TICARI: 6e3, MOTOSIKLET: 2400 }
            };
          }
          if (srv.id === "srv-4" && srv.prices && srv.prices.SEDAN === 400) {
            return {
              ...srv,
              prices: { SEDAN: 800, SUV: 900, MINIBUS: 1e3, TICARI: 1e3, MOTOSIKLET: 600 }
            };
          }
          return srv;
        });
        db.set(DB_KEYS.SERVICES, patched);
      }
      if (seedVersion < 3) {
        const currentServices = db.get(DB_KEYS.SERVICES, []);
        const patched = currentServices.map((srv) => {
          if (srv.id === "srv-3" && srv.prices && srv.prices.SEDAN === 5e3) {
            return {
              ...srv,
              prices: { SEDAN: 2500, SUV: 3e3, MINIBUS: 3500, TICARI: 3e3, MOTOSIKLET: 1200 },
              duration: 180
            };
          }
          return srv;
        });
        const existingIds = new Set(patched.map((s) => s.id));
        const additions = DEFAULT_SERVICES().filter((s) => !existingIds.has(s.id));
        db.set(DB_KEYS.SERVICES, [...patched, ...additions]);
      }
      db.set(DB_KEYS.SEED_VERSION, CURRENT_SEED_VERSION);
    }
  };

  // src/core/icons.jsx
  var svg = (d, viewBox = "0 0 24 24") => /* @__PURE__ */ React.createElement("svg", { className: "w-5 h-5", fill: "none", viewBox, stroke: "currentColor" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d }));
  var Icons = {
    Dashboard: () => svg("M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"),
    Coins: () => svg("M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    Users: () => svg("M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"),
    Calendar: () => svg("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"),
    Clipboard: () => svg("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"),
    Package: () => svg("M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"),
    Percent: () => svg("M9 14l6-6m-5.5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"),
    Database: () => svg("M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4"),
    Lock: () => svg("M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"),
    Search: () => svg("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"),
    Plus: () => svg("M12 6v6m0 0v6m0-6h6m-6 0H6"),
    Trash: () => svg("M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"),
    Check: () => svg("M5 13l4 4L19 7"),
    X: () => svg("M6 18L18 6M6 6l12 12"),
    Gift: () => svg("M20 12V8H4v4m16 0v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8m16 0H4m12-4V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M9 12h6"),
    Eye: () => svg("M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"),
    EyeOff: () => svg("M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"),
    Car: () => svg("M7 17h10m-12 0h1m12 0h1M6.5 14h11M6 17v2m12-2v2M5 14l1.6-4.8A2 2 0 018.5 8h7a2 2 0 011.9 1.2L19 14M7.5 14.5h.01M16.5 14.5h.01"),
    Wallet: () => svg("M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v10a2 2 0 01-2 2H6.5A2.5 2.5 0 014 16.5v-9zM16 12h4m-3 0h.01M4 8h14"),
    AlertTriangle: () => svg("M10.3 4.3L2.8 17.1A2 2 0 004.5 20h15a2 2 0 001.7-2.9L13.7 4.3a2 2 0 00-3.4 0zM12 9v4m0 4h.01"),
    Menu: () => svg("M4 6h16M4 12h16M4 18h16"),
    Shield: () => svg("M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z"),
    TrendingUp: () => svg("M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"),
    Download: () => svg("M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3")
  };

  // src/core/security.js
  var LOCK_KEY = "otoyikama_pin_attempts";
  var PIN_ATTEMPT_LIMIT = 5;
  var BASE_COOLDOWN_MS = 30 * 1e3;
  var safeParse = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return null;
    }
  };
  var getPinLockState = () => {
    if (typeof localStorage === "undefined") {
      return { failedAttempts: 0, lockedUntil: 0 };
    }
    const parsed = safeParse(localStorage.getItem(LOCK_KEY));
    if (!parsed || typeof parsed !== "object") {
      return { failedAttempts: 0, lockedUntil: 0 };
    }
    return {
      failedAttempts: Number(parsed.failedAttempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0
    };
  };
  var persist = (state) => {
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(state));
    } catch (e) {
    }
  };
  var recordFailedPinAttempt = () => {
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
  var resetPinLockState = () => {
    persist({ failedAttempts: 0, lockedUntil: 0 });
  };
  var getCooldownRemainingMs = () => {
    const { lockedUntil } = getPinLockState();
    return Math.max(0, lockedUntil - Date.now());
  };
  var isPinLockedOut = () => getCooldownRemainingMs() > 0;

  // src/ui/AppLogo.jsx
  var AppLogo = ({ compact = false }) => /* @__PURE__ */ React.createElement("div", { className: `flex items-center ${compact ? "space-x-3" : "space-x-3 px-2 py-1"}` }, /* @__PURE__ */ React.createElement("div", { className: `${compact ? "w-8 h-8" : "w-10 h-10"} rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white` }, /* @__PURE__ */ React.createElement(Icons.Car, null)), /* @__PURE__ */ React.createElement("div", { className: "text-left min-w-0" }, /* @__PURE__ */ React.createElement("h1", { className: `${compact ? "text-sm" : "text-sm"} font-black text-white leading-none truncate` }, "Oto Yıkama Pro"), !compact && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-semibold uppercase" }, "Lokal Yönetim")));

  // src/ui/NavButton.jsx
  var NavButton = ({ item, activeTab, onSelect, mobile = false }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const label = mobile ? item.mobileLabel || item.label : item.label;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onSelect(item.id),
        className: `${mobile ? "w-full text-left py-2.5 px-3" : "w-full flex items-center space-x-3 px-3 py-2.5"} rounded-lg font-bold transition ${isActive ? "bg-brand-600 text-white shadow-md shadow-brand-500/10" : "text-gray-400 hover:bg-darkBg-hover hover:text-white"}`
      },
      mobile ? label : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, null), /* @__PURE__ */ React.createElement("span", null, label))
    );
  };

  // src/ui/LockScreen.jsx
  var { useState, useEffect } = React;
  var formatRemaining = (ms) => {
    const totalSeconds = Math.ceil(ms / 1e3);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
    return `${seconds} sn`;
  };
  var LockScreen = ({ users, handleUnlock, pinError, onPinReset }) => {
    const [pin, setPin] = useState("");
    const [cooldownMs, setCooldownMs] = useState(getCooldownRemainingMs());
    const [failedAttempts, setFailedAttempts] = useState(getPinLockState().failedAttempts);
    const [showRecovery, setShowRecovery] = useState(false);
    useEffect(() => {
      const tick = () => {
        const remaining = getCooldownRemainingMs();
        setCooldownMs(remaining);
        const state = getPinLockState();
        setFailedAttempts(state.failedAttempts);
      };
      tick();
      const interval = setInterval(tick, 1e3);
      return () => clearInterval(interval);
    }, [pinError]);
    useEffect(() => {
      if (cooldownMs <= 0) {
        return void 0;
      }
      setPin("");
      return void 0;
    }, [cooldownMs]);
    const isCoolingDown = cooldownMs > 0;
    const remainingInTier = PIN_ATTEMPT_LIMIT - failedAttempts % PIN_ATTEMPT_LIMIT;
    const showAttemptsHint = !isCoolingDown && failedAttempts > 0 && remainingInTier < PIN_ATTEMPT_LIMIT;
    useEffect(() => {
      const root2 = document.getElementById("root");
      if (!root2) return void 0;
      const previous = root2.getAttribute("aria-hidden");
      const previousInert = root2.getAttribute("inert");
      const handler = (event) => {
        if (event.key === "Tab") {
          const focusable = document.querySelectorAll(".lock-screen-focusable");
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", handler);
      return () => {
        document.removeEventListener("keydown", handler);
        if (previous === null) root2.removeAttribute("aria-hidden");
        else root2.setAttribute("aria-hidden", previous);
        if (previousInert === null) root2.removeAttribute("inert");
        else root2.setAttribute("inert", previousInert);
      };
    }, []);
    const handleKeypad = (num) => {
      if (isCoolingDown) return;
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => {
            handleUnlock(newPin);
            setPin("");
          }, 200);
        }
      }
    };
    const handleBackspace = () => {
      if (isCoolingDown) return;
      setPin(pin.slice(0, -1));
    };
    useEffect(() => {
      const onKeyDown = (event) => {
        if (showRecovery) return;
        if (isCoolingDown) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (/^[0-9]$/.test(event.key)) {
          event.preventDefault();
          handleKeypad(event.key);
          return;
        }
        if (event.key === "Backspace") {
          event.preventDefault();
          handleBackspace();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setPin("");
          return;
        }
        if (event.key === "Enter" && pin.length === 4) {
          event.preventDefault();
          handleUnlock(pin);
          setPin("");
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [pin, isCoolingDown, showRecovery, handleUnlock]);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "fixed inset-0 z-[60] flex flex-col items-center justify-center bg-darkBg-deep bg-opacity-95 backdrop-blur-md animate-fade-in",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Ekran Kilidi"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-md p-8 bg-darkBg-card rounded-2xl border border-darkBg-border shadow-2xl flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement(AppLogo, null)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mb-6" }, "Sisteme erişmek için 4 haneli PIN kodunuzu girin"), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-4 mb-6" }, [...Array(4)].map((_, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          className: `w-4 h-4 rounded-full border-2 transition-all duration-150 ${pin.length > i ? "bg-brand-500 border-brand-500 shadow-md shadow-brand-500/50 scale-110" : "border-gray-600"}`
        }
      ))), isCoolingDown && /* @__PURE__ */ React.createElement("div", { className: "mb-4 w-full bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm font-semibold" }, "Çok fazla hatalı deneme. Yeniden denemek için bekleyin: ", /* @__PURE__ */ React.createElement("span", { className: "font-extrabold" }, formatRemaining(cooldownMs))), !isCoolingDown && pinError && /* @__PURE__ */ React.createElement("p", { className: "text-red-400 text-sm font-semibold mb-2 animate-bounce" }, "Hatalı PIN! Tekrar Deneyin."), showAttemptsHint && /* @__PURE__ */ React.createElement("p", { className: "text-amber-400 text-[11px] font-semibold mb-3" }, "Kilitlenmeden önce kalan deneme: ", /* @__PURE__ */ React.createElement("span", { className: "font-extrabold" }, remainingInTier)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-4 w-full max-w-xs mb-6", "aria-disabled": isCoolingDown }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: num,
          type: "button",
          disabled: isCoolingDown,
          onClick: () => handleKeypad(num.toString()),
          className: `lock-screen-focusable h-14 rounded-xl bg-darkBg-deep border border-darkBg-border text-lg font-bold transition-all duration-150 ${isCoolingDown ? "opacity-40 cursor-not-allowed" : "hover:bg-brand-900/30 hover:border-brand-500 active:scale-95"}`
        },
        num
      )), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          disabled: isCoolingDown,
          onClick: () => setPin(""),
          className: `lock-screen-focusable h-14 rounded-xl text-gray-400 flex items-center justify-center text-sm font-semibold transition duration-150 ${isCoolingDown ? "opacity-40 cursor-not-allowed" : "hover:text-white"}`
        },
        "Temizle"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          disabled: isCoolingDown,
          onClick: () => handleKeypad("0"),
          className: `lock-screen-focusable h-14 rounded-xl bg-darkBg-deep border border-darkBg-border text-lg font-bold transition-all duration-150 ${isCoolingDown ? "opacity-40 cursor-not-allowed" : "hover:bg-brand-900/30 hover:border-brand-500 active:scale-95"}`
        },
        "0"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          disabled: isCoolingDown,
          onClick: handleBackspace,
          className: `lock-screen-focusable h-14 rounded-xl text-gray-400 flex items-center justify-center transition duration-150 ${isCoolingDown ? "opacity-40 cursor-not-allowed" : "hover:text-white"}`
        },
        "Sil"
      )), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-600" }, "PIN ayarları Sistem & Yedekleme bölümünden yönetilir."), onPinReset && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setShowRecovery(true),
          className: "lock-screen-focusable mt-4 text-[11px] text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline transition"
        },
        "PIN'imi Unuttum"
      )),
      showRecovery && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4",
          role: "dialog",
          "aria-modal": "true"
        },
        /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-amber-500/40 rounded-xl p-6 shadow-2xl space-y-4 text-left" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-extrabold text-white" }, "PIN Kodunu Sıfırla"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-300 leading-relaxed" }, "PIN kodunuz ", /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-amber-300" }, "1234"), " olarak sıfırlanacak. Müşteri, hizmet, gelir ve gider verileriniz silinmez. Giriş yaptıktan sonra", /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, " Sistem & Yedekleme "), "sekmesinden hemen yeni bir PIN belirlemenizi öneririm."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 pt-2" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setShowRecovery(false),
            className: "lock-screen-focusable flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-2.5 rounded transition"
          },
          "Vazgeç"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              onPinReset();
              setShowRecovery(false);
              setPin("");
            },
            className: "lock-screen-focusable flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded transition"
          },
          "Sıfırla (1234)"
        )))
      )
    );
  };

  // src/ui/PinGateModal.jsx
  var { useEffect: useEffect2, useState: useState2 } = React;
  var formatRemaining2 = (ms) => {
    const totalSeconds = Math.ceil(ms / 1e3);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
    return `${seconds} sn`;
  };
  var PinGateModal = ({ isOpen, customText, gatePin, setGatePin, onFail, onSubmit }) => {
    const [cooldownMs, setCooldownMs] = useState2(0);
    const [failedAttempts, setFailedAttempts] = useState2(0);
    useEffect2(() => {
      if (!isOpen) return void 0;
      const tick = () => {
        setCooldownMs(getCooldownRemainingMs());
        setFailedAttempts(getPinLockState().failedAttempts);
      };
      tick();
      const interval = setInterval(tick, 1e3);
      return () => clearInterval(interval);
    }, [isOpen, gatePin]);
    useEffect2(() => {
      if (!isOpen) return void 0;
      if (gatePin.length !== 4) return void 0;
      if (getCooldownRemainingMs() > 0) return void 0;
      const timer = setTimeout(() => onSubmit(), 150);
      return () => clearTimeout(timer);
    }, [gatePin, isOpen, onSubmit]);
    if (!isOpen) return null;
    const isCoolingDown = cooldownMs > 0;
    const remainingInTier = PIN_ATTEMPT_LIMIT - failedAttempts % PIN_ATTEMPT_LIMIT;
    const showAttemptsHint = !isCoolingDown && failedAttempts > 0 && remainingInTier < PIN_ATTEMPT_LIMIT;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Güvenlik Onayı"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm p-6 bg-darkBg-card rounded-xl border border-darkBg-border shadow-2xl" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-white mb-2 flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(Icons.Shield, null), /* @__PURE__ */ React.createElement("span", null, "Güvenlik Onayı")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mb-4 text-left" }, customText || "Bu işleme devam etmek için Yönetici PIN kodunu giriniz."), isCoolingDown && /* @__PURE__ */ React.createElement("div", { className: "mb-3 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs font-semibold" }, "Çok fazla hatalı deneme. Bekleyin: ", /* @__PURE__ */ React.createElement("span", { className: "font-extrabold" }, formatRemaining2(cooldownMs))), showAttemptsHint && /* @__PURE__ */ React.createElement("p", { className: "text-amber-400 text-[11px] font-semibold mb-2" }, "Kilitlenmeden önce kalan deneme: ", /* @__PURE__ */ React.createElement("span", { className: "font-extrabold" }, remainingInTier)), /* @__PURE__ */ React.createElement("form", { onSubmit: (e) => {
        e.preventDefault();
        if (!isCoolingDown) onSubmit();
      }, className: "space-y-4" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          maxLength: 4,
          autoFocus: true,
          disabled: isCoolingDown,
          placeholder: "••••",
          value: gatePin,
          onChange: (e) => setGatePin(e.target.value.replace(/\D/g, "")),
          className: `w-full text-center text-2xl tracking-widest bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-brand-400 font-bold focus:outline-none focus:border-brand-500 ${isCoolingDown ? "opacity-50 cursor-not-allowed" : ""}`
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onFail,
          className: "flex-1 bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg font-semibold transition"
        },
        "İptal"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          disabled: isCoolingDown || gatePin.length !== 4,
          className: `flex-1 text-sm py-2 rounded-lg font-semibold transition ${isCoolingDown || gatePin.length !== 4 ? "bg-brand-900/40 text-brand-300/50 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-500"}`
        },
        "Onayla"
      ))))
    );
  };

  // src/ui/NotificationBadge.jsx
  var NotificationBadge = ({ notification }) => {
    if (!notification) return null;
    const { message, type } = notification;
    return /* @__PURE__ */ React.createElement("div", { className: `fixed top-4 right-4 z-50 flex items-center space-x-2 px-5 py-3 rounded-xl border shadow-2xl transition duration-150 transform translate-y-0 scale-100 animate-fade-in ${type === "error" ? "bg-red-950/90 border-red-500/30 text-red-400" : type === "warning" ? "bg-amber-950/90 border-amber-500/30 text-amber-400" : "bg-emerald-950/90 border-emerald-500/30 text-emerald-400"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold" }, message));
  };

  // src/ui/PageHeader.jsx
  var PageHeader = ({ title, description, actions }) => /* @__PURE__ */ React.createElement("div", { className: "app-page-header border-b border-darkBg-border pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-extrabold text-white" }, title), description && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, description)), actions && /* @__PURE__ */ React.createElement("div", { className: "app-page-actions flex flex-wrap gap-3" }, actions));

  // src/ui/FinanceChart.jsx
  var CustomFinanceChart = ({ washIncome, productIncome, totalExpenses }) => {
    const maxVal = Math.max(washIncome + productIncome, totalExpenses, 1e3) * 1.15;
    const totalIncome = washIncome + productIncome;
    const incHeight = totalIncome / maxVal * 120;
    const expHeight = totalExpenses / maxVal * 120;
    const washBarHeight = washIncome / maxVal * 120;
    const prodBarHeight = productIncome / maxVal * 120;
    return /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4 text-left" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-gray-200" }, "Kasa Genel Analizi (Cari Dönem)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, "Hizmet, Ürün Satışı ve Gider dağılımı"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-end justify-around h-48 border-b border-darkBg-border pb-2 pt-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center w-1/4 group" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative", style: { height: `${Math.max(washBarHeight, 5)}px` } }, /* @__PURE__ */ React.createElement("div", { className: "absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-emerald-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap" }, formatCurrency(washIncome))), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 mt-2 text-center truncate w-full" }, "Hizmet Gelir")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center w-1/4 group" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative", style: { height: `${Math.max(prodBarHeight, 5)}px` } }, /* @__PURE__ */ React.createElement("div", { className: "absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-teal-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap" }, formatCurrency(productIncome))), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 mt-2 text-center truncate w-full" }, "Ürün Satış")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center w-1/4 group" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative", style: { height: `${Math.max(incHeight, 5)}px` } }, /* @__PURE__ */ React.createElement("div", { className: "absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-brand-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap" }, formatCurrency(totalIncome))), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-300 mt-2 font-semibold text-center truncate w-full" }, "Toplam Ciro")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center w-1/4 group" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 bg-gradient-to-t from-red-600 to-red-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative", style: { height: `${Math.max(expHeight, 5)}px` } }, /* @__PURE__ */ React.createElement("div", { className: "absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-red-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap" }, formatCurrency(totalExpenses))), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 mt-2 text-center truncate w-full" }, "Toplam Gider"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mt-4 text-xs text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 bg-emerald-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Yıkama Hizmeti: ", formatCurrency(washIncome))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 bg-teal-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Aksesuar & Ürün: ", formatCurrency(productIncome))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 bg-brand-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-bold" }, "Toplam Brüt Gelir: ", formatCurrency(totalIncome))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 bg-red-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Tüm Giderler: ", formatCurrency(totalExpenses)))));
  };

  // src/tabs/DashboardTab.jsx
  var { useMemo, useState: useState3 } = React;
  var DashboardTab = ({
    transactions,
    expenses,
    appointments,
    customers,
    sales,
    setActiveTab,
    setQuickPlateContext,
    isSensitiveHidden,
    setIsSensitiveHidden,
    requestPinApproval,
    settings
  }) => {
    const loyaltyTarget = (settings == null ? void 0 : settings.loyalty_target_visits) || 5;
    const [quickPlate, setQuickPlate] = useState3("");
    const completedWashRevenues = useMemo(() => {
      return transactions.filter((t) => t.status === "COMPLETED").reduce((sum, t) => sum + t.totalPrice, 0);
    }, [transactions]);
    const productRevenues = useMemo(() => {
      return sales.reduce((sum, s) => sum + s.totalPrice, 0);
    }, [sales]);
    const totalGrossRevenue = completedWashRevenues + productRevenues;
    const totalExpenses = useMemo(() => {
      return expenses.reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);
    const netProfit = totalGrossRevenue - totalExpenses;
    const activeAppointments = useMemo(() => {
      return appointments.filter((a) => a.status === "BEKLEYOR").length;
    }, [appointments]);
    const recentWashes = useMemo(() => {
      return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    }, [transactions]);
    const vehicleStats = useMemo(() => {
      const stats = VEHICLE_TYPES.reduce((acc, type) => {
        acc[type.id] = 0;
        return acc;
      }, {});
      customers.forEach((c) => {
        if (stats[c.vehicleType] !== void 0) {
          stats[c.vehicleType]++;
        }
      });
      return stats;
    }, [customers]);
    const loyaltyReadyCustomers = useMemo(() => {
      return customers.map((c) => ({ customer: c, stats: computeLoyaltyStats(c.id, transactions, loyaltyTarget) })).filter((item) => item.stats.ready).sort((a, b) => b.stats.availableRewards - a.stats.availableRewards);
    }, [customers, transactions, loyaltyTarget]);
    const handleQuickSaleRedirect = (plateNum) => {
      setQuickPlateContext(plateNum);
      setActiveTab("sales");
    };
    const toggleSensitiveData = () => {
      if (isSensitiveHidden) {
        requestPinApproval("Finansal verileri görmek için PIN kodunuzu doğrulayın.", () => {
          setIsSensitiveHidden(false);
        });
      } else {
        setIsSensitiveHidden(true);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Kontrol Paneli",
        description: "Yerel kayıtlar, randevu kuyruğu, gelir-gider özeti ve hızlı işlem akışları.",
        actions: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => handleQuickSaleRedirect(""),
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition shadow-md shadow-brand-500/10 active:scale-95"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Yeni Hizmet Girişi")
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: toggleSensitiveData,
            className: "px-4 py-2 bg-darkBg-card hover:bg-darkBg-hover border border-darkBg-border rounded-lg text-sm font-semibold text-gray-300 flex items-center space-x-2 transition"
          },
          isSensitiveHidden ? /* @__PURE__ */ React.createElement(Icons.Eye, null) : /* @__PURE__ */ React.createElement(Icons.EyeOff, null),
          /* @__PURE__ */ React.createElement("span", null, isSensitiveHidden ? "Tüm Kilitleri Aç" : "Kasa Detaylarını Gizle")
        ))
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 font-semibold block" }, "Toplam Brüt Ciro"), /* @__PURE__ */ React.createElement("span", { className: `text-2xl font-extrabold tracking-tight transition duration-200 ${isSensitiveHidden ? "blur-md select-none" : "text-emerald-400"}` }, formatCurrency(totalGrossRevenue))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-emerald-500/10 text-emerald-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Coins, null))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 font-semibold block" }, "Net Kâr / Zarar"), /* @__PURE__ */ React.createElement("span", { className: `text-2xl font-extrabold tracking-tight transition duration-200 ${isSensitiveHidden ? "blur-md select-none" : netProfit >= 0 ? "text-brand-400" : "text-red-400"}` }, formatCurrency(netProfit))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-brand-500/10 text-brand-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Car, null))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 font-semibold block" }, "Kayıtlı Giderler"), /* @__PURE__ */ React.createElement("span", { className: `text-2xl font-extrabold tracking-tight transition duration-200 ${isSensitiveHidden ? "blur-md select-none" : "text-red-400"}` }, formatCurrency(totalExpenses))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-500/10 text-red-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Wallet, null))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex items-center justify-between shadow cursor-pointer", onClick: () => setActiveTab("appointments") }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 font-semibold block" }, "Bekleyen Randevular"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold tracking-tight text-amber-400" }, activeAppointments, " Adet")), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-amber-500/10 text-amber-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Calendar, null)))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2" }, /* @__PURE__ */ React.createElement(
      CustomFinanceChart,
      {
        washIncome: completedWashRevenues,
        productIncome: productRevenues,
        totalExpenses
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow flex flex-col justify-between text-left" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-gray-200 mb-1" }, "Müşteri Araç Dağılımı"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mb-4" }, "Sistemde kayıtlı toplam ", customers.length, " müşterinin araç tipleri")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, VEHICLE_TYPES.map(({ id, label }) => {
      const count = vehicleStats[id] || 0;
      const percent = customers.length > 0 ? count / customers.length * 100 : 0;
      return /* @__PURE__ */ React.createElement("div", { key: id, className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs font-semibold" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, label), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, count, " Araç (", percent.toFixed(0), "%)")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-darkBg-deep rounded-full h-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-brand-500 h-2 rounded-full transition-all duration-300", style: { width: `${percent}%` } })));
    })))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-emerald-500/30 rounded-xl p-5 shadow text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-darkBg-border pb-3 mb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400" }, /* @__PURE__ */ React.createElement(Icons.Gift, null)), "Bedava Yıkama Hak Eden Müşteriler"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "Her ", loyaltyTarget, " ücretli yıkama sonrası 1 bedava yıkama. Listeyi arayıp müşteriyi bilgilendirebilirsiniz.")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-extrabold whitespace-nowrap" }, loyaltyReadyCustomers.length, " müşteri")), loyaltyReadyCustomers.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 py-6 text-center" }, "Şu an bedava yıkama hak eden müşteri bulunmuyor. Müşteriler ", loyaltyTarget, " ücretli yıkamayı tamamladığında burada listelenir.") : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1" }, loyaltyReadyCustomers.map(({ customer, stats }) => /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        key: customer.id,
        onClick: () => handleQuickSaleRedirect(customer.plate),
        className: "text-left bg-darkBg-deep border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/20 rounded-lg p-3 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
        title: "Hizmet girişine git"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded uppercase tracking-wider" }, customer.plate), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full" }, stats.availableRewards, "× bedava")),
      /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-white mt-2 truncate" }, customer.name),
      /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-400 truncate" }, customer.phone),
      /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-emerald-400 font-semibold mt-2" }, stats.paidVisits, " ücretli yıkama tamamlandı")
    )))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white mb-2" }, "Hızlı Plaka Sorgulama"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mb-4" }, "Müşteri kaydını ve sadakat puanını kontrol etmek için plaka yazın.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        placeholder: "Örn: 34ABC123",
        maxLength: 12,
        value: quickPlate,
        onChange: (e) => setQuickPlate(normalizePlate(e.target.value)),
        onKeyDown: (e) => {
          if (e.key === "Enter" && quickPlate) {
            handleQuickSaleRedirect(quickPlate);
          }
        },
        className: "w-full bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-center uppercase tracking-wider font-bold text-lg focus:outline-none focus:border-brand-500 text-white"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const val = normalizePlate(quickPlate);
          if (val) {
            handleQuickSaleRedirect(val);
          }
        },
        className: "w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-lg text-sm transition"
      },
      "Sorgula & İşlem Başlat"
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white mb-3" }, "Son Yapılan Hizmet Girişleri"), recentWashes.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 py-6 text-center" }, "Henüz yapılmış bir yıkama kaydı bulunmuyor.") : /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-darkBg-border" }, recentWashes.map((tr) => {
      const cust = customers.find((c) => c.id === tr.customerId);
      return /* @__PURE__ */ React.createElement("div", { key: tr.id, className: "py-3 flex justify-between items-center text-xs" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md mr-2" }, (cust == null ? void 0 : cust.plate) || "BELİRSİZ"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-medium" }, (cust == null ? void 0 : cust.name) || "Misafir"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 block text-[10px]" }, new Date(tr.date).toLocaleString("tr-TR"))), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("span", { className: `font-bold block ${isSensitiveHidden ? "blur-sm select-none" : "text-emerald-400"}` }, formatCurrency(tr.totalPrice)), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, tr.isLoyaltyReward ? "Ödül Temizliği" : "Standart Ödeme")));
    })))));
  };

  // src/ui/ReceiptPrint.jsx
  var formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  };
  var buildShareText = (data) => {
    var _a, _b;
    const lines = [];
    lines.push(`OTO YIKAMA PRO`);
    lines.push(`Tarih: ${formatDate(data.date)}`);
    if ((_a = data.customer) == null ? void 0 : _a.plate) lines.push(`Plaka: ${data.customer.plate}`);
    if ((_b = data.customer) == null ? void 0 : _b.name) lines.push(`Müşteri: ${data.customer.name}`);
    lines.push("");
    data.lines.forEach((l) => {
      lines.push(`${l.label} - ${formatCurrency(l.amount)}`);
    });
    lines.push("");
    if (data.discount > 0) lines.push(`İndirim: -${formatCurrency(data.discount)}`);
    lines.push(`Toplam: ${formatCurrency(data.total)}`);
    lines.push(`Ödeme: ${getPaymentLabel(data.paymentMethod)}`);
    if (data.note) {
      lines.push("");
      lines.push(`Not: ${data.note}`);
    }
    return lines.join("\n");
  };
  var ReceiptPrint = ({ isOpen, data, onClose }) => {
    var _a, _b;
    if (!isOpen || !data) return null;
    const shareText = buildShareText(data);
    const handlePrint = () => window.print();
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Fiş metni panoya kopyalandı.");
      } catch (e) {
        alert("Kopyalama desteklenmiyor.");
      }
    };
    const handleWhatsApp = () => {
      var _a2;
      const phone = (((_a2 = data.customer) == null ? void 0 : _a2.phone) || "").replace(/\D/g, "");
      const url = phone ? `https://wa.me/${phone.startsWith("90") ? phone : "90" + phone}?text=${encodeURIComponent(shareText)}` : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(url, "_blank", "noopener");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 print:bg-white print:p-0 print:items-start" }, /* @__PURE__ */ React.createElement("div", { className: "receipt-modal w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-2xl shadow-2xl print:bg-white print:border-0 print:shadow-none print:rounded-none print:max-w-full" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-darkBg-border flex items-center justify-between gap-2 print:hidden" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white" }, "Satış Fişi"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onClose, className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), /* @__PURE__ */ React.createElement("div", { className: "p-5 print:p-3 print:text-black bg-white text-gray-900 receipt-body" }, /* @__PURE__ */ React.createElement("div", { className: "text-center space-y-1 border-b border-dashed border-gray-300 pb-3" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-extrabold tracking-wide" }, "OTO YIKAMA PRO"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-500" }, formatDate(data.date))), (((_a = data.customer) == null ? void 0 : _a.plate) || ((_b = data.customer) == null ? void 0 : _b.name)) && /* @__PURE__ */ React.createElement("div", { className: "py-3 text-[12px] space-y-0.5 border-b border-dashed border-gray-300" }, data.customer.plate && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "Plaka"), /* @__PURE__ */ React.createElement("span", { className: "font-bold uppercase" }, data.customer.plate)), data.customer.name && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "Müşteri"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, data.customer.name)), data.customer.vehicleType && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "Araç"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, data.customer.vehicleType))), /* @__PURE__ */ React.createElement("div", { className: "py-3 space-y-1 text-[12px] border-b border-dashed border-gray-300" }, data.lines.map((line, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "truncate pr-2" }, line.label), /* @__PURE__ */ React.createElement("span", { className: "font-bold whitespace-nowrap" }, formatCurrency(line.amount))))), /* @__PURE__ */ React.createElement("div", { className: "pt-3 space-y-1 text-[12px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-gray-600" }, /* @__PURE__ */ React.createElement("span", null, "Ara Toplam"), /* @__PURE__ */ React.createElement("span", null, formatCurrency(data.subTotal))), data.discount > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-emerald-700" }, /* @__PURE__ */ React.createElement("span", null, "İndirim"), /* @__PURE__ */ React.createElement("span", null, "- ", formatCurrency(data.discount))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-base font-extrabold pt-1 border-t border-gray-300 mt-1" }, /* @__PURE__ */ React.createElement("span", null, "TOPLAM"), /* @__PURE__ */ React.createElement("span", null, formatCurrency(data.total))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-[11px] text-gray-600 pt-1" }, /* @__PURE__ */ React.createElement("span", null, "Ödeme"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, getPaymentLabel(data.paymentMethod)))), data.note && /* @__PURE__ */ React.createElement("div", { className: "pt-3 mt-3 border-t border-dashed border-gray-300 text-[11px] text-gray-700" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Not: "), data.note), /* @__PURE__ */ React.createElement("p", { className: "text-center text-[10px] text-gray-400 mt-4 italic" }, "Bizi tercih ettiğiniz için teşekkürler.")), /* @__PURE__ */ React.createElement("div", { className: "p-3 border-t border-darkBg-border grid grid-cols-3 gap-2 print:hidden" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handlePrint,
        className: "bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-xs transition"
      },
      "Yazdır"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleWhatsApp,
        className: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition"
      },
      "WhatsApp"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleCopy,
        className: "bg-darkBg-deep hover:bg-darkBg-hover text-gray-200 font-bold py-2 rounded-lg text-xs transition"
      },
      "Kopyala"
    ))));
  };

  // src/tabs/SalesTab.jsx
  var { useState: useState4, useEffect: useEffect3, useMemo: useMemo2 } = React;
  var initials = (name) => {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toLocaleUpperCase("tr-TR");
  };
  var SalesTab = ({
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
    const [plate, setPlate] = useState4(quickPlateContext || "");
    const [matchedCustomer, setMatchedCustomer] = useState4(null);
    const [isNewCustomerMode, setIsNewCustomerMode] = useState4(false);
    const [custName, setCustName] = useState4("");
    const [custPhone, setCustPhone] = useState4("");
    const [vehicleType, setVehicleType] = useState4("SEDAN");
    const [selectedServiceIds, setSelectedServiceIds] = useState4([]);
    const [notes, setNotes] = useState4("");
    const [isRewardRedeemed, setIsRewardRedeemed] = useState4(false);
    const [serviceSearch, setServiceSearch] = useState4("");
    const [showCartMobile, setShowCartMobile] = useState4(false);
    const [paymentMethod, setPaymentMethod] = useState4("cash");
    const [receipt, setReceipt] = useState4(null);
    useEffect3(() => {
      const cleanPlate = normalizePlate(plate);
      if (cleanPlate.length >= 4) {
        const match = customers.find((c) => normalizePlate(c.plate) === cleanPlate);
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
    useEffect3(() => {
      if (quickPlateContext) setPlate(quickPlateContext);
    }, [quickPlateContext]);
    useEffect3(() => {
      if (pendingFromAppointment) {
        if (Array.isArray(pendingFromAppointment.serviceIds) && pendingFromAppointment.serviceIds.length > 0) {
          setSelectedServiceIds(pendingFromAppointment.serviceIds);
        }
        if (pendingFromAppointment.notes) setNotes(pendingFromAppointment.notes);
      }
    }, [pendingFromAppointment]);
    const loyaltyStats = useMemo2(() => {
      if (!matchedCustomer) {
        return { paidVisits: 0, availableRewards: 0, nextRewardIn: 0, target: settings.loyalty_target_visits || 5, progress: 0, ready: false };
      }
      return computeLoyaltyStats(matchedCustomer.id, transactions, settings.loyalty_target_visits);
    }, [matchedCustomer, transactions, settings.loyalty_target_visits]);
    const currentVehicleType = matchedCustomer ? matchedCustomer.vehicleType : vehicleType;
    const visibleServices = useMemo2(() => {
      const term = serviceSearch.trim().toLocaleLowerCase("tr-TR");
      return services.filter((s) => s.isActive).filter((s) => !term || s.name.toLocaleLowerCase("tr-TR").includes(term));
    }, [services, serviceSearch]);
    const selectedServices = useMemo2(() => {
      return selectedServiceIds.map((id) => services.find((s) => s.id === id)).filter(Boolean);
    }, [selectedServiceIds, services]);
    const originalPrice = useMemo2(() => {
      return selectedServices.reduce((sum, s) => {
        var _a;
        return sum + (((_a = s.prices) == null ? void 0 : _a[currentVehicleType]) || 0);
      }, 0);
    }, [selectedServices, currentVehicleType]);
    const totalDuration = useMemo2(() => {
      return selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
    }, [selectedServices]);
    const campaignDetails = useMemo2(() => {
      let totalDiscount = 0;
      const appliedCampaigns = [];
      const now = Date.now();
      campaigns.forEach((camp) => {
        var _a, _b;
        if (!camp.isActive) return;
        if (camp.startDate && new Date(camp.startDate).getTime() > now) return;
        if (camp.endDate && new Date(camp.endDate).getTime() < now) return;
        if (((_a = camp.applicableVehicleTypes) == null ? void 0 : _a.length) > 0 && !camp.applicableVehicleTypes.includes(currentVehicleType)) return;
        if (camp.minSpend > 0 && originalPrice < camp.minSpend) return;
        const containsService = selectedServiceIds.some((sId) => (camp.applicableServices || []).includes(sId));
        if (selectedServiceIds.length > 0 && ((_b = camp.applicableServices) == null ? void 0 : _b.length) > 0 && !containsService) return;
        if (camp.type === "PERCENTAGE") {
          totalDiscount += originalPrice * camp.value / 100;
        } else if (camp.type === "FIXED") {
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
      setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };
    const resetForm = () => {
      setPlate("");
      setSelectedServiceIds([]);
      setNotes("");
      setIsRewardRedeemed(false);
      setCustName("");
      setCustPhone("");
      setQuickPlateContext("");
      setServiceSearch("");
      setShowCartMobile(false);
      setPaymentMethod("cash");
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
      let customerId = "";
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
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        setCustomers((prev) => [...prev, newCust]);
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
        campaignIds: isRewardRedeemed ? [] : campaignDetails.appliedCampaigns.map((c) => c.id),
        paymentMethod: isRewardRedeemed ? "reward" : paymentMethod,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        status: "COMPLETED",
        notes: notes + (isRewardRedeemed ? " [SADAKAT ÖDÜL KULLANIMI]" : ""),
        isLoyaltyReward: isRewardRedeemed
      };
      setTransactions((prev) => [...prev, newTransaction]);
      showNotification("Satış işlemi başarıyla tamamlandı!");
      setReceipt({
        date: newTransaction.date,
        customer: snapshot,
        lines: selectedServices.map((s) => {
          var _a;
          return {
            label: s.name,
            amount: ((_a = s.prices) == null ? void 0 : _a[currentVehicleType]) || 0
          };
        }),
        subTotal: originalPrice,
        discount: isRewardRedeemed ? originalPrice : campaignDetails.discountAmount,
        total: finalPrice,
        paymentMethod: isRewardRedeemed ? "reward" : paymentMethod,
        note: notes
      });
      if ((pendingFromAppointment == null ? void 0 : pendingFromAppointment.appointmentId) && typeof setAppointments === "function") {
        setAppointments((prev) => prev.map(
          (a) => a.id === pendingFromAppointment.appointmentId ? { ...a, status: "TAMAMLANDI" } : a
        ));
      }
      if (typeof setPendingFromAppointment === "function") {
        setPendingFromAppointment(null);
      }
      resetForm();
    };
    const canCheckout = plate && selectedServiceIds.length > 0 && (matchedCustomer || isNewCustomerMode && custName && custPhone);
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left pb-32 lg:pb-0" }, /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Hızlı Satış / Kasa",
        description: "Plakayı girin, hizmetleri seçin, tek tuşla tahsilatı tamamlayın."
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-darkBg-card to-darkBg-deep border border-darkBg-border rounded-2xl p-5 shadow-lg" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2" }, "Araç Plakası"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" }, /* @__PURE__ */ React.createElement(Icons.Car, null)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        autoFocus: true,
        value: plate,
        onChange: (e) => setPlate(normalizePlate(e.target.value)),
        placeholder: "34ABC123",
        maxLength: 10,
        className: "w-full bg-darkBg-deep border-2 border-darkBg-border focus:border-brand-500 pl-14 pr-4 py-4 rounded-xl text-center uppercase tracking-[0.3em] font-extrabold text-3xl text-white outline-none transition"
      }
    ), plate && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setPlate(""),
        className: "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-darkBg-card hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition",
        "aria-label": "Plakayı temizle"
      },
      /* @__PURE__ */ React.createElement(Icons.X, null)
    ))), matchedCustomer && /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-emerald-500/30 rounded-2xl p-5 shadow-lg animate-fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-extrabold text-lg shrink-0" }, initials(matchedCustomer.name)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-emerald-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icons.Check, null), " Kayıtlı Müşteri"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/15 text-brand-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider" }, matchedCustomer.vehicleType)), /* @__PURE__ */ React.createElement("p", { className: "text-base font-bold text-white truncate mt-0.5" }, matchedCustomer.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, matchedCustomer.phone))), /* @__PURE__ */ React.createElement("div", { className: "mt-4 pt-3 border-t border-darkBg-border" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-2 text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 font-semibold" }, "Sadakat İlerlemesi"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, loyaltyStats.paidVisits, " / ", loyaltyStats.target)), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-darkBg-deep rounded-full h-2 overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-full rounded-full transition-all duration-500 ${loyaltyStats.ready ? "bg-emerald-500" : "bg-brand-500"}`,
        style: { width: `${loyaltyStats.ready ? 100 : loyaltyStats.progress / loyaltyStats.target * 100}%` }
      }
    )), loyaltyStats.ready ? /* @__PURE__ */ React.createElement("label", { className: "mt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 cursor-pointer hover:bg-emerald-500/15 transition" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-emerald-300" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold block" }, loyaltyStats.availableRewards, " adet bedava yıkama hakkı"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-emerald-400/80" }, "Bu satışta kullan (tutar 0 ₺ olur)"))), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: isRewardRedeemed,
        onChange: (e) => setIsRewardRedeemed(e.target.checked),
        className: "w-5 h-5 rounded text-emerald-600 bg-darkBg-deep border-emerald-700 focus:ring-emerald-500"
      }
    )) : /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500 mt-2" }, "Hediyeye ", /* @__PURE__ */ React.createElement("span", { className: "text-brand-400 font-extrabold" }, loyaltyStats.nextRewardIn), " ücretli yıkama kaldı."))), isNewCustomerMode && /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-amber-500/30 rounded-2xl p-5 shadow-lg animate-fade-in space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-amber-400 text-xs font-bold" }, /* @__PURE__ */ React.createElement(Icons.AlertTriangle, null), /* @__PURE__ */ React.createElement("span", null, "Yeni müşteri kaydı oluşturulacak")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: custName,
        onChange: (e) => setCustName(e.target.value),
        placeholder: "Müşteri Ad Soyad *",
        className: "bg-darkBg-deep border border-darkBg-border focus:border-amber-500 px-3 py-2.5 rounded-lg text-sm text-white outline-none transition"
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: custPhone,
        onChange: (e) => setCustPhone(e.target.value),
        placeholder: "Telefon *",
        className: "bg-darkBg-deep border border-darkBg-border focus:border-amber-500 px-3 py-2.5 rounded-lg text-sm text-white outline-none transition"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2" }, "Araç Tipi"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, VEHICLE_TYPES.map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t.id,
        type: "button",
        onClick: () => setVehicleType(t.id),
        className: `px-3 py-1.5 rounded-lg text-xs font-bold border transition ${vehicleType === t.id ? "bg-amber-600 border-amber-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-amber-500/60"}`
      },
      t.label
    ))))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-2xl p-5 shadow-lg space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white" }, "Hizmet Seçimi"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-500" }, "Fiyatlar ", /* @__PURE__ */ React.createElement("span", { className: "text-brand-300 font-bold" }, currentVehicleType), " sınıfına göre.")), /* @__PURE__ */ React.createElement("div", { className: "relative w-full sm:w-64" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" }, /* @__PURE__ */ React.createElement(Icons.Search, null)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: serviceSearch,
        onChange: (e) => setServiceSearch(e.target.value),
        placeholder: "Hizmet ara...",
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 pl-9 pr-3 py-2 rounded-lg text-xs text-white outline-none transition"
      }
    ))), visibleServices.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-10" }, serviceSearch ? "Aramayla eşleşen hizmet yok." : "Aktif hizmet yok. Hizmet Kataloğu sekmesinden ekleyin.") : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" }, visibleServices.map((srv) => {
      var _a;
      const price = ((_a = srv.prices) == null ? void 0 : _a[currentVehicleType]) || 0;
      const isChecked = selectedServiceIds.includes(srv.id);
      const unavailable = price === 0;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: srv.id,
          type: "button",
          disabled: unavailable,
          onClick: () => !unavailable && toggleService(srv.id),
          "aria-pressed": isChecked,
          className: `relative text-left p-4 rounded-xl border-2 transition-all duration-150 group ${unavailable ? "bg-darkBg-deep/50 border-darkBg-border/50 opacity-40 cursor-not-allowed" : isChecked ? "bg-brand-600/15 border-brand-500 shadow-lg shadow-brand-500/10" : "bg-darkBg-deep border-darkBg-border hover:border-brand-500/60 hover:bg-darkBg-hover active:scale-[0.98]"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: `absolute top-3 right-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${isChecked ? "bg-brand-500 border-brand-500 text-white" : "border-gray-700 text-transparent group-hover:border-brand-500/50"}` }, /* @__PURE__ */ React.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }))),
        /* @__PURE__ */ React.createElement("div", { className: "pr-8 space-y-3" }, /* @__PURE__ */ React.createElement("p", { className: `text-sm font-bold leading-snug ${isChecked ? "text-white" : "text-gray-200"}` }, srv.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-[10px] text-gray-400 bg-darkBg-card px-2 py-1 rounded-full" }, /* @__PURE__ */ React.createElement("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" })), srv.duration, " dk"), /* @__PURE__ */ React.createElement("span", { className: `font-extrabold text-base ${unavailable ? "text-gray-600" : isChecked ? "text-emerald-300" : "text-white"}` }, unavailable ? "Uygulanmaz" : formatCurrency(price))))
      );
    }))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-2xl p-5 shadow-lg" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2" }, "İş Emri / Not"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        placeholder: "Aracın çizikleri, jant talebi, müşteri talebi...",
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 px-3 py-2.5 rounded-lg text-xs text-white outline-none transition resize-none"
      }
    ))), /* @__PURE__ */ React.createElement("aside", { className: "hidden lg:block" }, /* @__PURE__ */ React.createElement("div", { className: "sticky top-4 space-y-4" }, /* @__PURE__ */ React.createElement(
      CartPanel,
      {
        selectedServices,
        currentVehicleType,
        originalPrice,
        campaignDetails,
        isRewardRedeemed,
        finalPrice,
        totalDuration,
        paymentMethod,
        setPaymentMethod,
        onRemove: (id) => toggleService(id),
        onCheckout: handleSaveCheckout,
        canCheckout
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "lg:hidden fixed bottom-0 inset-x-0 bg-darkBg-card border-t border-darkBg-border shadow-2xl z-30" }, showCartMobile && /* @__PURE__ */ React.createElement("div", { className: "p-4 max-h-[60vh] overflow-y-auto border-b border-darkBg-border" }, /* @__PURE__ */ React.createElement(
      CartPanel,
      {
        selectedServices,
        currentVehicleType,
        originalPrice,
        campaignDetails,
        isRewardRedeemed,
        finalPrice,
        totalDuration,
        paymentMethod,
        setPaymentMethod,
        onRemove: (id) => toggleService(id),
        onCheckout: handleSaveCheckout,
        canCheckout,
        compact: true
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "p-3 flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowCartMobile((prev) => !prev),
        className: "flex-1 text-left"
      },
      /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 block" }, selectedServices.length, " hizmet • ", totalDuration, " dk"),
      /* @__PURE__ */ React.createElement("span", { className: "text-xl font-extrabold text-emerald-400" }, formatCurrency(finalPrice))
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSaveCheckout,
        disabled: !canCheckout,
        className: `px-5 py-3 rounded-xl font-extrabold text-sm transition shadow-lg ${canCheckout ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20" : "bg-darkBg-deep text-gray-600 cursor-not-allowed"}`
      },
      "Tahsil Et"
    ))), /* @__PURE__ */ React.createElement(
      ReceiptPrint,
      {
        isOpen: !!receipt,
        data: receipt,
        onClose: () => setReceipt(null)
      }
    ));
  };
  var CartPanel = ({
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
  }) => /* @__PURE__ */ React.createElement("div", { className: `bg-darkBg-card border border-darkBg-border rounded-2xl shadow-lg ${compact ? "" : "p-5"}` }, !compact && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-darkBg-border pb-3 mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white" }, "Sepet"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/15 text-brand-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider" }, currentVehicleType)), selectedServices.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-8 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-darkBg-deep mx-auto flex items-center justify-center text-gray-600 mb-2" }, /* @__PURE__ */ React.createElement(Icons.Clipboard, null)), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, "Henüz hizmet seçilmedi.")) : /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-4 max-h-[280px] overflow-y-auto pr-1" }, selectedServices.map((srv) => {
    var _a;
    return /* @__PURE__ */ React.createElement("div", { key: srv.id, className: "flex items-center justify-between gap-2 bg-darkBg-deep border border-darkBg-border rounded-lg p-2.5 group" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-gray-200 truncate" }, srv.name), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, srv.duration, " dk")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-emerald-400" }, formatCurrency(((_a = srv.prices) == null ? void 0 : _a[currentVehicleType]) || 0)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onRemove(srv.id),
        className: "p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition",
        "aria-label": "Hizmeti çıkar"
      },
      /* @__PURE__ */ React.createElement(Icons.X, null)
    )));
  })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-xs border-t border-darkBg-border pt-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Toplam Süre"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-200" }, totalDuration, " dk")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Ara Toplam"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-200" }, formatCurrency(originalPrice))), !isRewardRedeemed && campaignDetails.discountAmount > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-emerald-400" }, /* @__PURE__ */ React.createElement("span", null, "Kampanya İndirimi"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "- ", formatCurrency(campaignDetails.discountAmount))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, campaignDetails.appliedCampaigns.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.id, className: "text-[9px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded" }, c.name)))), isRewardRedeemed && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-emerald-400" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), " Sadakat Ödülü"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "- ", formatCurrency(originalPrice)))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border mt-3 pt-3 flex items-end justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] uppercase tracking-widest text-gray-500 font-bold" }, "Tahsil Edilecek"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-emerald-400" }, formatCurrency(finalPrice))), !isRewardRedeemed && /* @__PURE__ */ React.createElement("div", { className: "mt-3" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2" }, "Ödeme Yöntemi"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-1.5" }, PAYMENT_METHODS.map((p) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      type: "button",
      onClick: () => setPaymentMethod(p.id),
      className: `px-2 py-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 ${paymentMethod === p.id ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-brand-500/40"}`
    },
    /* @__PURE__ */ React.createElement("span", null, p.icon),
    /* @__PURE__ */ React.createElement("span", null, p.label)
  )))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onCheckout,
      disabled: !canCheckout,
      className: `w-full mt-4 py-3 rounded-xl font-extrabold text-sm transition shadow-lg ${canCheckout ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-[0.98]" : "bg-darkBg-deep text-gray-600 cursor-not-allowed"}`
    },
    "Tahsil Et & Tamamla"
  ));

  // src/tabs/AppointmentsTab.jsx
  var { useState: useState5 } = React;
  var AppointmentsTab = ({
    appointments,
    setAppointments,
    customers,
    setCustomers,
    services,
    setQuickPlateContext,
    setPendingFromAppointment,
    setActiveTab,
    showNotification
  }) => {
    const [isOpenModal, setIsOpenModal] = useState5(false);
    const [plate, setPlate] = useState5("");
    const [custName, setCustName] = useState5("");
    const [custPhone, setCustPhone] = useState5("");
    const [vehicleType, setVehicleType] = useState5("SEDAN");
    const [selectedServiceIds, setSelectedServiceIds] = useState5([]);
    const [datetime, setDatetime] = useState5("");
    const [notes, setNotes] = useState5("");
    const pendingApps = appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING);
    const completedApps = appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED);
    const cancelledApps = appointments.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED);
    const handleCreateAppointment = (e) => {
      e.preventDefault();
      if (!plate || !custName || !datetime) {
        showNotification("Plaka, Müşteri Adı ve Tarih zorunludur.", "error");
        return;
      }
      let customer = customers.find((c) => normalizePlate(c.plate) === normalizePlate(plate));
      if (!customer) {
        customer = {
          id: generateUUID(),
          plate: normalizePlate(plate),
          name: custName,
          phone: custPhone || "Belirtilmedi",
          vehicleType,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        setCustomers((prev) => [...prev, customer]);
      }
      const newApp = {
        id: generateUUID(),
        customerId: customer.id,
        serviceIds: selectedServiceIds,
        datetime: new Date(datetime).toISOString(),
        status: APPOINTMENT_STATUS.PENDING,
        notes
      };
      setAppointments((prev) => [newApp, ...prev]);
      showNotification("Randevu kaydı başarıyla oluşturuldu.");
      setIsOpenModal(false);
      setPlate("");
      setCustName("");
      setCustPhone("");
      setSelectedServiceIds([]);
      setDatetime("");
      setNotes("");
    };
    const changeStatus = (id, newStatus) => {
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
      showNotification(`Randevu durumu '${newStatus}' olarak güncellendi.`);
    };
    const convertToSale = (app) => {
      const cust = customers.find((c) => c.id === app.customerId);
      if (cust) {
        setQuickPlateContext(cust.plate);
        if (typeof setPendingFromAppointment === "function") {
          setPendingFromAppointment({
            appointmentId: app.id,
            serviceIds: Array.isArray(app.serviceIds) ? app.serviceIds : [],
            notes: app.notes || ""
          });
        }
        setActiveTab("sales");
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Randevu Defteri",
        description: "Gelecek rezervasyonları ve aktif iş kuyruğunu yönetin.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setIsOpenModal(true),
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Yeni Randevu Al")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-4 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-amber-400 flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 bg-amber-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", null, "Sırada Bekleyenler")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-extrabold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full" }, pendingApps.length)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[500px] overflow-y-auto pr-1" }, pendingApps.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-10" }, "Kuyrukta randevu bulunmuyor.") : pendingApps.map((app) => {
      const cust = customers.find((c) => c.id === app.customerId);
      const srvNames = app.serviceIds.map((id) => {
        var _a;
        return ((_a = services.find((s) => s.id === id)) == null ? void 0 : _a.name) || "Hizmet";
      }).join(", ");
      return /* @__PURE__ */ React.createElement("div", { key: app.id, className: "bg-darkBg-deep border border-darkBg-border p-4 rounded-lg space-y-3 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded text-xs uppercase tracking-wider" }, (cust == null ? void 0 : cust.plate) || "PLAKA YOK"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-semibold" }, new Date(app.datetime).toLocaleString("tr-TR"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-200" }, (cust == null ? void 0 : cust.name) || "Bilinmiyor"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 mt-0.5" }, cust == null ? void 0 : cust.phone), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 italic mt-1 font-medium" }, srvNames), app.notes && /* @__PURE__ */ React.createElement("p", { className: "text-amber-500/80 bg-amber-500/5 p-1.5 rounded mt-2 border border-amber-500/10 text-[10px]" }, "Not: ", app.notes)), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-2 border-t border-darkBg-border pt-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => convertToSale(app),
          className: "flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-1.5 rounded font-bold text-[10px] transition text-center"
        },
        "Hizmete Dönüştür"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => changeStatus(app.id, APPOINTMENT_STATUS.COMPLETED),
          className: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 rounded transition",
          title: "Tamamlandı İşaretle"
        },
        /* @__PURE__ */ React.createElement(Icons.Check, null)
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => changeStatus(app.id, APPOINTMENT_STATUS.CANCELLED),
          className: "bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded transition",
          title: "Randevuyu İptal Et"
        },
        /* @__PURE__ */ React.createElement(Icons.X, null)
      )));
    }))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-4 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-emerald-400 flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", null, "Başarıyla Tamamlananlar")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-extrabold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full" }, completedApps.length)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[500px] overflow-y-auto pr-1" }, completedApps.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-10" }, "Tamamlanan randevu yok.") : completedApps.map((app) => {
      const cust = customers.find((c) => c.id === app.customerId);
      return /* @__PURE__ */ React.createElement("div", { key: app.id, className: "bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-xs opacity-75" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded uppercase tracking-wider" }, cust == null ? void 0 : cust.plate), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, new Date(app.datetime).toLocaleDateString("tr-TR"))), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-300 mt-2" }, cust == null ? void 0 : cust.name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1" }, /* @__PURE__ */ React.createElement(Icons.Check, null), " Tamamlandı"));
    }))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-4 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-red-400 flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 bg-red-400 rounded-full inline-block" }), /* @__PURE__ */ React.createElement("span", null, "İptal Edilenler")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-extrabold bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full" }, cancelledApps.length)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[500px] overflow-y-auto pr-1" }, cancelledApps.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-10" }, "İptal edilen kayıt yok.") : cancelledApps.map((app) => {
      const cust = customers.find((c) => c.id === app.customerId);
      return /* @__PURE__ */ React.createElement("div", { key: app.id, className: "bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-xs opacity-60" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded uppercase tracking-wider" }, cust == null ? void 0 : cust.plate), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => changeStatus(app.id, APPOINTMENT_STATUS.PENDING),
          className: "text-[10px] text-brand-400 hover:underline"
        },
        "Kuyruğa Geri Al"
      )), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-400 mt-2" }, cust == null ? void 0 : cust.name));
    })))), isOpenModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-lg bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Yeni Randevu Kaydet"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenModal(false), className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), /* @__PURE__ */ React.createElement("form", { onSubmit: handleCreateAppointment, className: "space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Araç Plakası *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: plate,
        onChange: (e) => setPlate(normalizePlate(e.target.value)),
        placeholder: "Örn: 34ABC123",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Müşteri Ad Soyadı *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: custName,
        onChange: (e) => setCustName(e.target.value),
        placeholder: "Ahmet Yılmaz",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Telefon Numarası"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: custPhone,
        onChange: (e) => setCustPhone(e.target.value),
        placeholder: "05...",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Araç Tipi"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: vehicleType,
        onChange: (e) => setVehicleType(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      },
      VEHICLE_TYPES.map((type) => /* @__PURE__ */ React.createElement("option", { key: type.id, value: type.id }, type.label.toLocaleUpperCase("tr-TR")))
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Randevu Tarih & Saat *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "datetime-local",
        required: true,
        value: datetime,
        onChange: (e) => setDatetime(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Randevu Hizmetleri"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto bg-darkBg-deep p-2.5 border border-darkBg-border rounded" }, services.map((srv) => {
      const isChecked = selectedServiceIds.includes(srv.id);
      return /* @__PURE__ */ React.createElement("label", { key: srv.id, className: "flex items-center space-x-2 text-[10px] text-gray-300 cursor-pointer" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: isChecked,
          onChange: () => {
            if (isChecked) {
              setSelectedServiceIds((prev) => prev.filter((id) => id !== srv.id));
            } else {
              setSelectedServiceIds((prev) => [...prev, srv.id]);
            }
          },
          className: "rounded bg-darkBg-deep border-gray-700 text-brand-500 focus:ring-brand-500"
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, srv.name));
    }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Randevu Notları"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        placeholder: "İstediği saatte gelsin vb.",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none focus:border-brand-500 resize-none"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsOpenModal(false),
        className: "flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition"
      },
      "Vazgeç"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        className: "flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition"
      },
      "Kaydet"
    ))))));
  };

  // src/ui/ConfirmModal.jsx
  var CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm p-6 bg-darkBg-card rounded-xl border border-darkBg-border shadow-2xl space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-white flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-500" }, /* @__PURE__ */ React.createElement(Icons.AlertTriangle, null)), /* @__PURE__ */ React.createElement("span", null, title)), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-2" }, message)), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onCancel,
        className: "flex-1 bg-gray-800 hover:bg-gray-700 text-xs py-2 rounded-lg font-semibold transition text-white"
      },
      "İptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onConfirm,
        className: "flex-1 bg-red-600 hover:bg-red-500 text-xs py-2 rounded-lg font-semibold transition text-white"
      },
      "Onayla"
    ))));
  };

  // src/tabs/CustomersTab.jsx
  var { useState: useState6, useMemo: useMemo3 } = React;
  var initials2 = (name) => {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toLocaleUpperCase("tr-TR");
  };
  var SORT_OPTIONS = [
    { id: "recent", label: "En Yeni" },
    { id: "visits", label: "Çok Ziyaret" },
    { id: "loyalty", label: "Sadakat" },
    { id: "name", label: "Ad (A-Z)" }
  ];
  var LoyaltyRing = ({ progress, target, ready }) => {
    const r = 22;
    const c = 2 * Math.PI * r;
    const pct = ready ? 1 : Math.min(progress / target, 1);
    const offset = c * (1 - pct);
    return /* @__PURE__ */ React.createElement("div", { className: "relative w-14 h-14 shrink-0" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 60 60", className: "w-full h-full -rotate-90" }, /* @__PURE__ */ React.createElement("circle", { cx: "30", cy: "30", r, fill: "none", stroke: "currentColor", strokeWidth: "4", className: "text-darkBg-deep" }), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "30",
        cy: "30",
        r,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "4",
        strokeLinecap: "round",
        strokeDasharray: c,
        strokeDashoffset: offset,
        className: ready ? "text-emerald-400" : "text-brand-500",
        style: { transition: "stroke-dashoffset 400ms" }
      }
    )), /* @__PURE__ */ React.createElement("span", { className: `absolute inset-0 flex items-center justify-center text-[11px] font-extrabold ${ready ? "text-emerald-300" : "text-white"}` }, ready ? "✓" : `${progress}/${target}`));
  };
  var CustomersTab = ({
    customers,
    setCustomers,
    transactions,
    setTransactions,
    appointments,
    setAppointments,
    sales,
    setSales,
    products,
    setProducts,
    services,
    settings,
    showNotification
  }) => {
    const loyaltyTarget = (settings == null ? void 0 : settings.loyalty_target_visits) || 5;
    const [search, setSearch] = useState6("");
    const [filterType, setFilterType] = useState6("ALL");
    const [showOnlyReady, setShowOnlyReady] = useState6(false);
    const [sortBy, setSortBy] = useState6("recent");
    const [viewHistoryCust, setViewHistoryCust] = useState6(null);
    const [editCustomer, setEditCustomer] = useState6(null);
    const [editName, setEditName] = useState6("");
    const [editPhone, setEditPhone] = useState6("");
    const [editPlate, setEditPlate] = useState6("");
    const [editVehicleType, setEditVehicleType] = useState6("SEDAN");
    const [deleteConfirm, setDeleteConfirm] = useState6({ isOpen: false, targetId: null });
    const customerStats = useMemo3(() => {
      const map = /* @__PURE__ */ new Map();
      customers.forEach((c) => {
        const stats = computeLoyaltyStats(c.id, transactions, loyaltyTarget);
        const completedTx = transactions.filter((t) => t.customerId === c.id && t.status === "COMPLETED");
        const totalSpent = completedTx.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
        const lastVisit = completedTx.reduce((latest, t) => {
          const d = new Date(t.date).getTime();
          return d > latest ? d : latest;
        }, 0);
        map.set(c.id, { stats, totalSpent, lastVisit, visitCount: completedTx.length });
      });
      return map;
    }, [customers, transactions, loyaltyTarget]);
    const summary = useMemo3(() => {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1e3;
      let readyCount = 0;
      let newThisMonth = 0;
      let totalVisits = 0;
      customers.forEach((c) => {
        const meta = customerStats.get(c.id);
        if (meta == null ? void 0 : meta.stats.ready) readyCount += 1;
        if (new Date(c.createdAt).getTime() >= monthAgo) newThisMonth += 1;
        totalVisits += (meta == null ? void 0 : meta.visitCount) || 0;
      });
      return {
        total: customers.length,
        readyCount,
        newThisMonth,
        avgVisits: customers.length > 0 ? totalVisits / customers.length : 0
      };
    }, [customers, customerStats]);
    const filteredCustomers = useMemo3(() => {
      const term = search.trim().toLocaleLowerCase("tr-TR");
      let list = customers.filter((c) => {
        const meta = customerStats.get(c.id);
        const haystack = `${c.name} ${c.plate} ${c.phone}`.toLocaleLowerCase("tr-TR");
        if (term && !haystack.includes(term)) return false;
        if (filterType !== "ALL" && c.vehicleType !== filterType) return false;
        if (showOnlyReady && !(meta == null ? void 0 : meta.stats.ready)) return false;
        return true;
      });
      list.sort((a, b) => {
        const ma = customerStats.get(a.id);
        const mb = customerStats.get(b.id);
        switch (sortBy) {
          case "visits":
            return ((mb == null ? void 0 : mb.visitCount) || 0) - ((ma == null ? void 0 : ma.visitCount) || 0);
          case "loyalty": {
            const ra = (ma == null ? void 0 : ma.stats.ready) ? 1e3 : (ma == null ? void 0 : ma.stats.progress) || 0;
            const rb = (mb == null ? void 0 : mb.stats.ready) ? 1e3 : (mb == null ? void 0 : mb.stats.progress) || 0;
            return rb - ra;
          }
          case "name":
            return a.name.localeCompare(b.name, "tr-TR");
          case "recent":
          default:
            return ((mb == null ? void 0 : mb.lastVisit) || new Date(b.createdAt).getTime()) - ((ma == null ? void 0 : ma.lastVisit) || new Date(a.createdAt).getTime());
        }
      });
      return list;
    }, [customers, customerStats, search, filterType, showOnlyReady, sortBy]);
    const openEditCustomer = (customer) => {
      setEditCustomer(customer);
      setEditName(customer.name || "");
      setEditPhone(customer.phone || "");
      setEditPlate(customer.plate || "");
      setEditVehicleType(customer.vehicleType || "SEDAN");
    };
    const closeEditCustomer = () => {
      setEditCustomer(null);
      setEditName("");
      setEditPhone("");
      setEditPlate("");
      setEditVehicleType("SEDAN");
    };
    const saveEditedCustomer = (e) => {
      e.preventDefault();
      const cleanPlate = normalizePlate(editPlate);
      if (!editName.trim() || !cleanPlate) {
        showNotification("Müşteri adı ve plaka zorunludur.", "error");
        return;
      }
      const hasDuplicatePlate = customers.some((c) => c.id !== editCustomer.id && normalizePlate(c.plate) === cleanPlate);
      if (hasDuplicatePlate) {
        showNotification("Bu plaka başka bir müşteri kaydında kullanılıyor.", "error");
        return;
      }
      setCustomers((prev) => prev.map((c) => c.id === editCustomer.id ? {
        ...c,
        name: editName.trim(),
        phone: editPhone.trim() || "Belirtilmedi",
        plate: cleanPlate,
        vehicleType: editVehicleType
      } : c));
      showNotification("Müşteri kartı güncellendi.");
      closeEditCustomer();
    };
    const confirmDeleteCustomer = () => {
      const id = deleteConfirm.targetId;
      const target = customers.find((c) => c.id === id);
      const snapshotFromCustomer = target ? { plate: target.plate, name: target.name, phone: target.phone, vehicleType: target.vehicleType } : null;
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setTransactions((prev) => prev.map(
        (t) => t.customerId === id ? { ...t, customerId: "ANONIM_MUSTERI", customerSnapshot: t.customerSnapshot || snapshotFromCustomer } : t
      ));
      setSales((prev) => prev.map(
        (s) => s.customerId === id ? { ...s, customerId: "ANONIM_MUSTERI", customerSnapshot: s.customerSnapshot || snapshotFromCustomer } : s
      ));
      setAppointments((prev) => prev.filter((a) => a.customerId !== id));
      showNotification("Müşteri kartı silindi. Geçmiş gelir kayıtları korundu.", "warning");
      setDeleteConfirm({ isOpen: false, targetId: null });
    };
    const formatRelative = (timestamp) => {
      if (!timestamp) return "Hiç ziyaret yok";
      const diff = Date.now() - timestamp;
      const days = Math.floor(diff / (24 * 60 * 60 * 1e3));
      if (days === 0) return "Bugün";
      if (days === 1) return "Dün";
      if (days < 7) return `${days} gün önce`;
      if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
      if (days < 365) return `${Math.floor(days / 30)} ay önce`;
      return `${Math.floor(days / 365)} yıl önce`;
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: deleteConfirm.isOpen,
        title: "Müşteri Kaydını Sil?",
        message: "Müşteri kartı kaldırılır, bekleyen randevuları iptal edilir. Geçmiş gelirler 'Anonim Müşteri' olarak korunur, ciro değişmez.",
        onConfirm: confirmDeleteCustomer,
        onCancel: () => setDeleteConfirm({ isOpen: false, targetId: null })
      }
    ), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Müşteri Portföyü (CRM)",
        description: `Sadakat hedefi: her ${loyaltyTarget} ücretli yıkama sonrası 1 bedava yıkama.`,
        actions: showOnlyReady && /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setShowOnlyReady(false),
            className: "px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold hover:bg-emerald-600/30 transition flex items-center gap-2"
          },
          /* @__PURE__ */ React.createElement(Icons.X, null),
          /* @__PURE__ */ React.createElement("span", null, "Filtreyi Kaldır")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3" }, /* @__PURE__ */ React.createElement(KpiCard, { label: "Toplam Müşteri", value: summary.total, icon: /* @__PURE__ */ React.createElement(Icons.Users, null), accent: "brand" }), /* @__PURE__ */ React.createElement(
      KpiCard,
      {
        label: "Ödüle Hazır",
        value: summary.readyCount,
        icon: /* @__PURE__ */ React.createElement(Icons.Gift, null),
        accent: "emerald",
        onClick: () => setShowOnlyReady((prev) => !prev),
        active: showOnlyReady
      }
    ), /* @__PURE__ */ React.createElement(KpiCard, { label: "Son 30 Günde Yeni", value: summary.newThisMonth, icon: /* @__PURE__ */ React.createElement(Icons.Plus, null), accent: "amber" }), /* @__PURE__ */ React.createElement(KpiCard, { label: "Müşteri Başı Ziyaret", value: summary.avgVisits.toFixed(1), icon: /* @__PURE__ */ React.createElement(Icons.Car, null), accent: "indigo" })), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-2xl p-4 shadow-lg space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" }, /* @__PURE__ */ React.createElement(Icons.Search, null)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: search,
        onChange: (e) => setSearch(e.target.value),
        placeholder: "Plaka, ad veya telefon ile ara...",
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 pl-10 pr-3 py-2.5 rounded-lg text-sm text-white outline-none transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-bold uppercase mr-1" }, "Araç"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setFilterType("ALL"),
        className: `px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${filterType === "ALL" ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white"}`
      },
      "Tümü"
    ), VEHICLE_TYPES.map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t.id,
        type: "button",
        onClick: () => setFilterType(t.id),
        className: `px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${filterType === t.id ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white"}`
      },
      t.label
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 ml-auto" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-bold uppercase mr-1" }, "Sıralama"), SORT_OPTIONS.map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.id,
        type: "button",
        onClick: () => setSortBy(opt.id),
        className: `px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${sortBy === opt.id ? "bg-emerald-600 border-emerald-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white"}`
      },
      opt.label
    ))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" }, filteredCustomers.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "col-span-full bg-darkBg-card border border-darkBg-border rounded-2xl p-10 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 mx-auto rounded-full bg-darkBg-deep flex items-center justify-center text-gray-600 mb-3" }, /* @__PURE__ */ React.createElement(Icons.Users, null)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400" }, "Aranan kriterlere uygun müşteri bulunamadı.")) : filteredCustomers.map((cust) => {
      const meta = customerStats.get(cust.id);
      const stats = (meta == null ? void 0 : meta.stats) || computeLoyaltyStats(cust.id, transactions, loyaltyTarget);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: cust.id,
          className: `group relative bg-darkBg-card border rounded-2xl p-4 shadow-lg space-y-4 flex flex-col transition hover:-translate-y-0.5 hover:shadow-brand-500/10 ${stats.ready ? "border-emerald-500/40" : "border-darkBg-border hover:border-brand-500/40"}`
        },
        stats.ready && /* @__PURE__ */ React.createElement("div", { className: "absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1 animate-pulse" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), /* @__PURE__ */ React.createElement("span", null, stats.availableRewards, "× BEDAVA")),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-500/30 flex items-center justify-center text-brand-300 font-extrabold text-base shrink-0" }, initials2(cust.name)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-bold text-white truncate" }, cust.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 truncate" }, cust.phone), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-extrabold bg-brand-500/15 text-brand-300 px-1.5 py-0.5 rounded uppercase tracking-wider" }, cust.plate), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] bg-darkBg-deep text-gray-400 px-1.5 py-0.5 rounded" }, cust.vehicleType))), /* @__PURE__ */ React.createElement(LoyaltyRing, { progress: stats.progress, target: stats.target, ready: stats.ready })),
        /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 text-center" }, /* @__PURE__ */ React.createElement(Stat, { label: "Ziyaret", value: (meta == null ? void 0 : meta.visitCount) || 0 }), /* @__PURE__ */ React.createElement(Stat, { label: "Harcama", value: formatCurrency((meta == null ? void 0 : meta.totalSpent) || 0), compact: true }), /* @__PURE__ */ React.createElement(Stat, { label: "Son", value: formatRelative(meta == null ? void 0 : meta.lastVisit), compact: true })),
        stats.ready ? /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-[11px] text-emerald-300 font-semibold flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), /* @__PURE__ */ React.createElement("span", null, "Bedava yıkama hak kazandı! Hizmet kaydında ödülü kullan.")) : /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-500 text-center bg-darkBg-deep border border-darkBg-border rounded-lg p-2" }, "Hediyeye ", /* @__PURE__ */ React.createElement("span", { className: "text-brand-400 font-extrabold" }, stats.nextRewardIn), " ücretli yıkama kaldı"),
        /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 pt-2 border-t border-darkBg-border" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setViewHistoryCust(cust),
            className: "flex-1 px-2 py-1.5 rounded-lg bg-brand-600/15 hover:bg-brand-600 text-brand-300 hover:text-white text-[10px] font-bold transition"
          },
          "Geçmiş"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => openEditCustomer(cust),
            className: "flex-1 px-2 py-1.5 rounded-lg bg-darkBg-deep hover:bg-darkBg-hover text-gray-300 text-[10px] font-bold transition"
          },
          "Düzenle"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setDeleteConfirm({ isOpen: true, targetId: cust.id }),
            className: "p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition",
            title: "Müşteriyi Sil"
          },
          /* @__PURE__ */ React.createElement(Icons.Trash, null)
        ))
      );
    })), editCustomer && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-md bg-darkBg-card border border-darkBg-border rounded-2xl p-6 shadow-2xl space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Müşteri Kartını Düzenle"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Plaka değişikliği geçmiş işlemleri etkilemez.")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: closeEditCustomer, className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), /* @__PURE__ */ React.createElement("form", { onSubmit: saveEditedCustomer, className: "space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Plaka *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: editPlate,
        onChange: (e) => setEditPlate(normalizePlate(e.target.value)),
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white uppercase tracking-wider outline-none transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Araç Tipi"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: editVehicleType,
        onChange: (e) => setEditVehicleType(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white outline-none transition"
      },
      VEHICLE_TYPES.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.id, value: t.id }, t.label))
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Ad Soyad *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: editName,
        onChange: (e) => setEditName(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white outline-none transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Telefon"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: editPhone,
        onChange: (e) => setEditPhone(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border focus:border-brand-500 p-2.5 rounded-lg text-white outline-none transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: closeEditCustomer, className: "flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-lg transition" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-lg transition" }, "Kaydet"))))), viewHistoryCust && /* @__PURE__ */ React.createElement(
      HistoryModal,
      {
        customer: viewHistoryCust,
        transactions,
        services,
        sales,
        products,
        stats: customerStats.get(viewHistoryCust.id),
        onClose: () => setViewHistoryCust(null)
      }
    ));
  };
  var KpiCard = ({ label, value, icon, accent = "brand", onClick, active }) => {
    const colors = {
      brand: { bg: "bg-brand-500/10", text: "text-brand-400", activeBg: "bg-brand-600" },
      emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", activeBg: "bg-emerald-600" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-400", activeBg: "bg-amber-600" },
      indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", activeBg: "bg-indigo-600" }
    };
    const c = colors[accent] || colors.brand;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: onClick ? "button" : void 0,
        onClick,
        disabled: !onClick,
        className: `text-left bg-darkBg-card border rounded-2xl p-4 shadow-lg transition ${active ? `border-${accent}-500/60 ring-1 ring-${accent}-500/40` : "border-darkBg-border"} ${onClick ? "hover:border-brand-500/40 cursor-pointer" : "cursor-default"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] uppercase tracking-widest text-gray-500 font-bold block" }, label), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-white tracking-tight mt-1 block" }, value)), /* @__PURE__ */ React.createElement("span", { className: `p-2.5 rounded-lg ${c.bg} ${c.text}` }, icon))
    );
  };
  var Stat = ({ label, value, compact = false }) => /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-deep border border-darkBg-border rounded-lg p-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] uppercase tracking-widest text-gray-500 font-bold block" }, label), /* @__PURE__ */ React.createElement("span", { className: `font-bold text-white block truncate ${compact ? "text-[11px]" : "text-sm"}` }, value));
  var HistoryModal = ({ customer, transactions, services, sales, products, stats, onClose }) => {
    const history = useMemo3(() => {
      return transactions.filter((t) => t.customerId === customer.id && t.status === "COMPLETED").sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, customer.id]);
    const productHistory = useMemo3(() => {
      return sales.filter((s) => s.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [sales, customer.id]);
    const serviceMap = useMemo3(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
    const productMap = useMemo3(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-2xl bg-darkBg-card border border-darkBg-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start border-b border-darkBg-border pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-extrabold" }, initials2(customer.name)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, customer.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, customer.plate, " · ", customer.phone))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onClose, className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), stats && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" }, /* @__PURE__ */ React.createElement(Stat, { label: "Ücretli", value: stats.stats.paidVisits }), /* @__PURE__ */ React.createElement(Stat, { label: "Ödül Kullanım", value: stats.stats.rewardVisits }), /* @__PURE__ */ React.createElement(Stat, { label: "Hak Edilen", value: stats.stats.paidVisits >= stats.stats.target ? Math.floor(stats.stats.paidVisits / stats.stats.target) : 0 }), /* @__PURE__ */ React.createElement(Stat, { label: "Toplam Harcama", value: formatCurrency(stats.totalSpent), compact: true })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-gray-300 mb-2 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Car, null), /* @__PURE__ */ React.createElement("span", null, "Hizmet Geçmişi (", history.length, ")")), history.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-4" }, "Tamamlanmış hizmet kaydı yok.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, history.map((tr) => {
      const srvNames = (tr.serviceIds || []).map((id) => {
        var _a;
        return ((_a = serviceMap[id]) == null ? void 0 : _a.name) || "Hizmet";
      }).join(", ");
      return /* @__PURE__ */ React.createElement("div", { key: tr.id, className: `bg-darkBg-deep border rounded-lg p-3 text-xs flex justify-between items-start gap-3 ${tr.isLoyaltyReward ? "border-emerald-500/30" : "border-darkBg-border"}` }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, new Date(tr.date).toLocaleString("tr-TR")), tr.isLoyaltyReward && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), " ÖDÜL")), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-200 mt-1" }, srvNames), tr.notes && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-amber-500/80 mt-1" }, tr.notes)), /* @__PURE__ */ React.createElement("div", { className: "text-right shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: `font-extrabold block ${tr.isLoyaltyReward ? "text-emerald-400" : "text-emerald-400"}` }, tr.isLoyaltyReward ? "0 ₺" : formatCurrency(tr.totalPrice)), tr.discountAmount > 0 && !tr.isLoyaltyReward && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-emerald-400" }, "-", formatCurrency(tr.discountAmount), " indirim")));
    }))), productHistory.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-gray-300 mb-2 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Package, null), /* @__PURE__ */ React.createElement("span", null, "Ürün Alımları (", productHistory.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, productHistory.map((s) => {
      const prod = productMap[s.productId];
      return /* @__PURE__ */ React.createElement("div", { key: s.id, className: "bg-darkBg-deep border border-darkBg-border rounded-lg p-3 text-xs flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-200" }, (prod == null ? void 0 : prod.name) || "Ürün", " × ", s.quantity), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, new Date(s.date).toLocaleDateString("tr-TR"))), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-emerald-400" }, formatCurrency(s.totalPrice)));
    }))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "w-full bg-darkBg-deep hover:bg-darkBg-hover text-white font-bold py-2.5 rounded-lg text-xs transition"
      },
      "Kapat"
    )));
  };

  // src/tabs/ServicesTab.jsx
  var { useState: useState7 } = React;
  var ServicesTab = ({
    services,
    setServices,
    showNotification
  }) => {
    const [isOpenModal, setIsOpenModal] = useState7(false);
    const [isEditMode, setIsEditMode] = useState7(false);
    const [editId, setEditId] = useState7("");
    const [srvName, setSrvName] = useState7("");
    const [duration, setDuration] = useState7(45);
    const [sedanPrice, setSedanPrice] = useState7(500);
    const [suvPrice, setSuvPrice] = useState7(600);
    const [minibusPrice, setMinibusPrice] = useState7(700);
    const [ticariPrice, setTicariPrice] = useState7(640);
    const [motosikletPrice, setMotosikletPrice] = useState7(300);
    const handleSaveService = (e) => {
      e.preventDefault();
      if (!srvName) {
        showNotification("Hizmet adı girilmelidir.", "error");
        return;
      }
      const pricesObj = {
        SEDAN: parsePositiveNumber(sedanPrice),
        SUV: parsePositiveNumber(suvPrice),
        MINIBUS: parsePositiveNumber(minibusPrice),
        TICARI: parsePositiveNumber(ticariPrice),
        MOTOSIKLET: parsePositiveNumber(motosikletPrice)
      };
      if (isEditMode) {
        setServices((prev) => prev.map((s) => s.id === editId ? {
          ...s,
          name: srvName,
          duration: parsePositiveInteger(duration, 45),
          prices: pricesObj
        } : s));
        showNotification("Hizmet başarıyla güncellendi.");
      } else {
        const newSrv = {
          id: generateUUID(),
          name: srvName,
          prices: pricesObj,
          duration: parsePositiveInteger(duration, 45),
          isActive: true
        };
        setServices((prev) => [...prev, newSrv]);
        showNotification("Yeni hizmet kataloğa eklendi.");
      }
      setIsOpenModal(false);
      setIsEditMode(false);
      setSrvName("");
      setDuration(45);
      setSedanPrice(500);
      setSuvPrice(600);
      setMinibusPrice(700);
      setTicariPrice(640);
      setMotosikletPrice(300);
    };
    const openEditDialog = (srv) => {
      setEditId(srv.id);
      setSrvName(srv.name);
      setDuration(srv.duration);
      setSedanPrice(srv.prices.SEDAN || 0);
      setSuvPrice(srv.prices.SUV || 0);
      setMinibusPrice(srv.prices.MINIBUS || 0);
      setTicariPrice(srv.prices.TICARI || 0);
      setMotosikletPrice(srv.prices.MOTOSIKLET || 0);
      setIsEditMode(true);
      setIsOpenModal(true);
    };
    const toggleActive = (id, currentVal) => {
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !currentVal } : s));
      showNotification("Hizmet durumu güncellendi.");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Yıkama & Bakım Hizmet Kataloğu",
        description: "Araç sınıflarına göre yıkama paketlerini ve fiyat listesini özelleştirin.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setIsOpenModal(true),
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Kataloğa Paket Ekle")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, services.map((srv) => /* @__PURE__ */ React.createElement("div", { key: srv.id, className: `bg-darkBg-card border rounded-xl p-5 shadow space-y-4 flex flex-col justify-between transition ${srv.isActive ? "border-darkBg-border" : "border-dashed border-red-500/20 opacity-60"}` }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white" }, srv.name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, "Ortalama Süre: ", srv.duration, " Dakika")), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] px-2.5 py-0.5 rounded-full font-bold ${srv.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}` }, srv.isActive ? "Aktif" : "Pasif")), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-deep p-3 rounded-lg border border-darkBg-border text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-400" }, VEHICLE_TYPES.map((type, index) => {
      const isLast = index === VEHICLE_TYPES.length - 1;
      const odd = VEHICLE_TYPES.length % 2 === 1;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: type.id,
          className: `flex justify-between ${isLast && odd ? "col-span-2 pt-1" : "border-b border-darkBg-border pb-1"}`
        },
        /* @__PURE__ */ React.createElement("span", null, type.label.toLocaleUpperCase("tr-TR"), ":"),
        /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-bold" }, formatCurrency(srv.prices[type.id] || 0))
      );
    })))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-3 flex space-x-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => openEditDialog(srv),
        className: "flex-1 bg-brand-900/20 text-brand-400 hover:bg-brand-600 hover:text-white py-1.5 rounded font-bold text-xs transition"
      },
      "Düzenle"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => toggleActive(srv.id, srv.isActive),
        className: `flex-1 py-1.5 rounded font-bold text-xs transition ${srv.isActive ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"}`
      },
      srv.isActive ? "Durdur" : "Aktifleştir"
    ))))), isOpenModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-lg bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, isEditMode ? "Hizmet Paketini Düzenle" : "Kataloğa Yeni Hizmet Ekle"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenModal(false), className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSaveService, className: "space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Hizmet Paketi Adı *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: srvName,
        onChange: (e) => setSrvName(e.target.value),
        placeholder: "Örn: Seramik Kaplama Hızlı Cila",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Uygulama Süresi (Dakika) *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        required: true,
        value: duration,
        onChange: (e) => setDuration(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-3" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-brand-400 mb-3" }, "Araç Sınıflarına Göre Fiyatlandırma (₺)"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold text-[10px]" }, "SEDAN *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: sedanPrice, onChange: (e) => setSedanPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold text-[10px]" }, "SUV *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: suvPrice, onChange: (e) => setSuvPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold text-[10px]" }, "MİNİBÜS *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: minibusPrice, onChange: (e) => setMinibusPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold text-[10px]" }, "TİCARİ *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: ticariPrice, onChange: (e) => setTicariPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold text-[10px]" }, "MOTOSİKLET *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: motosikletPrice, onChange: (e) => setMotosikletPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white focus:outline-none" })))), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsOpenModal(false),
        className: "flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition"
      },
      "İptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        className: "flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition"
      },
      "Kaydet"
    ))))));
  };

  // src/tabs/ProductsTab.jsx
  var { useState: useState8 } = React;
  var ProductsTab = ({
    products,
    setProducts,
    sales,
    setSales,
    customers,
    showNotification
  }) => {
    const [isOpenProdModal, setIsOpenProdModal] = useState8(false);
    const [isOpenSaleModal, setIsOpenSaleModal] = useState8(false);
    const [editProductId, setEditProductId] = useState8("");
    const [prodName, setProdName] = useState8("");
    const [prodCategory, setProdCategory] = useState8("Hızlı Satış");
    const [prodPrice, setProdPrice] = useState8(100);
    const [prodCost, setProdCost] = useState8(40);
    const [prodStock, setProdStock] = useState8(10);
    const [prodUnit, setProdUnit] = useState8("Adet");
    const [selectedProdId, setSelectedProdId] = useState8("");
    const [selectedCustId, setSelectedCustId] = useState8("");
    const [saleQty, setSaleQty] = useState8(1);
    const [salePaymentMethod, setSalePaymentMethod] = useState8("cash");
    const [productReceipt, setProductReceipt] = useState8(null);
    const [deleteSaleConfirm, setDeleteSaleConfirm] = useState8({ isOpen: false, targetId: null });
    const resetProductForm = () => {
      setEditProductId("");
      setProdName("");
      setProdCategory("Hızlı Satış");
      setProdPrice(100);
      setProdCost(40);
      setProdStock(10);
      setProdUnit("Adet");
    };
    const openNewProduct = () => {
      resetProductForm();
      setIsOpenProdModal(true);
    };
    const openEditProduct = (p) => {
      setEditProductId(p.id);
      setProdName(p.name || "");
      setProdCategory(p.category || "Hızlı Satış");
      setProdPrice(p.price);
      setProdCost(p.cost);
      setProdStock(p.stock);
      setProdUnit(p.unit || "Adet");
      setIsOpenProdModal(true);
    };
    const handleAddProduct = (e) => {
      e.preventDefault();
      if (!prodName) return;
      if (editProductId) {
        setProducts((prev) => prev.map((p) => p.id === editProductId ? {
          ...p,
          name: prodName,
          category: prodCategory,
          price: parsePositiveNumber(prodPrice),
          cost: parsePositiveNumber(prodCost),
          stock: parsePositiveInteger(prodStock),
          unit: prodUnit
        } : p));
        showNotification("Ürün bilgileri güncellendi.");
      } else {
        const newProd = {
          id: generateUUID(),
          name: prodName,
          category: prodCategory,
          price: parsePositiveNumber(prodPrice),
          cost: parsePositiveNumber(prodCost),
          stock: parsePositiveInteger(prodStock),
          unit: prodUnit,
          isActive: true
        };
        setProducts((prev) => [...prev, newProd]);
        showNotification("Yeni ürün stoğa eklendi.");
      }
      setIsOpenProdModal(false);
      resetProductForm();
    };
    const handleDirectSale = (e) => {
      e.preventDefault();
      if (!selectedProdId) return;
      const product = products.find((p) => p.id === selectedProdId);
      if (!product) return;
      const quantity = Math.max(1, parsePositiveInteger(saleQty, 1));
      if (product.stock < quantity) {
        showNotification(`Yetersiz stok! Mevcut stok: ${product.stock} ${product.unit}`, "error");
        return;
      }
      setProducts((prev) => prev.map((p) => p.id === selectedProdId ? { ...p, stock: p.stock - quantity } : p));
      const customerSnapshot = selectedCustId ? (() => {
        const c = customers.find((x) => x.id === selectedCustId);
        return c ? { plate: c.plate, name: c.name, phone: c.phone, vehicleType: c.vehicleType } : null;
      })() : null;
      const newSale = {
        id: generateUUID(),
        productId: selectedProdId,
        productSnapshot: { name: product.name, unit: product.unit },
        customerId: selectedCustId || "CARI_MUSTERI",
        customerSnapshot,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        paymentMethod: salePaymentMethod,
        date: (/* @__PURE__ */ new Date()).toISOString()
      };
      setSales((prev) => [newSale, ...prev]);
      showNotification("Aksesuar/ürün satışı tamamlandı!");
      setProductReceipt({
        date: newSale.date,
        customer: customerSnapshot,
        lines: [{ label: `${product.name} × ${quantity}`, amount: newSale.totalPrice }],
        subTotal: newSale.totalPrice,
        discount: 0,
        total: newSale.totalPrice,
        paymentMethod: salePaymentMethod,
        note: ""
      });
      setIsOpenSaleModal(false);
      setSelectedProdId("");
      setSelectedCustId("");
      setSaleQty(1);
      setSalePaymentMethod("cash");
    };
    const confirmDeleteProductSale = () => {
      const targetSale = sales.find((s) => s.id === deleteSaleConfirm.targetId);
      if (!targetSale) {
        setDeleteSaleConfirm({ isOpen: false, targetId: null });
        return;
      }
      setSales((prev) => prev.filter((s) => s.id !== targetSale.id));
      setProducts((prev) => prev.map((product) => product.id === targetSale.productId ? { ...product, stock: product.stock + (targetSale.quantity || 0) } : product));
      showNotification("Ürün satışı silindi ve stok geri eklendi.", "warning");
      setDeleteSaleConfirm({ isOpen: false, targetId: null });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: deleteSaleConfirm.isOpen,
        title: "Ürün Satışını Sil?",
        message: "Bu satış kaydı finansmandan kaldırılır ve satılan adet stoğa geri eklenir.",
        onConfirm: confirmDeleteProductSale,
        onCancel: () => setDeleteSaleConfirm({ isOpen: false, targetId: null })
      }
    ), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Stok Kartları & Market Satışı",
        description: "Ürünlerinizin envanter durumunu ve hızlı satış fişlerini yönetin.",
        actions: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setIsOpenSaleModal(true),
            className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement("span", null, "Hızlı Satış Yap")
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: openNewProduct,
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Stoğa Ürün Ekle")
        ))
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl overflow-hidden shadow" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-xs text-gray-400" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Ürün Adı"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Kategori"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-right" }, "Maliyet"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-right" }, "Satış Fiyatı"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "Mevcut Stok"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Birim"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Durum"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "İşlem"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-darkBg-border" }, products.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 8, className: "p-8 text-center text-gray-500" }, "Stokta kayıtlı ürün bulunmuyor.")) : products.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id, className: "hover:bg-darkBg-hover" }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-white" }, p.name), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, p.category), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-right" }, formatCurrency(p.cost)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-right text-emerald-400 font-bold" }, formatCurrency(p.price)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full font-extrabold ${p.stock <= 5 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-brand-500/10 text-brand-300"}` }, p.stock)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, p.unit), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full inline-block ${p.stock > 0 ? "bg-emerald-400" : "bg-red-500"}` })), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => openEditProduct(p),
        className: "text-brand-400 hover:text-brand-300 text-[10px] font-bold underline-offset-2 hover:underline transition"
      },
      "Düzenle"
    )))))))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white mb-3" }, "Tamamlanan Ürün Satış Geçmişi"), sales.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 py-6 text-center" }, "Henüz yapılmış bir market satışı bulunmuyor.") : /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-darkBg-border" }, sales.map((s) => {
      const prod = products.find((p) => p.id === s.productId);
      const cust = customers.find((c) => c.id === s.customerId);
      return /* @__PURE__ */ React.createElement("div", { key: s.id, className: "py-3 flex justify-between items-center gap-3 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-200" }, (prod == null ? void 0 : prod.name) || "Belirsiz Ürün"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, (cust == null ? void 0 : cust.name) || "Müşteri Kaydı Yok", " | Adet: ", s.quantity)), /* @__PURE__ */ React.createElement("div", { className: "text-right flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-400" }, formatCurrency(s.totalPrice)), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block" }, new Date(s.date).toLocaleDateString("tr-TR"))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setDeleteSaleConfirm({ isOpen: true, targetId: s.id }),
          className: "text-gray-500 hover:text-red-400 transition",
          title: "Ürün Satışını Sil"
        },
        /* @__PURE__ */ React.createElement(Icons.Trash, null)
      )));
    }))), isOpenProdModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, editProductId ? "Ürün / Stok Kartını Düzenle" : "Yeni Ürün / Stok Kartı Oluştur"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleAddProduct, className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Ürün Adı *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: prodName, onChange: (e) => setProdName(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Kategori *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: prodCategory, onChange: (e) => setProdCategory(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Maliyet Tutarı (₺) *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: prodCost, onChange: (e) => setProdCost(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Satış Fiyatı (₺) *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: prodPrice, onChange: (e) => setProdPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Stok Adedi *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: prodStock, onChange: (e) => setProdStock(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Birim *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: prodUnit, onChange: (e) => setProdUnit(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }))), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
      setIsOpenProdModal(false);
      resetProductForm();
    }, className: "flex-1 bg-gray-800 p-2.5 rounded font-bold" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-brand-600 p-2.5 rounded font-bold" }, editProductId ? "Güncelle" : "Kaydet"))))), isOpenSaleModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Market Ürünü Satış Fişi"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleDirectSale, className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Satılacak Ürün *"), /* @__PURE__ */ React.createElement(
      "select",
      {
        required: true,
        value: selectedProdId,
        onChange: (e) => setSelectedProdId(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Ürün Seçin --"),
      products.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id, disabled: p.stock <= 0 }, p.name, " (Stok: ", p.stock, " | ", formatCurrency(p.price), ")"))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Alıcı Müşteri (Opsiyonel)"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedCustId,
        onChange: (e) => setSelectedCustId(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Cari Müşteri (Kayıtsız)"),
      customers.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.plate, " - ", c.name))
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Satış Adedi *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        required: true,
        min: 1,
        value: saleQty,
        onChange: (e) => setSaleQty(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Ödeme Yöntemi"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-1.5" }, PAYMENT_METHODS.map((p) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: p.id,
        type: "button",
        onClick: () => setSalePaymentMethod(p.id),
        className: `px-2 py-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 ${salePaymentMethod === p.id ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, p.icon),
      /* @__PURE__ */ React.createElement("span", null, p.label)
    )))), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenSaleModal(false), className: "flex-1 bg-gray-800 p-2.5 rounded font-bold" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-emerald-600 p-2.5 rounded font-bold" }, "Ödemeyi Al"))))), /* @__PURE__ */ React.createElement(
      ReceiptPrint,
      {
        isOpen: !!productReceipt,
        data: productReceipt,
        onClose: () => setProductReceipt(null)
      }
    ));
  };

  // src/tabs/FinanceTab.jsx
  var { useState: useState9 } = React;
  var FinanceTab = ({
    transactions,
    expenses,
    setExpenses,
    sales,
    isSensitiveHidden,
    setIsSensitiveHidden,
    requestPinApproval,
    showNotification
  }) => {
    const [isOpenModal, setIsOpenModal] = useState9(false);
    const [category, setCategory] = useState9("Diğer");
    const [amount, setAmount] = useState9("");
    const [description, setDescription] = useState9("");
    const [deleteConfirm, setDeleteConfirm] = useState9({ isOpen: false, targetId: null });
    const washRevenue = transactions.filter((t) => t.status === "COMPLETED").reduce((sum, t) => sum + t.totalPrice, 0);
    const productRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalOutflow = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossInflow = washRevenue + productRevenue;
    const netProfit = grossInflow - totalOutflow;
    const handleAddExpense = (e) => {
      e.preventDefault();
      const parsedAmount = parsePositiveNumber(amount);
      if (!parsedAmount) {
        showNotification("Geçerli bir gider tutarı girin.", "error");
        return;
      }
      const newExpense = {
        id: generateUUID(),
        category,
        amount: parsedAmount,
        description,
        date: (/* @__PURE__ */ new Date()).toISOString()
      };
      setExpenses((prev) => [newExpense, ...prev]);
      showNotification("Gider kalemi muhasebeye işlendi.");
      setIsOpenModal(false);
      setAmount("");
      setDescription("");
    };
    const handleDeleteRequest = (id) => {
      requestPinApproval("Gider silmek için şifrenizi girin.", () => {
        setDeleteConfirm({ isOpen: true, targetId: id });
      });
    };
    const confirmDeleteExpense = () => {
      const id = deleteConfirm.targetId;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showNotification("Gider kalemi başarıyla silindi.", "warning");
      setDeleteConfirm({ isOpen: false, targetId: null });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 relative text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: deleteConfirm.isOpen,
        title: "Gider Kaydını Sil?",
        message: "Bu gider kalemi muhasebe kayıtlarından tamamen silinecektir. Emin misiniz?",
        onConfirm: confirmDeleteExpense,
        onCancel: () => setDeleteConfirm({ isOpen: false, targetId: null })
      }
    ), isSensitiveHidden && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-10 bg-darkBg-deep/45 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-darkBg-border" }, /* @__PURE__ */ React.createElement("span", { className: "text-brand-400 mb-3" }, /* @__PURE__ */ React.createElement(Icons.Shield, null)), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-white mb-1" }, "Finansal Veriler Kilitli"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mb-4 max-w-sm" }, "Gelir, gider ve kâr detaylarına ulaşmak için güvenlik PIN kodunuzu girmeniz gerekir."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          requestPinApproval("Finansal verilere erişmek için doğrulama yapın.", () => {
            setIsSensitiveHidden(false);
          });
        },
        className: "px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-xs transition"
      },
      "PIN Kodu ile Kilidi Aç"
    )), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Kasa & Giderler",
        description: "Hizmet cirolarını, market gelirlerini ve dükkan masraflarını izleyin.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setIsOpenModal(true),
            className: "px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Gider Fişi Ekle")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Toplam Gelir (Hizmet+Ürün)"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-emerald-400 tracking-tight" }, formatCurrency(grossInflow))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Toplam Gider / Çıkan Para"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-red-400 tracking-tight" }, formatCurrency(totalOutflow))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Net Kasa Durumu"), /* @__PURE__ */ React.createElement("span", { className: `text-2xl font-extrabold tracking-tight ${netProfit >= 0 ? "text-brand-400" : "text-red-400"}` }, formatCurrency(netProfit)))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white mb-4" }, "Gider / Ödeme Defteri"), expenses.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 py-6 text-center" }, "Herhangi bir dükkan masrafı kaydedilmemiş.") : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-xs text-gray-400" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Tarih"), /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Kategori"), /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Açıklama / Detay"), /* @__PURE__ */ React.createElement("th", { className: "p-3 text-right" }, "Tutar"), /* @__PURE__ */ React.createElement("th", { className: "p-3 text-center" }, "İşlem"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-darkBg-border" }, expenses.map((exp) => /* @__PURE__ */ React.createElement("tr", { key: exp.id, className: "hover:bg-darkBg-hover" }, /* @__PURE__ */ React.createElement("td", { className: "p-3" }, new Date(exp.date).toLocaleDateString("tr-TR")), /* @__PURE__ */ React.createElement("td", { className: "p-3" }, /* @__PURE__ */ React.createElement("span", { className: "bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold" }, exp.category)), /* @__PURE__ */ React.createElement("td", { className: "p-3 font-medium text-gray-200" }, exp.description || "Masraf kaydı"), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-right font-extrabold text-red-400" }, formatCurrency(exp.amount)), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleDeleteRequest(exp.id),
        className: "text-gray-500 hover:text-red-400 transition",
        title: "Gider Kalemini Sil"
      },
      /* @__PURE__ */ React.createElement(Icons.Trash, null)
    )))))))), isOpenModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Gider Fişi Kaydı"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleAddExpense, className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Gider Kategorisi *"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: category,
        onChange: (e) => setCategory(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
      },
      /* @__PURE__ */ React.createElement("option", { value: "Kira" }, "Kira Ödemesi"),
      /* @__PURE__ */ React.createElement("option", { value: "Fatura" }, "Su, Elektrik, İnternet Faturası"),
      /* @__PURE__ */ React.createElement("option", { value: "Malzeme Alımı" }, "Malzeme & Kimyasal Alımı"),
      /* @__PURE__ */ React.createElement("option", { value: "Personel" }, "Personel Maaş & Prim"),
      /* @__PURE__ */ React.createElement("option", { value: "Diğer" }, "Diğer Masraflar")
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Gider Tutarı (₺) *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        required: true,
        value: amount,
        onChange: (e) => setAmount(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white font-bold"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Açıklama / Masraf Nedeni *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: description,
        onChange: (e) => setDescription(e.target.value),
        placeholder: "Elektrik fatura bedeli",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenModal(false), className: "flex-1 bg-gray-800 p-2.5 rounded font-bold" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-red-600 p-2.5 rounded font-bold" }, "Gider Kaydet"))))));
  };

  // src/tabs/IncomeTab.jsx
  var { useState: useState10, useMemo: useMemo4 } = React;
  var FILTERS = [
    { id: "all", label: "Tümü" },
    { id: "service", label: "Hizmet" },
    { id: "product", label: "Ürün" }
  ];
  var RANGE_OPTIONS = [
    { id: "today", label: "Bugün" },
    { id: "7d", label: "Son 7 Gün" },
    { id: "30d", label: "Son 30 Gün" },
    { id: "all", label: "Tümü" }
  ];
  var startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  var isWithinRange = (dateStr, rangeId) => {
    if (rangeId === "all") return true;
    const d = new Date(dateStr);
    const today = startOfDay(/* @__PURE__ */ new Date());
    if (rangeId === "today") return startOfDay(d).getTime() === today.getTime();
    const days = rangeId === "7d" ? 7 : 30;
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() - (days - 1));
    return d >= threshold;
  };
  var escapeCsv = (value) => {
    const str = String(value != null ? value : "");
    if (/[",;\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  var IncomeTab = ({
    transactions,
    setTransactions,
    sales,
    setSales,
    products,
    setProducts,
    customers,
    services,
    isSensitiveHidden,
    setIsSensitiveHidden,
    requestPinApproval,
    showNotification
  }) => {
    const [typeFilter, setTypeFilter] = useState10("all");
    const [rangeFilter, setRangeFilter] = useState10("30d");
    const [search, setSearch] = useState10("");
    const [paymentFilter, setPaymentFilter] = useState10("all");
    const [deleteConfirm, setDeleteConfirm] = useState10({ isOpen: false, row: null });
    const customerMap = useMemo4(() => {
      const map = /* @__PURE__ */ new Map();
      customers.forEach((c) => map.set(c.id, c));
      return map;
    }, [customers]);
    const serviceMap = useMemo4(() => {
      const map = /* @__PURE__ */ new Map();
      services.forEach((s) => map.set(s.id, s));
      return map;
    }, [services]);
    const productMap = useMemo4(() => {
      const map = /* @__PURE__ */ new Map();
      products.forEach((p) => map.set(p.id, p));
      return map;
    }, [products]);
    const incomeRows = useMemo4(() => {
      const serviceRows = transactions.filter((t) => t.status === "COMPLETED").map((t) => {
        const cust = customerMap.get(t.customerId);
        const snap = t.customerSnapshot;
        const serviceNames = (t.serviceIds || []).map((id) => {
          var _a;
          return (_a = serviceMap.get(id)) == null ? void 0 : _a.name;
        }).filter(Boolean).join(", ");
        return {
          id: `tx-${t.id}`,
          rawId: t.id,
          kind: "service",
          date: t.date,
          amount: t.totalPrice || 0,
          discount: t.discountAmount || 0,
          title: serviceNames || "Hizmet",
          plate: (cust == null ? void 0 : cust.plate) || (snap == null ? void 0 : snap.plate) || "",
          customerName: (cust == null ? void 0 : cust.name) || (snap == null ? void 0 : snap.name) || (t.customerId === "ANONIM_MUSTERI" ? "Anonim Müşteri" : "Misafir"),
          isLoyaltyReward: !!t.isLoyaltyReward,
          paymentMethod: t.isLoyaltyReward ? "reward" : t.paymentMethod || "cash",
          note: t.notes || ""
        };
      });
      const productRows = sales.map((s) => {
        var _a;
        const cust = customerMap.get(s.customerId);
        const snap = s.customerSnapshot;
        const prod = productMap.get(s.productId);
        const productName = (prod == null ? void 0 : prod.name) || ((_a = s.productSnapshot) == null ? void 0 : _a.name) || "Ürün";
        return {
          id: `sl-${s.id}`,
          rawId: s.id,
          productId: s.productId,
          quantity: s.quantity,
          kind: "product",
          date: s.date,
          amount: s.totalPrice || 0,
          discount: 0,
          title: `${productName} × ${s.quantity}`,
          plate: (cust == null ? void 0 : cust.plate) || (snap == null ? void 0 : snap.plate) || "",
          customerName: (cust == null ? void 0 : cust.name) || (snap == null ? void 0 : snap.name) || (s.customerId === "ANONIM_MUSTERI" ? "Anonim Müşteri" : "Cari Müşteri"),
          isLoyaltyReward: false,
          paymentMethod: s.paymentMethod || "cash",
          note: ""
        };
      });
      return [...serviceRows, ...productRows].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, sales, customerMap, serviceMap, productMap]);
    const filteredRows = useMemo4(() => {
      const term = search.trim().toLocaleLowerCase("tr-TR");
      return incomeRows.filter((row) => {
        if (typeFilter !== "all" && row.kind !== typeFilter) return false;
        if (!isWithinRange(row.date, rangeFilter)) return false;
        if (paymentFilter !== "all" && row.paymentMethod !== paymentFilter) return false;
        if (term) {
          const haystack = `${row.plate} ${row.customerName} ${row.title}`.toLocaleLowerCase("tr-TR");
          if (!haystack.includes(term)) return false;
        }
        return true;
      });
    }, [incomeRows, typeFilter, rangeFilter, search, paymentFilter]);
    const summary = useMemo4(() => {
      const result = {
        total: 0,
        service: 0,
        product: 0,
        count: filteredRows.length,
        loyaltyCount: 0,
        byPayment: { cash: 0, card: 0, transfer: 0, unpaid: 0, reward: 0 }
      };
      filteredRows.forEach((row) => {
        result.total += row.amount;
        if (row.kind === "service") result.service += row.amount;
        if (row.kind === "product") result.product += row.amount;
        if (row.isLoyaltyReward) result.loyaltyCount += 1;
        if (result.byPayment[row.paymentMethod] !== void 0) {
          result.byPayment[row.paymentMethod] += row.amount;
        }
      });
      return result;
    }, [filteredRows]);
    const requestDelete = (row) => {
      requestPinApproval(
        row.kind === "service" ? "Hizmet gelir kaydını silmek için PIN doğrulayın." : "Ürün satışını silmek için PIN doğrulayın.",
        () => setDeleteConfirm({ isOpen: true, row })
      );
    };
    const confirmDelete = () => {
      const row = deleteConfirm.row;
      if (!row) return;
      if (row.kind === "service") {
        setTransactions((prev) => prev.filter((t) => t.id !== row.rawId));
        showNotification("Hizmet gelir kaydı silindi.", "warning");
      } else {
        setSales((prev) => prev.filter((s) => s.id !== row.rawId));
        setProducts((prev) => prev.map(
          (p) => p.id === row.productId ? { ...p, stock: (p.stock || 0) + (row.quantity || 0) } : p
        ));
        showNotification("Ürün satışı silindi, stok iade edildi.", "warning");
      }
      setDeleteConfirm({ isOpen: false, row: null });
    };
    const handleExportCsv = () => {
      if (filteredRows.length === 0) {
        showNotification("Dışa aktarılacak gelir kaydı yok.", "error");
        return;
      }
      const header = ["Tarih", "Tip", "Plaka", "Müşteri", "Açıklama", "İndirim", "Tutar", "Ödeme"];
      const lines = [header.join(";")];
      filteredRows.forEach((row) => {
        lines.push([
          new Date(row.date).toLocaleString("tr-TR"),
          row.kind === "service" ? "Hizmet" : "Ürün",
          row.plate,
          row.customerName,
          row.isLoyaltyReward ? `${row.title} (Sadakat Ödülü)` : row.title,
          row.discount ? row.discount.toFixed(2) : "0.00",
          row.amount.toFixed(2),
          getPaymentLabel(row.paymentMethod)
        ].map(escapeCsv).join(";"));
      });
      const csv = "\uFEFF" + lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      a.href = url;
      a.download = `gelir-kayitlari-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Gelir kayıtları CSV olarak indirildi.");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 relative text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: deleteConfirm.isOpen,
        title: "Gelir Kaydını Sil?",
        message: "Bu kayıt finans raporlarından kalıcı olarak çıkarılır. Ürün satışıysa ilgili stok geri eklenir.",
        onConfirm: confirmDelete,
        onCancel: () => setDeleteConfirm({ isOpen: false, row: null })
      }
    ), isSensitiveHidden && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-10 bg-darkBg-deep/45 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-darkBg-border" }, /* @__PURE__ */ React.createElement("span", { className: "text-brand-400 mb-3" }, /* @__PURE__ */ React.createElement(Icons.Shield, null)), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-white mb-1" }, "Gelir Kayıtları Kilitli"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mb-4 max-w-sm" }, "Tüm gelir hareketlerini görmek için güvenlik PIN kodunuzu girin."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          requestPinApproval("Gelir kayıtlarına erişmek için doğrulama yapın.", () => {
            setIsSensitiveHidden(false);
          });
        },
        className: "px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-xs transition"
      },
      "PIN Kodu ile Kilidi Aç"
    )), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Gelir Kayıtları",
        description: "Tamamlanan tüm hizmet ve ürün satışlarından gelen gelir hareketleri.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: handleExportCsv,
            className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Download, null),
          /* @__PURE__ */ React.createElement("span", null, "CSV İndir")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Toplam Gelir"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-emerald-400 tracking-tight" }, formatCurrency(summary.total))), /* @__PURE__ */ React.createElement("span", { className: "p-3 bg-emerald-500/10 text-emerald-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.TrendingUp, null))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Hizmet Geliri"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-brand-400 tracking-tight" }, formatCurrency(summary.service))), /* @__PURE__ */ React.createElement("span", { className: "p-3 bg-brand-500/10 text-brand-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Car, null))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Ürün Geliri"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-amber-400 tracking-tight" }, formatCurrency(summary.product))), /* @__PURE__ */ React.createElement("span", { className: "p-3 bg-amber-500/10 text-amber-400 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Package, null))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl shadow flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block font-medium" }, "Kayıt Adedi"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-extrabold text-white tracking-tight" }, summary.count), summary.loyaltyCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-emerald-400 block mt-1" }, summary.loyaltyCount, " sadakat ödülü dahil")), /* @__PURE__ */ React.createElement("span", { className: "p-3 bg-white/5 text-gray-300 rounded-lg" }, /* @__PURE__ */ React.createElement(Icons.Clipboard, null)))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, FILTERS.map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.id,
        type: "button",
        onClick: () => setTypeFilter(opt.id),
        className: `px-3 py-1.5 rounded-lg text-xs font-bold border transition ${typeFilter === opt.id ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-brand-500/60"}`
      },
      opt.label
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, RANGE_OPTIONS.map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.id,
        type: "button",
        onClick: () => setRangeFilter(opt.id),
        className: `px-3 py-1.5 rounded-lg text-xs font-bold border transition ${rangeFilter === opt.id ? "bg-emerald-600 border-emerald-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white hover:border-emerald-500/60"}`
      },
      opt.label
    )))), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" }, /* @__PURE__ */ React.createElement(Icons.Search, null)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: search,
        onChange: (e) => setSearch(e.target.value),
        placeholder: "Plaka, müşteri adı veya hizmet ara...",
        className: "w-full bg-darkBg-deep border border-darkBg-border pl-10 pr-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-white"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-bold uppercase" }, "Ödeme"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setPaymentFilter("all"),
        className: `px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${paymentFilter === "all" ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white"}`
      },
      "Tümü"
    ), PAYMENT_METHODS.map((p) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: p.id,
        type: "button",
        onClick: () => setPaymentFilter(p.id),
        className: `px-2.5 py-1 rounded-md text-[10px] font-bold border transition flex items-center gap-1 ${paymentFilter === p.id ? "bg-brand-600 border-brand-500 text-white" : "bg-darkBg-deep border-darkBg-border text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, p.icon),
      /* @__PURE__ */ React.createElement("span", null, p.label),
      /* @__PURE__ */ React.createElement("span", { className: "opacity-60 ml-1" }, summary.byPayment[p.id] > 0 ? formatCurrency(summary.byPayment[p.id]) : "")
    ))), filteredRows.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 py-10 text-center" }, "Seçili filtrelerle eşleşen gelir kaydı yok.") : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-xs text-gray-400" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Tarih"), /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Tip"), /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Plaka / Müşteri"), /* @__PURE__ */ React.createElement("th", { className: "p-3" }, "Açıklama"), /* @__PURE__ */ React.createElement("th", { className: "p-3 text-right" }, "İndirim"), /* @__PURE__ */ React.createElement("th", { className: "p-3 text-right" }, "Tutar"), /* @__PURE__ */ React.createElement("th", { className: "p-3 text-center" }, "Ödeme"), /* @__PURE__ */ React.createElement("th", { className: "p-3 text-center" }, "İşlem"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-darkBg-border" }, filteredRows.map((row) => {
      var _a;
      return /* @__PURE__ */ React.createElement("tr", { key: row.id, className: "hover:bg-darkBg-hover" }, /* @__PURE__ */ React.createElement("td", { className: "p-3 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("span", { className: "block text-gray-200 font-semibold" }, new Date(row.date).toLocaleDateString("tr-TR")), /* @__PURE__ */ React.createElement("span", { className: "block text-[10px] text-gray-500" }, new Date(row.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }))), /* @__PURE__ */ React.createElement("td", { className: "p-3" }, row.kind === "service" ? /* @__PURE__ */ React.createElement("span", { className: "bg-brand-500/15 text-brand-300 px-2 py-0.5 rounded text-[10px] font-bold" }, "Hizmet") : /* @__PURE__ */ React.createElement("span", { className: "bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold" }, "Ürün"), row.isLoyaltyReward && /* @__PURE__ */ React.createElement("span", { className: "ml-1 bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold" }, "Ödül")), /* @__PURE__ */ React.createElement("td", { className: "p-3" }, row.plate && /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded mr-2 uppercase tracking-wider" }, row.plate), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-medium" }, row.customerName)), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-gray-300" }, row.title), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-right" }, row.discount > 0 ? /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-semibold" }, "- ", formatCurrency(row.discount)) : /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "—")), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-right" }, /* @__PURE__ */ React.createElement("span", { className: `font-extrabold ${row.amount === 0 ? "text-gray-400" : "text-emerald-400"}` }, formatCurrency(row.amount))), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-darkBg-deep border border-darkBg-border text-gray-300 px-2 py-0.5 rounded font-bold" }, row.paymentMethod === "reward" ? "🎁 Ödül" : `${((_a = PAYMENT_METHODS.find((p) => p.id === row.paymentMethod)) == null ? void 0 : _a.icon) || ""} ${getPaymentLabel(row.paymentMethod)}`)), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-center" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => requestDelete(row),
          className: "text-gray-500 hover:text-red-400 transition",
          title: "Gelir kaydını sil"
        },
        /* @__PURE__ */ React.createElement(Icons.Trash, null)
      )));
    })), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-darkBg-deep border-t border-darkBg-border" }, /* @__PURE__ */ React.createElement("td", { className: "p-3 font-bold text-white", colSpan: 5 }, "Filtrelenmiş Toplam (", summary.count, " kayıt)"), /* @__PURE__ */ React.createElement("td", { className: "p-3 text-right font-extrabold text-emerald-400 text-sm" }, formatCurrency(summary.total)), /* @__PURE__ */ React.createElement("td", { className: "p-3" }), /* @__PURE__ */ React.createElement("td", { className: "p-3" })))))));
  };

  // src/tabs/CampaignsTab.jsx
  var { useState: useState11, useMemo: useMemo5 } = React;
  var toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  var fromLocalInput = (value, fallback) => {
    if (!value) return fallback;
    const d = /* @__PURE__ */ new Date(value + "T00:00:00");
    return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
  };
  var todayInput = () => {
    const d = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  var addDaysInput = (days, fromInput) => {
    const base = fromInput ? /* @__PURE__ */ new Date(fromInput + "T00:00:00") : /* @__PURE__ */ new Date();
    if (Number.isNaN(base.getTime())) return todayInput();
    base.setDate(base.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
  };
  var daysBetween = (startInput, endInput) => {
    if (!startInput || !endInput) return null;
    const a = (/* @__PURE__ */ new Date(startInput + "T00:00:00")).getTime();
    const b = (/* @__PURE__ */ new Date(endInput + "T00:00:00")).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return Math.round((b - a) / (1e3 * 60 * 60 * 24));
  };
  var isExpired = (camp) => {
    if (!camp.endDate) return false;
    return new Date(camp.endDate).getTime() < Date.now();
  };
  var DURATION_PRESETS = [
    { id: 7, label: "7 Gün" },
    { id: 15, label: "15 Gün" },
    { id: 30, label: "30 Gün" },
    { id: 90, label: "3 Ay" }
  ];
  var CampaignsTab = ({
    campaigns,
    setCampaigns,
    services,
    showNotification
  }) => {
    const [isOpenModal, setIsOpenModal] = useState11(false);
    const [editId, setEditId] = useState11("");
    const [name, setName] = useState11("");
    const [type, setType] = useState11("PERCENTAGE");
    const [value, setValue] = useState11(10);
    const [vehicleClasses, setVehicleClasses] = useState11([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState11([]);
    const [startDate, setStartDate] = useState11(todayInput());
    const [endDate, setEndDate] = useState11(addDaysInput(15));
    const [openEnded, setOpenEnded] = useState11(false);
    const [minSpend, setMinSpend] = useState11(0);
    const [formError, setFormError] = useState11("");
    const [deleteConfirm, setDeleteConfirm] = useState11({ isOpen: false, targetId: null });
    const resetForm = () => {
      setEditId("");
      setName("");
      setType("PERCENTAGE");
      setValue(10);
      setVehicleClasses([]);
      setSelectedServiceIds([]);
      setStartDate(todayInput());
      setEndDate(addDaysInput(15));
      setOpenEnded(false);
      setMinSpend(0);
      setFormError("");
    };
    const closeModal = () => {
      setIsOpenModal(false);
      resetForm();
    };
    const openNew = () => {
      resetForm();
      setIsOpenModal(true);
    };
    const openEdit = (camp) => {
      setEditId(camp.id);
      setName(camp.name || "");
      setType(camp.type || "PERCENTAGE");
      setValue(camp.value || 0);
      setVehicleClasses(Array.isArray(camp.applicableVehicleTypes) ? [...camp.applicableVehicleTypes] : []);
      setSelectedServiceIds(Array.isArray(camp.applicableServices) ? [...camp.applicableServices] : []);
      setStartDate(toLocalInput(camp.startDate) || todayInput());
      setEndDate(toLocalInput(camp.endDate) || addDaysInput(15));
      setOpenEnded(!camp.endDate);
      setMinSpend(camp.minSpend || 0);
      setFormError("");
      setIsOpenModal(true);
    };
    const toggleVehicle = (id) => {
      setVehicleClasses((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
    };
    const toggleService = (id) => {
      setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    };
    const applyDurationPreset = (days) => {
      setOpenEnded(false);
      setEndDate(addDaysInput(days, startDate));
    };
    const handleSubmit = (e) => {
      e.preventDefault();
      setFormError("");
      if (!name.trim()) {
        setFormError("Kampanya adı zorunludur.");
        showNotification("Kampanya adı zorunludur.", "error");
        return;
      }
      const numericValue = parsePositiveNumber(value);
      if (numericValue <= 0) {
        setFormError("İndirim değeri sıfırdan büyük olmalıdır.");
        showNotification("İndirim değeri sıfırdan büyük olmalıdır.", "error");
        return;
      }
      if (type === "PERCENTAGE" && numericValue > 90) {
        setFormError("Yüzde indirimi en fazla 90 olabilir.");
        showNotification("Yüzde indirimi en fazla 90 olabilir.", "error");
        return;
      }
      const startIso = fromLocalInput(startDate, (/* @__PURE__ */ new Date()).toISOString());
      const endIso = openEnded ? null : fromLocalInput(endDate, new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString());
      if (endIso && new Date(endIso).getTime() < new Date(startIso).getTime()) {
        setFormError("Bitiş tarihi başlangıçtan önce olamaz.");
        showNotification("Bitiş tarihi başlangıçtan önce olamaz.", "error");
        return;
      }
      const payload = {
        name: name.trim(),
        type,
        value: numericValue,
        startDate: startIso,
        endDate: endIso,
        isActive: true,
        applicableServices: selectedServiceIds,
        applicableVehicleTypes: vehicleClasses,
        minSpend: parsePositiveNumber(minSpend)
      };
      if (editId) {
        setCampaigns((prev) => prev.map((c) => c.id === editId ? { ...c, ...payload } : c));
        showNotification("Kampanya güncellendi.");
      } else {
        setCampaigns((prev) => [{ id: generateUUID(), ...payload }, ...prev]);
        showNotification("Yeni kampanya aktif edildi.");
      }
      closeModal();
    };
    const toggleActive = (camp) => {
      setCampaigns((prev) => prev.map((c) => c.id === camp.id ? { ...c, isActive: !c.isActive } : c));
      showNotification(camp.isActive ? "Kampanya durduruldu." : "Kampanya yeniden aktif edildi.");
    };
    const requestDelete = (id) => setDeleteConfirm({ isOpen: true, targetId: id });
    const confirmDelete = () => {
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteConfirm.targetId));
      setDeleteConfirm({ isOpen: false, targetId: null });
      showNotification("Kampanya silindi.", "warning");
    };
    const previewVehicleLabels = useMemo5(() => {
      if (vehicleClasses.length === 0) return "Tüm Araçlar";
      return vehicleClasses.map((id) => {
        var _a;
        return ((_a = VEHICLE_TYPES.find((v) => v.id === id)) == null ? void 0 : _a.label) || id;
      }).join(", ");
    }, [vehicleClasses]);
    const previewServiceLabels = useMemo5(() => {
      var _a;
      if (selectedServiceIds.length === 0) return "Tüm Hizmetler";
      if (selectedServiceIds.length === 1) {
        return ((_a = services.find((s) => s.id === selectedServiceIds[0])) == null ? void 0 : _a.name) || "Hizmet";
      }
      return `${selectedServiceIds.length} hizmet seçildi`;
    }, [selectedServiceIds, services]);
    const durationDays = useMemo5(() => {
      if (openEnded) return null;
      return daysBetween(startDate, endDate);
    }, [openEnded, startDate, endDate]);
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: deleteConfirm.isOpen,
        title: "Kampanyayı Sil?",
        message: "Bu kampanya kalıcı olarak kaldırılır. Geçmiş satışlardaki uygulanmış indirimler etkilenmez.",
        onConfirm: confirmDelete,
        onCancel: () => setDeleteConfirm({ isOpen: false, targetId: null })
      }
    ), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "İndirim & Kampanyalar",
        description: "Satışlarda otomatik uygulanan sepet ve araç sınıfı indirimlerini belirleyin.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: openNew,
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Yeni Kampanya Kur")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, campaigns.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-10 col-span-2" }, "Kayıtlı aktif kampanya bulunmuyor.") : campaigns.map((camp) => {
      var _a;
      const vehicleLabels = camp.applicableVehicleTypes && camp.applicableVehicleTypes.length > 0 ? camp.applicableVehicleTypes.map((id) => {
        var _a2;
        return ((_a2 = VEHICLE_TYPES.find((v) => v.id === id)) == null ? void 0 : _a2.label) || id;
      }).join(", ") : "Tümü";
      const serviceLabel = camp.applicableServices && camp.applicableServices.length > 0 ? camp.applicableServices.length === 1 ? ((_a = services.find((s) => s.id === camp.applicableServices[0])) == null ? void 0 : _a.name) || "Belirsiz Hizmet" : `${camp.applicableServices.length} hizmet` : "Tüm Hizmetler";
      const expired = isExpired(camp);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: camp.id,
          className: `bg-darkBg-card border rounded-xl p-5 shadow space-y-3 transition ${expired ? "border-red-500/30 opacity-70" : camp.isActive ? "border-darkBg-border" : "border-dashed border-amber-500/30 opacity-70"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React.createElement("div", { className: "text-left space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-extrabold" }, camp.type === "PERCENTAGE" ? `% ${camp.value} İNDİRİM` : `${camp.value} ₺ İNDİRİM`), expired ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded font-extrabold" }, "SÜRESİ DOLDU") : camp.isActive ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-extrabold" }, "AKTİF") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-extrabold" }, "DURDURULDU")), /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-bold text-white" }, camp.name), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400 space-y-0.5" }, /* @__PURE__ */ React.createElement("p", null, "Araç: ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, vehicleLabels)), /* @__PURE__ */ React.createElement("p", null, "Hizmet: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, serviceLabel)), /* @__PURE__ */ React.createElement("p", null, "Tarih: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, toLocalInput(camp.startDate) || "—"), " → ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, camp.endDate ? toLocalInput(camp.endDate) : "Süresiz")), camp.minSpend > 0 && /* @__PURE__ */ React.createElement("p", null, "Min. Sepet: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, formatCurrency(camp.minSpend)))))),
        /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-2 flex flex-wrap gap-2 text-[10px]" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => openEdit(camp),
            className: "flex-1 bg-brand-900/20 text-brand-400 hover:bg-brand-600 hover:text-white py-1.5 rounded font-bold transition"
          },
          "Düzenle"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => toggleActive(camp),
            className: `flex-1 py-1.5 rounded font-bold transition ${camp.isActive ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"}`
          },
          camp.isActive ? "Durdur" : "Aktifleştir"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => requestDelete(camp.id),
            className: "p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition",
            title: "Kampanyayı Sil"
          },
          /* @__PURE__ */ React.createElement(Icons.Trash, null)
        ))
      );
    })), isOpenModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-2xl bg-darkBg-card border border-darkBg-border rounded-xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-darkBg-border flex items-start justify-between gap-4 bg-gradient-to-r from-brand-900/30 via-darkBg-card to-darkBg-card" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-lg bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icons.Percent, null)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white truncate" }, editId ? "Kampanyayı Düzenle" : "İndirim Kampanyası Tanımla"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400 mt-0.5" }, "Satışta otomatik uygulanacak indirim kuralını adım adım yapılandırın."))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: closeModal,
        className: "text-gray-400 hover:text-white shrink-0 p-1 rounded hover:bg-darkBg-hover transition",
        "aria-label": "Kapat"
      },
      /* @__PURE__ */ React.createElement(Icons.X, null)
    )), /* @__PURE__ */ React.createElement(
      "form",
      {
        id: "campaign-form",
        onSubmit: handleSubmit,
        className: "flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs"
      },
      /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }), /* @__PURE__ */ React.createElement("span", null, "Temel Bilgi")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Kampanya Adı *"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          required: true,
          value: name,
          onChange: (e) => setName(e.target.value),
          placeholder: "Örn: Hafta İçi Sedan İndirimi",
          className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
        }
      ))),
      /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }), /* @__PURE__ */ React.createElement("span", null, "İndirim Yapısı")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setType("PERCENTAGE"),
          className: `p-3 rounded-lg border text-left transition ${type === "PERCENTAGE" ? "border-brand-500 bg-brand-500/10 text-white" : "border-darkBg-border bg-darkBg-deep text-gray-300 hover:border-brand-500/40"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: `w-7 h-7 rounded flex items-center justify-center ${type === "PERCENTAGE" ? "bg-brand-500/20 text-brand-300" : "bg-darkBg-card text-gray-400"}` }, /* @__PURE__ */ React.createElement(Icons.Percent, null)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-xs" }, "Yüzde (%)"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400" }, "Sepet üzerinden oransal")))
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setType("FIXED"),
          className: `p-3 rounded-lg border text-left transition ${type === "FIXED" ? "border-brand-500 bg-brand-500/10 text-white" : "border-darkBg-border bg-darkBg-deep text-gray-300 hover:border-brand-500/40"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: `w-7 h-7 rounded flex items-center justify-center ${type === "FIXED" ? "bg-brand-500/20 text-brand-300" : "bg-darkBg-card text-gray-400"}` }, /* @__PURE__ */ React.createElement(Icons.Wallet, null)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-xs" }, "Sabit Tutar (₺)"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400" }, "Fişten doğrudan düşer")))
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "İndirim Değeri *"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          required: true,
          min: 0,
          step: type === "PERCENTAGE" ? "1" : "5",
          value,
          onChange: (e) => setValue(e.target.value),
          className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 pr-10 rounded text-white focus:outline-none focus:border-brand-500"
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none" }, type === "PERCENTAGE" ? "%" : "₺")))),
      /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }), /* @__PURE__ */ React.createElement("span", null, "Geçerlilik")), /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer select-none" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: openEnded,
          onChange: (e) => setOpenEnded(e.target.checked),
          className: "accent-brand-500"
        }
      ), /* @__PURE__ */ React.createElement("span", null, "Süresiz"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Başlangıç"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          value: startDate,
          onChange: (e) => setStartDate(e.target.value),
          className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Bitiş"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          value: endDate,
          onChange: (e) => setEndDate(e.target.value),
          disabled: openEnded,
          className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 pt-1" }, DURATION_PRESETS.map((preset) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: preset.id,
          type: "button",
          onClick: () => applyDurationPreset(preset.id),
          disabled: openEnded,
          className: "px-2.5 py-1 text-[10px] rounded border border-darkBg-border bg-darkBg-deep text-gray-300 hover:border-brand-500/60 hover:text-brand-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
        },
        "+",
        preset.label
      )), durationDays !== null && durationDays >= 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-[10px] text-gray-500 self-center" }, "Süre: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-bold" }, durationDays, " gün")))),
      /* @__PURE__ */ React.createElement("section", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }), /* @__PURE__ */ React.createElement("span", null, "Kapsam")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Araç Sınıfları"), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setVehicleClasses([]),
          className: "text-[10px] text-gray-500 hover:text-brand-300 transition"
        },
        "Tümünü temizle"
      )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, VEHICLE_TYPES.map((t) => {
        const active = vehicleClasses.includes(t.id);
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: t.id,
            type: "button",
            onClick: () => toggleVehicle(t.id),
            className: `px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 ${active ? "bg-brand-500/20 text-brand-200 border-brand-500" : "bg-darkBg-deep text-gray-300 border-darkBg-border hover:border-brand-500/40"}`
          },
          active && /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 inline-flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Icons.Check, null)),
          /* @__PURE__ */ React.createElement("span", null, t.label)
        );
      })), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "Boş bırakılırsa tüm araç sınıfları için geçerli olur.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Hizmetler"), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setSelectedServiceIds([]),
          className: "text-[10px] text-gray-500 hover:text-brand-300 transition"
        },
        "Tümünü temizle"
      )), services.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500 italic bg-darkBg-deep border border-darkBg-border rounded p-2" }, "Henüz tanımlı hizmet yok. Kampanya tüm hizmetlere uygulanır.") : /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 -m-1" }, services.map((s) => {
        const active = selectedServiceIds.includes(s.id);
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: s.id,
            type: "button",
            onClick: () => toggleService(s.id),
            className: `px-2.5 py-1.5 rounded text-[11px] font-bold border transition ${active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/60" : "bg-darkBg-deep text-gray-300 border-darkBg-border hover:border-emerald-500/40"}`
          },
          s.name
        );
      })), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "Boş bırakılırsa kampanya tüm hizmetlerde geçerli olur."))),
      /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }), /* @__PURE__ */ React.createElement("span", null, "Koşul")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Min. Sepet Tutarı"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: 0,
          step: "10",
          value: minSpend,
          onChange: (e) => setMinSpend(e.target.value),
          className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 pr-10 rounded text-white focus:outline-none focus:border-brand-500"
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none" }, "₺")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "0 ise asgari sepet koşulu uygulanmaz."))),
      /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-300 font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-400" }), /* @__PURE__ */ React.createElement("span", null, "Önizleme")), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-deep border border-darkBg-border rounded-lg p-3 space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-extrabold" }, type === "PERCENTAGE" ? `% ${parsePositiveNumber(value)} İNDİRİM` : `${parsePositiveNumber(value)} ₺ İNDİRİM`), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-extrabold" }, "AKTİF")), /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-bold text-white" }, name.trim() || "Kampanya Adı"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400 space-y-0.5" }, /* @__PURE__ */ React.createElement("p", null, "Araç: ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, previewVehicleLabels)), /* @__PURE__ */ React.createElement("p", null, "Hizmet: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, previewServiceLabels)), /* @__PURE__ */ React.createElement("p", null, "Tarih: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, startDate || "—"), " → ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, openEnded ? "Süresiz" : endDate || "—")), parsePositiveNumber(minSpend) > 0 && /* @__PURE__ */ React.createElement("p", null, "Min. Sepet: ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, formatCurrency(parsePositiveNumber(minSpend))))))),
      formError && /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]" }, /* @__PURE__ */ React.createElement("span", { className: "shrink-0 mt-0.5" }, /* @__PURE__ */ React.createElement(Icons.AlertTriangle, null)), /* @__PURE__ */ React.createElement("span", null, formError))
    ), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-3 border-t border-darkBg-border bg-darkBg-card flex gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: closeModal,
        className: "flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition text-xs"
      },
      "Vazgeç"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        form: "campaign-form",
        className: "flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition text-xs flex items-center justify-center gap-2"
      },
      /* @__PURE__ */ React.createElement(Icons.Check, null),
      /* @__PURE__ */ React.createElement("span", null, editId ? "Güncelle" : "Aktif Et")
    )))));
  };

  // src/tabs/BackupTab.jsx
  var { useEffect: useEffect4, useState: useState12 } = React;
  var BackupTab = ({
    users,
    customers,
    services,
    transactions,
    appointments,
    expenses,
    products,
    sales,
    campaigns,
    setUsers,
    setCustomers,
    setServices,
    setTransactions,
    setAppointments,
    setExpenses,
    setProducts,
    setSales,
    setCampaigns,
    settings,
    setSettings,
    showNotification
  }) => {
    var _a;
    const [pinSetting, setPinSetting] = useState12(((_a = users[0]) == null ? void 0 : _a.pinCode) || "1234");
    const [targetVisits, setTargetVisits] = useState12(settings.loyalty_target_visits || 5);
    const [idleTime, setIdleTime] = useState12(settings.idle_lock_time || 60);
    const [pinSecurityEnabled, setPinSecurityEnabled] = useState12(
      settings.pin_security_enabled !== false
    );
    const [resetConfirm, setResetConfirm] = useState12(false);
    useEffect4(() => {
      var _a2;
      setPinSetting(((_a2 = users[0]) == null ? void 0 : _a2.pinCode) || "1234");
    }, [users]);
    useEffect4(() => {
      setTargetVisits(settings.loyalty_target_visits || DEFAULT_SETTINGS.loyalty_target_visits);
      setIdleTime(settings.idle_lock_time || DEFAULT_SETTINGS.idle_lock_time);
      setPinSecurityEnabled(settings.pin_security_enabled !== false);
    }, [settings]);
    const applyDatabaseState = (data) => {
      persistDatabaseObject(data);
      setUsers(data.users);
      setCustomers(data.customers);
      setServices(data.services);
      setTransactions(data.transactions);
      setAppointments(data.appointments);
      setExpenses(data.expenses);
      setProducts(data.products);
      setSales(data.sales);
      setCampaigns(data.campaigns);
      setSettings(data.settings);
    };
    const saveSettings = (e) => {
      e.preventDefault();
      const cleanPin = pinSetting.replace(/\D/g, "");
      const parsedTargetVisits = Math.max(1, parsePositiveInteger(targetVisits, DEFAULT_SETTINGS.loyalty_target_visits));
      const parsedIdleTime = Math.max(15, parsePositiveInteger(idleTime, DEFAULT_SETTINGS.idle_lock_time));
      if (cleanPin.length !== 4) {
        showNotification("PIN kodu 4 haneli olmalıdır.", "error");
        return;
      }
      setUsers((prev) => prev.map((u) => u.id === "admin-1" ? { ...u, pinCode: cleanPin } : u));
      setSettings((prev) => ({
        ...DEFAULT_SETTINGS,
        ...prev,
        loyalty_target_visits: parsedTargetVisits,
        idle_lock_time: parsedIdleTime,
        pin_security_enabled: pinSecurityEnabled
      }));
      showNotification("Sistem ayarları başarıyla güncellendi.");
    };
    const handleExportBackup = () => {
      const fullDbObject = {
        users,
        customers,
        services,
        transactions,
        appointments,
        expenses,
        products,
        sales,
        campaigns,
        settings
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDbObject, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `otoyikama_yedek_${dateStamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification("Veritabanı yedeği dışa aktarıldı!");
    };
    const handleImportBackup = (e) => {
      const fileReader = new FileReader();
      const file = e.target.files[0];
      if (!file) return;
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          const knownKeys = ["users", "customers", "services", "transactions", "appointments", "expenses", "products", "sales", "campaigns", "settings"];
          const hasKnownKey = parsedData && typeof parsedData === "object" && knownKeys.some((k) => hasOwn(parsedData, k));
          if (!hasKnownKey) {
            showNotification("Hata: Geçersiz yedek dosyası şeması!", "error");
            return;
          }
          applyDatabaseState(normalizeBackupData(parsedData));
          showNotification("Tüm yedekler geri yüklendi!");
        } catch (err) {
          showNotification("Dosya okuma/çözümleme hatası!", "error");
        }
      };
      fileReader.readAsText(file);
    };
    const clearDatabaseCompletely = () => {
      applyDatabaseState(createCleanDatabase());
      setResetConfirm(false);
      showNotification("Tüm işlem verileri silindi. Sistem temiz başlangıç durumuna alındı.", "warning");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: resetConfirm,
        title: "Veritabanını Tamamen Sıfırla?",
        message: "DİKKAT! Tüm veritabanını sıfırlamak ve tüm verileri silmek istediğinize emin misiniz? Bu işlem kesinlikle geri alınamaz.",
        onConfirm: clearDatabaseCompletely,
        onCancel: () => setResetConfirm(false)
      }
    ), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Sistem Yedekleme & Ayarlar",
        description: "Yerel yedekler oluşturun, geri yükleyin ve erişim parametrelerini yapılandırın."
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-left" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-200 flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(Icons.Database, null), /* @__PURE__ */ React.createElement("span", null, "Veri Yedekleme ve Kurtarma (JSON)")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Sunucusuz yerel altyapıda verileriniz yalnızca tarayıcınızda yaşar. Bilgisayarınızı değiştirirken veya her günün sonunda yedek dosyasını mutlaka bilgisayarınıza indirin."), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 pt-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-white mb-2" }, "1. Yedeği İndir (Dışa Aktar)"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleExportBackup,
        className: "w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition text-center"
      },
      "Yedek JSON Dosyasını İndir (.json)"
    )), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-white mb-2" }, "2. Yedeği Geri Yükle (İçe Aktar)"), /* @__PURE__ */ React.createElement("label", { className: "block w-full text-center border border-dashed border-gray-700 bg-darkBg-deep rounded p-4 hover:border-brand-500 cursor-pointer transition" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 block mb-1" }, "JSON Uzantılı Yedek Dosyasını Seçin"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        accept: ".json",
        onChange: handleImportBackup,
        className: "hidden"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "bg-brand-500/20 text-brand-300 font-bold py-1 px-3 rounded text-[10px] inline-block mt-1" }, "Dosya Seç"))))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-200 flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(Icons.Lock, null), /* @__PURE__ */ React.createElement("span", null, "Sistem Güvenlik & İş Kuralları")), /* @__PURE__ */ React.createElement("form", { onSubmit: saveSettings, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Giriş / Yönetici PIN Kodu (4 Hane)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "password",
        maxLength: 4,
        value: pinSetting,
        onChange: (e) => setPinSetting(e.target.value.replace(/\D/g, "")),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white font-bold tracking-widest text-center"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Sadakat Hediye Hedefi"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: targetVisits,
        onChange: (e) => setTargetVisits(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Kilitleme Süresi (Saniye)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: idleTime,
        onChange: (e) => setIdleTime(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white"
      }
    ))), /* @__PURE__ */ React.createElement("label", { className: "flex items-center justify-between bg-darkBg-deep border border-darkBg-border rounded p-3 cursor-pointer" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-200 block" }, "PIN Güvenlik Kilidi"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, "Hassas alanlar ve boşta kilit için PIN onayı.")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: pinSecurityEnabled,
        onChange: (e) => setPinSecurityEnabled(e.target.checked),
        className: "w-4 h-4 rounded text-brand-600 bg-darkBg-deep focus:ring-brand-500 border-gray-700"
      }
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded transition"
      },
      "Ayarları Kaydet & Güncelle"
    )), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-red-400 mb-2" }, "Tehlikeli Bölge"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setResetConfirm(true),
        className: "w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded transition"
      },
      "Tüm Veritabanını Temizle / Sıfırla"
    )))));
  };

  // src/app.jsx
  var { useState: useState13, useEffect: useEffect5, useRef } = React;
  db.seed();
  var NAV_ITEMS = [
    { id: "dashboard", label: "Kontrol Paneli", icon: Icons.Dashboard },
    { id: "sales", label: "Hizmet / Satış Girişi", icon: Icons.Plus },
    { id: "appointments", label: "Randevular", icon: Icons.Calendar },
    { id: "customers", label: "Müşteriler (CRM)", mobileLabel: "Müşteriler", icon: Icons.Users },
    { id: "services", label: "Hizmet Kataloğu", icon: Icons.Clipboard },
    { id: "products", label: "Stok & Market", icon: Icons.Package },
    { id: "finance", label: "Kasa & Giderler", icon: Icons.Coins },
    { id: "income", label: "Gelir Kayıtları", icon: Icons.TrendingUp },
    { id: "campaigns", label: "Kampanyalar", icon: Icons.Percent },
    { id: "backup", label: "Sistem & Yedekleme", icon: Icons.Database }
  ];
  function App() {
    const [activeTab, setActiveTab] = useState13("dashboard");
    const [users, setUsers] = useState13(() => db.get(DB_KEYS.USERS));
    const [customers, setCustomers] = useState13(() => db.get(DB_KEYS.CUSTOMERS));
    const [services, setServices] = useState13(() => db.get(DB_KEYS.SERVICES));
    const [transactions, setTransactions] = useState13(() => db.get(DB_KEYS.TRANSACTIONS));
    const [appointments, setAppointments] = useState13(() => db.get(DB_KEYS.APPOINTMENTS));
    const [expenses, setExpenses] = useState13(() => db.get(DB_KEYS.EXPENSES));
    const [products, setProducts] = useState13(() => db.get(DB_KEYS.PRODUCTS));
    const [sales, setSales] = useState13(() => db.get(DB_KEYS.SALES));
    const [campaigns, setCampaigns] = useState13(() => db.get(DB_KEYS.CAMPAIGNS));
    const [settings, setSettings] = useState13(() => db.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS));
    const [isLocked, setIsLocked] = useState13(() => {
      const initial = db.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
      return (initial == null ? void 0 : initial.pin_security_enabled) !== false;
    });
    const [isSensitiveHidden, setIsSensitiveHidden] = useState13(true);
    const lastActiveRef = useRef(Date.now());
    const [notification, setNotification] = useState13(null);
    const [pinError, setPinError] = useState13(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState13(false);
    const [quickPlateContext, setQuickPlateContext] = useState13("");
    const [pendingFromAppointment, setPendingFromAppointment] = useState13(null);
    const [pinGateModal, setPinGateModal] = useState13(createEmptyPinGate);
    const [gatePinInput, setGatePinInput] = useState13("");
    const showNotification = (message, type = "success") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4e3);
    };
    useEffect5(() => {
      db.set(DB_KEYS.USERS, users);
    }, [users]);
    useEffect5(() => {
      db.set(DB_KEYS.CUSTOMERS, customers);
    }, [customers]);
    useEffect5(() => {
      db.set(DB_KEYS.SERVICES, services);
    }, [services]);
    useEffect5(() => {
      db.set(DB_KEYS.TRANSACTIONS, transactions);
    }, [transactions]);
    useEffect5(() => {
      db.set(DB_KEYS.APPOINTMENTS, appointments);
    }, [appointments]);
    useEffect5(() => {
      db.set(DB_KEYS.EXPENSES, expenses);
    }, [expenses]);
    useEffect5(() => {
      db.set(DB_KEYS.PRODUCTS, products);
    }, [products]);
    useEffect5(() => {
      db.set(DB_KEYS.SALES, sales);
    }, [sales]);
    useEffect5(() => {
      db.set(DB_KEYS.CAMPAIGNS, campaigns);
    }, [campaigns]);
    useEffect5(() => {
      db.set(DB_KEYS.SETTINGS, settings);
    }, [settings]);
    useEffect5(() => {
      const handleActivity = () => {
        lastActiveRef.current = Date.now();
      };
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("keydown", handleActivity);
      window.addEventListener("click", handleActivity);
      window.addEventListener("scroll", handleActivity);
      window.addEventListener("touchstart", handleActivity);
      const interval = setInterval(() => {
        if (settings.pin_security_enabled && !isLocked) {
          const elapsed = (Date.now() - lastActiveRef.current) / 1e3;
          if (elapsed >= (settings.idle_lock_time || 60)) {
            setIsLocked(true);
            showNotification("Uzun süre işlem yapılmadığı için ekran kilitlendi.", "warning");
          }
        }
      }, 5e3);
      return () => {
        window.removeEventListener("mousemove", handleActivity);
        window.removeEventListener("keydown", handleActivity);
        window.removeEventListener("click", handleActivity);
        window.removeEventListener("scroll", handleActivity);
        window.removeEventListener("touchstart", handleActivity);
        clearInterval(interval);
      };
    }, [isLocked, settings.pin_security_enabled, settings.idle_lock_time]);
    useEffect5(() => {
      if (settings.pin_security_enabled === false && isLocked) {
        setIsLocked(false);
      }
    }, [settings.pin_security_enabled, isLocked]);
    const handlePinRecovery = () => {
      setUsers((prev) => prev.map((u) => u.id === "admin-1" ? { ...u, pinCode: "1234" } : u));
      resetPinLockState();
      setPinError(false);
      showNotification("PIN kodu 1234 olarak sıfırlandı. Lütfen Sistem & Yedekleme'den yeni bir PIN belirleyin.", "warning");
    };
    const handleUnlock = (enteredPin) => {
      if (isPinLockedOut()) {
        setPinError(true);
        setTimeout(() => setPinError(false), 2e3);
        showNotification("Çok fazla hatalı deneme. Lütfen bekleyin.", "error");
        return;
      }
      const admin = users.find((u) => u.pinCode === enteredPin);
      if (admin) {
        resetPinLockState();
        setIsLocked(false);
        setPinError(false);
        lastActiveRef.current = Date.now();
        showNotification(`Hoş geldiniz, ${admin.name}!`);
      } else {
        const next = recordFailedPinAttempt();
        setPinError(true);
        setTimeout(() => setPinError(false), 2e3);
        if (next.lockedUntil > Date.now()) {
          showNotification("Hatalı deneme limiti aşıldı. Geçici olarak kilitlendiniz.", "error");
        }
      }
    };
    const requestPinApproval = (customText, successCallback) => {
      if (!settings.pin_security_enabled) {
        successCallback();
        return;
      }
      setPinGateModal({
        isOpen: true,
        onSuccess: () => {
          successCallback();
          setPinGateModal(createEmptyPinGate());
          setGatePinInput("");
        },
        onFail: () => {
          setPinGateModal(createEmptyPinGate());
          setGatePinInput("");
        },
        customText
      });
    };
    const handlePinGateSubmit = () => {
      if (isPinLockedOut()) {
        showNotification("Çok fazla hatalı deneme. Lütfen bekleyin.", "error");
        return;
      }
      const admin = users.find((u) => u.pinCode === gatePinInput);
      if (admin) {
        resetPinLockState();
        if (pinGateModal.onSuccess) pinGateModal.onSuccess();
      } else {
        const next = recordFailedPinAttempt();
        setGatePinInput("");
        if (next.lockedUntil > Date.now()) {
          showNotification("Hatalı deneme limiti aşıldı. Bu işlem geçici olarak kilitlendi.", "error");
          if (pinGateModal.onFail) pinGateModal.onFail();
        } else {
          showNotification("Hatalı PIN kodu girdiniz!", "error");
        }
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex flex-col md:flex-row bg-darkBg-deep text-gray-200" }, isLocked && /* @__PURE__ */ React.createElement(LockScreen, { users, handleUnlock, pinError, onPinReset: handlePinRecovery }), /* @__PURE__ */ React.createElement(
      PinGateModal,
      {
        isOpen: pinGateModal.isOpen,
        customText: pinGateModal.customText,
        gatePin: gatePinInput,
        setGatePin: setGatePinInput,
        onFail: () => {
          if (pinGateModal.onFail) pinGateModal.onFail();
        },
        onSubmit: handlePinGateSubmit
      }
    ), /* @__PURE__ */ React.createElement(NotificationBadge, { notification }), /* @__PURE__ */ React.createElement("aside", { className: "hidden md:flex flex-col w-64 bg-darkBg-card border-r border-darkBg-border flex-shrink-0 h-screen sticky top-0 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "p-5 pb-3 shrink-0" }, /* @__PURE__ */ React.createElement(AppLogo, null)), /* @__PURE__ */ React.createElement("nav", { className: "flex-1 overflow-y-auto px-5 space-y-1 text-xs" }, NAV_ITEMS.map((item) => /* @__PURE__ */ React.createElement(
      NavButton,
      {
        key: item.id,
        item,
        activeTab,
        onSelect: setActiveTab
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "p-5 pt-4 border-t border-darkBg-border space-y-3 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-deep border border-darkBg-border rounded-lg px-3 py-2.5 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-300 text-[10px] font-extrabold shrink-0" }, "A"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "block text-[10px] text-gray-500 leading-tight" }, "Oturum"), /* @__PURE__ */ React.createElement("span", { className: "block text-xs font-bold text-gray-200 truncate" }, "Admin"))), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0" }, "Lokal")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setIsLocked(true);
          showNotification("Panel kilitlendi.", "warning");
        },
        className: "w-full bg-darkBg-deep hover:bg-red-950/30 hover:border-red-500/40 hover:text-red-300 border border-darkBg-border text-gray-300 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
      },
      /* @__PURE__ */ React.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" })),
      /* @__PURE__ */ React.createElement("span", null, "Ekranı Kilitle")
    ))), /* @__PURE__ */ React.createElement("header", { className: "md:hidden sticky top-0 bg-darkBg-card/95 backdrop-blur border-b border-darkBg-border p-4 flex justify-between items-center z-20" }, /* @__PURE__ */ React.createElement(AppLogo, { compact: true }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileMenuOpen(!mobileMenuOpen),
        className: "p-2 bg-darkBg-deep rounded text-gray-400 hover:text-white border border-darkBg-border",
        "aria-label": "Menüyü aç/kapat"
      },
      /* @__PURE__ */ React.createElement(Icons.Menu, null)
    )), mobileMenuOpen && /* @__PURE__ */ React.createElement("div", { className: "md:hidden bg-darkBg-card border-b border-darkBg-border text-xs flex flex-col p-4 space-y-2 z-20" }, NAV_ITEMS.map((item) => /* @__PURE__ */ React.createElement(
      NavButton,
      {
        key: item.id,
        item,
        activeTab,
        mobile: true,
        onSelect: (id) => {
          setActiveTab(id);
          setMobileMenuOpen(false);
        }
      }
    )), /* @__PURE__ */ React.createElement("hr", { className: "border-darkBg-border my-2" }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setIsLocked(true);
          setMobileMenuOpen(false);
        },
        className: "w-full py-2 bg-red-950/30 text-red-400 border border-red-900/30 rounded font-bold text-center"
      },
      "Ekranı Kilitle (PIN)"
    )), /* @__PURE__ */ React.createElement("main", { className: "flex-1 p-4 md:p-8 overflow-y-auto max-w-full" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-6xl mx-auto h-full" }, activeTab === "dashboard" && /* @__PURE__ */ React.createElement(
      DashboardTab,
      {
        transactions,
        expenses,
        appointments,
        customers,
        sales,
        setActiveTab,
        setQuickPlateContext,
        isSensitiveHidden,
        setIsSensitiveHidden,
        requestPinApproval,
        settings
      }
    ), activeTab === "sales" && /* @__PURE__ */ React.createElement(
      SalesTab,
      {
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
      }
    ), activeTab === "appointments" && /* @__PURE__ */ React.createElement(
      AppointmentsTab,
      {
        appointments,
        setAppointments,
        customers,
        setCustomers,
        services,
        setQuickPlateContext,
        setPendingFromAppointment,
        setActiveTab,
        showNotification
      }
    ), activeTab === "customers" && /* @__PURE__ */ React.createElement(
      CustomersTab,
      {
        customers,
        setCustomers,
        transactions,
        setTransactions,
        appointments,
        setAppointments,
        sales,
        setSales,
        products,
        setProducts,
        services,
        settings,
        showNotification
      }
    ), activeTab === "services" && /* @__PURE__ */ React.createElement(
      ServicesTab,
      {
        services,
        setServices,
        showNotification
      }
    ), activeTab === "products" && /* @__PURE__ */ React.createElement(
      ProductsTab,
      {
        products,
        setProducts,
        sales,
        setSales,
        customers,
        showNotification
      }
    ), activeTab === "finance" && /* @__PURE__ */ React.createElement(
      FinanceTab,
      {
        transactions,
        expenses,
        setExpenses,
        sales,
        products,
        isSensitiveHidden,
        setIsSensitiveHidden,
        requestPinApproval,
        showNotification
      }
    ), activeTab === "income" && /* @__PURE__ */ React.createElement(
      IncomeTab,
      {
        transactions,
        setTransactions,
        sales,
        setSales,
        products,
        setProducts,
        customers,
        services,
        isSensitiveHidden,
        setIsSensitiveHidden,
        requestPinApproval,
        showNotification
      }
    ), activeTab === "campaigns" && /* @__PURE__ */ React.createElement(
      CampaignsTab,
      {
        campaigns,
        setCampaigns,
        services,
        showNotification
      }
    ), activeTab === "backup" && /* @__PURE__ */ React.createElement(
      BackupTab,
      {
        users,
        customers,
        services,
        transactions,
        appointments,
        expenses,
        products,
        sales,
        campaigns,
        setUsers,
        setCustomers,
        setServices,
        setTransactions,
        setAppointments,
        setExpenses,
        setProducts,
        setSales,
        setCampaigns,
        settings,
        setSettings,
        showNotification
      }
    ))));
  }
  var container = document.getElementById("root");
  var root = ReactDOM.createRoot(container);
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();
