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
      prices: { SEDAN: 250, SUV: 300, MINIBUS: 350, TICARI: 320, MOTOSIKLET: 150 },
      duration: 45,
      isActive: true
    },
    {
      id: "srv-2",
      name: "Detaylı Koltuk Temizliği",
      prices: { SEDAN: 1200, SUV: 1400, MINIBUS: 1800, TICARI: 1500, MOTOSIKLET: 500 },
      duration: 120,
      isActive: true
    },
    {
      id: "srv-3",
      name: "Pasta Cila & Boya Koruma",
      prices: { SEDAN: 2500, SUV: 3e3, MINIBUS: 3500, TICARI: 3e3, MOTOSIKLET: 1200 },
      duration: 240,
      isActive: true
    },
    {
      id: "srv-4",
      name: "Motor Koruma & Temizleme",
      prices: { SEDAN: 400, SUV: 450, MINIBUS: 500, TICARI: 500, MOTOSIKLET: 300 },
      duration: 35,
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
    SETTINGS: "otoyikama_settings"
  };
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
    Shield: () => svg("M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z")
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

  // src/ui/PageHeader.jsx
  var PageHeader = ({ title, description, actions }) => /* @__PURE__ */ React.createElement("div", { className: "app-page-header border-b border-darkBg-border pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-extrabold text-white" }, title), description && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, description)), actions && /* @__PURE__ */ React.createElement("div", { className: "app-page-actions flex flex-wrap gap-3" }, actions));

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
  var LockScreen = ({ users, handleUnlock, pinError }) => {
    const [pin, setPin] = useState("");
    const [cooldownMs, setCooldownMs] = useState(getCooldownRemainingMs());
    const [failedAttempts, setFailedAttempts] = useState(getPinLockState().failedAttempts);
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
      )), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-600" }, "PIN ayarları Sistem & Yedekleme bölümünden yönetilir."))
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

  // src/tabs/SalesTab.jsx
  var { useState: useState4, useEffect: useEffect3, useMemo: useMemo2 } = React;
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
      if (quickPlateContext) {
        setPlate(quickPlateContext);
      }
    }, [quickPlateContext]);
    const loyaltyStats = useMemo2(() => {
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
    const originalPrice = useMemo2(() => {
      return selectedServiceIds.reduce((sum, sId) => {
        const service = services.find((s) => s.id === sId && s.isActive);
        if (service && service.prices[currentVehicleType]) {
          return sum + service.prices[currentVehicleType];
        }
        return sum;
      }, 0);
    }, [selectedServiceIds, services, currentVehicleType]);
    const campaignDetails = useMemo2(() => {
      let totalDiscount = 0;
      const appliedCampaigns = [];
      campaigns.forEach((camp) => {
        if (!camp.isActive) return;
        if (camp.applicableVehicleTypes.length > 0 && !camp.applicableVehicleTypes.includes(currentVehicleType)) return;
        if (camp.minSpend > 0 && originalPrice < camp.minSpend) return;
        const containsService = selectedServiceIds.some((sId) => camp.applicableServices.includes(sId));
        if (selectedServiceIds.length > 0 && camp.applicableServices.length > 0 && !containsService) return;
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
        showNotification("Yeni müşteri profili kaydedildi.");
      } else if (matchedCustomer) {
        customerId = matchedCustomer.id;
      } else {
        showNotification("Lütfen müşteri bilgilerini doğrulayın.", "error");
        return;
      }
      const newTransaction = {
        id: generateUUID(),
        customerId,
        serviceIds: selectedServiceIds,
        totalPrice: finalPrice,
        discountAmount: isRewardRedeemed ? originalPrice : campaignDetails.discountAmount,
        campaignIds: isRewardRedeemed ? [] : campaignDetails.appliedCampaigns.map((c) => c.id),
        date: (/* @__PURE__ */ new Date()).toISOString(),
        status: "COMPLETED",
        notes: notes + (isRewardRedeemed ? " [SADAKAT ÖDÜL KULLANIMI]" : ""),
        isLoyaltyReward: isRewardRedeemed
      };
      setTransactions((prev) => [...prev, newTransaction]);
      showNotification("Satış işlemi başarıyla tamamlandı. Kayıt sisteme işlendi!");
      setPlate("");
      setSelectedServiceIds([]);
      setNotes("");
      setIsRewardRedeemed(false);
      setCustName("");
      setCustPhone("");
      setQuickPlateContext("");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Yeni Satış ve Hizmet Kaydı",
        description: "Plaka girildiğinde mevcut CRM kaydı otomatik taranır; yeni araçlar aynı akışta kaydedilir."
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-300 border-b border-darkBg-border pb-2" }, "1. Araç & Müşteri Tanımı"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-400 font-semibold block" }, "Araç Plakası"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: plate,
        onChange: (e) => setPlate(normalizePlate(e.target.value)),
        placeholder: "Örn: 34ABC123",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-center uppercase tracking-wider font-extrabold text-xl focus:outline-none focus:border-brand-500 text-white"
      }
    )), matchedCustomer && /* @__PURE__ */ React.createElement("div", { className: "bg-brand-950/20 border border-brand-800/30 p-4 rounded-lg space-y-2 animate-fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-emerald-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icons.Check, null), " Kayıtlı Müşteri"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded-full" }, matchedCustomer.vehicleType)), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-white" }, matchedCustomer.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, matchedCustomer.phone), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-2 mt-2 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Sadakat Programı"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, loyaltyStats.paidVisits, " / ", loyaltyStats.target, " ücretli yıkama")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-darkBg-deep rounded-full h-1.5 overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-1.5 rounded-full transition-all duration-300 ${loyaltyStats.ready ? "bg-emerald-500" : "bg-brand-500"}`,
        style: { width: `${loyaltyStats.ready ? 100 : loyaltyStats.progress / loyaltyStats.target * 100}%` }
      }
    )), loyaltyStats.ready ? /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-500/10 border border-emerald-500/30 p-2 rounded flex items-center justify-between text-emerald-400 text-xs animate-pulse" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), " Hediye Yıkama Hazır"), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px]" }, loyaltyStats.availableRewards, " adet")) : /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500 font-medium" }, "Hediyeye ", /* @__PURE__ */ React.createElement("span", { className: "text-brand-400 font-extrabold" }, loyaltyStats.nextRewardIn), " ücretli yıkama kaldı."))), isNewCustomerMode && /* @__PURE__ */ React.createElement("div", { className: "bg-amber-950/10 border border-amber-900/30 p-4 rounded-lg space-y-3 animate-fade-in" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-400 font-bold flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.AlertTriangle, null), " Yeni Araç / Müşteri Profili"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] text-gray-400 block" }, "Müşteri Ad Soyadı"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: custName,
        onChange: (e) => setCustName(e.target.value),
        placeholder: "Ahmet Yılmaz",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] text-gray-400 block" }, "Telefon Numarası"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: custPhone,
        onChange: (e) => setCustPhone(e.target.value),
        placeholder: "05...",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] text-gray-400 block" }, "Araç Tipi"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: vehicleType,
        onChange: (e) => setVehicleType(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white"
      },
      VEHICLE_TYPES.map((type) => /* @__PURE__ */ React.createElement("option", { key: type.id, value: type.id }, type.label.toLocaleUpperCase("tr-TR")))
    )))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-300" }, "2. Hizmet Seçimi"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/15 text-brand-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider" }, currentVehicleType)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-white" }, selectedServiceIds.length), " hizmet seçildi"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-400" }, formatCurrency(originalPrice)), selectedServiceIds.length > 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSelectedServiceIds([]),
        className: "text-gray-400 hover:text-red-400 underline-offset-2 hover:underline transition"
      },
      "Temizle"
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1" }, services.filter((s) => s.isActive).length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-8 col-span-full" }, "Aktif hizmet bulunamadı. Hizmet Kataloğu sekmesinden ekleyin."), services.map((srv) => {
      if (!srv.isActive) return null;
      const price = srv.prices[currentVehicleType] || 0;
      const isChecked = selectedServiceIds.includes(srv.id);
      const toggle = () => {
        if (isChecked) {
          setSelectedServiceIds((prev) => prev.filter((id) => id !== srv.id));
        } else {
          setSelectedServiceIds((prev) => [...prev, srv.id]);
        }
      };
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          key: srv.id,
          onClick: toggle,
          "aria-pressed": isChecked,
          className: `relative text-left p-4 rounded-lg border transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${isChecked ? "bg-brand-600/15 border-brand-500 shadow shadow-brand-500/10" : "bg-darkBg-deep border-darkBg-border hover:border-brand-500/60 hover:bg-darkBg-hover"}`
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isChecked ? "bg-brand-500 border-brand-500 text-white" : "border-gray-600 text-transparent"}`,
            "aria-hidden": "true"
          },
          /* @__PURE__ */ React.createElement("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }))
        ),
        /* @__PURE__ */ React.createElement("div", { className: "pr-7 space-y-2" }, /* @__PURE__ */ React.createElement("p", { className: `text-xs font-bold leading-snug ${isChecked ? "text-white" : "text-gray-200"}` }, srv.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 text-[10px]" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-gray-400" }, /* @__PURE__ */ React.createElement("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" })), srv.duration, " dk"), /* @__PURE__ */ React.createElement("span", { className: `font-extrabold ${isChecked ? "text-emerald-300" : "text-gray-200"}` }, formatCurrency(price))))
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1 pt-2 border-t border-darkBg-border" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-400 font-semibold block" }, "İş Emri / Satış Notu"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        placeholder: "Araçta çizikler var, jant temizliği vb.",
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-xs focus:outline-none focus:border-brand-500 text-white resize-none"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow flex flex-col justify-between space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-300 border-b border-darkBg-border pb-2 mb-4" }, "3. Ödeme Detayları"), loyaltyStats.availableRewards > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center justify-between cursor-pointer" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-white block" }, "Müşteri Ödülü Kullanılsın"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-emerald-400" }, "Ücretsiz Yıkama Tanımla (0 ₺)"))), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: isRewardRedeemed,
        onChange: (e) => setIsRewardRedeemed(e.target.checked),
        className: "w-4 h-4 rounded text-emerald-600 bg-darkBg-deep focus:ring-emerald-500 border-emerald-700"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Araç Tipi Sınıfı"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-200" }, currentVehicleType)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Brüt Hizmet Tutarı"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-200" }, formatCurrency(originalPrice))), campaignDetails.discountAmount > 0 && !isRewardRedeemed && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-emerald-400" }, /* @__PURE__ */ React.createElement("span", null, "Kampanya İndirimi (", campaignDetails.appliedCampaigns.map((c) => c.name).join(", "), ")"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "- ", formatCurrency(campaignDetails.discountAmount))), isRewardRedeemed && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-emerald-400" }, /* @__PURE__ */ React.createElement("span", null, "Sadakat Programı İndirimi"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "- ", formatCurrency(originalPrice))), /* @__PURE__ */ React.createElement("hr", { className: "border-darkBg-border my-2" }), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm font-extrabold text-white" }, /* @__PURE__ */ React.createElement("span", null, "Tahsil Edilecek Tutar"), /* @__PURE__ */ React.createElement("span", { className: "text-lg text-emerald-400" }, formatCurrency(finalPrice))))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSaveCheckout,
        className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg text-sm transition shadow-lg shadow-emerald-950/20 active:scale-95"
      },
      "Faturayı Onayla & Tamamla"
    ))));
  };

  // src/tabs/AppointmentsTab.jsx
  var { useState: useState5 } = React;
  var AppointmentsTab = ({
    appointments,
    setAppointments,
    customers,
    setCustomers,
    services,
    setQuickPlateContext,
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

  // src/tabs/CustomersTab.jsx
  var { useState: useState6, useMemo: useMemo3 } = React;
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
    const [viewHistoryCust, setViewHistoryCust] = useState6(null);
    const [editCustomer, setEditCustomer] = useState6(null);
    const [editName, setEditName] = useState6("");
    const [editPhone, setEditPhone] = useState6("");
    const [editPlate, setEditPlate] = useState6("");
    const [editVehicleType, setEditVehicleType] = useState6("SEDAN");
    const [deleteConfirm, setDeleteConfirm] = useState6({ isOpen: false, targetId: null });
    const customerLoyalty = useMemo3(() => {
      const map = /* @__PURE__ */ new Map();
      customers.forEach((c) => {
        map.set(c.id, computeLoyaltyStats(c.id, transactions, loyaltyTarget));
      });
      return map;
    }, [customers, transactions, loyaltyTarget]);
    const readyCount = useMemo3(() => {
      let count = 0;
      customerLoyalty.forEach((stats) => {
        if (stats.ready) count += 1;
      });
      return count;
    }, [customerLoyalty]);
    const filteredCustomers = useMemo3(() => {
      return customers.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(search.toLowerCase());
        const plateMatch = c.plate.toLowerCase().includes(search.toLowerCase());
        const phoneMatch = c.phone.includes(search);
        const typeMatch = filterType === "ALL" || c.vehicleType === filterType;
        const stats = customerLoyalty.get(c.id);
        const readyMatch = !showOnlyReady || stats && stats.ready;
        return (nameMatch || plateMatch || phoneMatch) && typeMatch && readyMatch;
      });
    }, [customers, search, filterType, showOnlyReady, customerLoyalty]);
    const getCustomerWashHistory = (custId) => {
      return transactions.filter((t) => t.customerId === custId && t.status === "COMPLETED").sort((a, b) => new Date(b.date) - new Date(a.date));
    };
    const handleDeleteRequest = (id) => {
      setDeleteConfirm({ isOpen: true, targetId: id });
    };
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
      const relatedSales = sales.filter((s) => s.customerId === id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setTransactions((prev) => prev.filter((t) => t.customerId !== id));
      setAppointments((prev) => prev.filter((a) => a.customerId !== id));
      setSales((prev) => prev.filter((s) => s.customerId !== id));
      if (relatedSales.length > 0) {
        setProducts((prev) => prev.map((product) => {
          const returnedQuantity = relatedSales.filter((s) => s.productId === product.id).reduce((sum, s) => sum + (s.quantity || 0), 0);
          return returnedQuantity > 0 ? { ...product, stock: product.stock + returnedQuantity } : product;
        }));
      }
      showNotification("Müşteri ve bağlı işlem kayıtları silindi.", "warning");
      setDeleteConfirm({ isOpen: false, targetId: null });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      CustomConfirmModal,
      {
        isOpen: deleteConfirm.isOpen,
        title: "Müşteri Kaydını Sil?",
        message: "Bu müşteriyle ilişkili randevu, hizmet ve market satış kayıtları da silinir; market stokları geri eklenir.",
        onConfirm: confirmDeleteCustomer,
        onCancel: () => setDeleteConfirm({ isOpen: false, targetId: null })
      }
    ), /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "Müşteri Portföyü",
        description: "Müşterilerinizi, araç sınıflarını ve sadakat geçmişlerini görüntüleyin.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setShowOnlyReady((prev) => !prev),
            className: `px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition border ${showOnlyReady ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow shadow-emerald-500/20" : "bg-darkBg-card hover:bg-darkBg-hover text-emerald-300 border-emerald-700/40"}`
          },
          /* @__PURE__ */ React.createElement(Icons.Gift, null),
          /* @__PURE__ */ React.createElement("span", null, showOnlyReady ? "Tüm Müşteriler" : `Ödüle Hazır (${readyCount})`)
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-3 text-gray-400" }, /* @__PURE__ */ React.createElement(Icons.Search, null)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        placeholder: "Plaka, İsim ya da Telefon numarası ile ara...",
        value: search,
        onChange: (e) => setSearch(e.target.value),
        className: "w-full bg-darkBg-card border border-darkBg-border pl-10 pr-4 py-2.5 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-white"
      }
    )), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterType,
        onChange: (e) => setFilterType(e.target.value),
        className: "bg-darkBg-card border border-darkBg-border px-4 py-2.5 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-white"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Tüm Araç Sınıfları"),
      VEHICLE_TYPES.map((type) => /* @__PURE__ */ React.createElement("option", { key: type.id, value: type.id }, type.label.toLocaleUpperCase("tr-TR")))
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" }, filteredCustomers.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-12 col-span-3" }, "Aranan kriterlere uygun müşteri bulunamadı.") : filteredCustomers.map((cust) => {
      const history = getCustomerWashHistory(cust.id);
      const stats = customerLoyalty.get(cust.id) || computeLoyaltyStats(cust.id, transactions, loyaltyTarget);
      const progressPercent = stats.ready ? 100 : stats.progress / stats.target * 100;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: cust.id,
          className: `bg-darkBg-card border p-5 rounded-xl shadow space-y-4 flex flex-col justify-between transition ${stats.ready ? "border-emerald-500/50 shadow-emerald-500/10" : "border-darkBg-border"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-extrabold bg-brand-500/10 text-brand-400 px-3 py-1 rounded-md tracking-wider uppercase" }, cust.plate), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-darkBg-deep border border-darkBg-border text-gray-400 px-2 py-0.5 rounded-full font-semibold" }, cust.vehicleType), stats.ready && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 animate-pulse" }, /* @__PURE__ */ React.createElement(Icons.Gift, null), " ", stats.availableRewards, " Bedava"))), /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-bold text-white" }, cust.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, cust.phone)), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-deep border border-darkBg-border rounded-lg p-2.5 space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] font-semibold" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Sadakat"), /* @__PURE__ */ React.createElement("span", { className: stats.ready ? "text-emerald-300 font-extrabold" : "text-gray-300" }, stats.ready ? "Bedava yıkama hazır" : `${stats.progress} / ${stats.target}`)), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-darkBg-card rounded-full h-1.5 overflow-hidden" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `h-1.5 rounded-full transition-all duration-300 ${stats.ready ? "bg-emerald-500" : "bg-brand-500"}`,
            style: { width: `${progressPercent}%` }
          }
        )), !stats.ready && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "Hediyeye ", /* @__PURE__ */ React.createElement("span", { className: "text-brand-400 font-extrabold" }, stats.nextRewardIn), " ücretli yıkama kaldı."))),
        /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-3 flex justify-between items-center text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 block text-[10px]" }, "Toplam Ziyaret"), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-white text-sm" }, history.length, " Defa")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 justify-end" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setViewHistoryCust(cust),
            className: "px-3 py-1.5 bg-brand-900/30 text-brand-400 hover:bg-brand-600 hover:text-white rounded font-bold text-[10px] transition"
          },
          "Hizmet Geçmişi"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => openEditCustomer(cust),
            className: "px-3 py-1.5 bg-darkBg-deep text-gray-300 hover:bg-darkBg-hover rounded font-bold text-[10px] transition"
          },
          "Düzenle"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => handleDeleteRequest(cust.id),
            className: "p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition",
            title: "Müşteriyi Sil"
          },
          /* @__PURE__ */ React.createElement(Icons.Trash, null)
        )))
      );
    })), editCustomer && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-md bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Müşteri Kartını Düzenle"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Plaka değişirse mevcut işlem geçmişi aynı müşteri kartına bağlı kalır.")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: closeEditCustomer, className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), /* @__PURE__ */ React.createElement("form", { onSubmit: saveEditedCustomer, className: "space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Plaka *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: editPlate,
        onChange: (e) => setEditPlate(normalizePlate(e.target.value)),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500 uppercase"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Araç Tipi"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: editVehicleType,
        onChange: (e) => setEditVehicleType(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      },
      VEHICLE_TYPES.map((type) => /* @__PURE__ */ React.createElement("option", { key: type.id, value: type.id }, type.label))
    ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Müşteri Ad Soyadı *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: editName,
        onChange: (e) => setEditName(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Telefon"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: editPhone,
        onChange: (e) => setEditPhone(e.target.value),
        className: "w-full bg-darkBg-deep border border-darkBg-border p-2.5 rounded text-white focus:outline-none focus:border-brand-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: closeEditCustomer, className: "flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded transition" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition" }, "Kaydet"))))), viewHistoryCust && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-xl bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-darkBg-border pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, viewHistoryCust.name, " — Hizmet Kartı"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, viewHistoryCust.plate, " | ", viewHistoryCust.phone)), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setViewHistoryCust(null), className: "text-gray-400 hover:text-white" }, /* @__PURE__ */ React.createElement(Icons.X, null))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-gray-300" }, "Önceki Siparişler / Yıkamalar"), getCustomerWashHistory(viewHistoryCust.id).length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-6" }, "Müşteriye ait tamamlanmış bir hizmet kaydı bulunmamaktadır.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, getCustomerWashHistory(viewHistoryCust.id).map((tr) => {
      const srvs = tr.serviceIds.map((id) => {
        var _a;
        return ((_a = services.find((s) => s.id === id)) == null ? void 0 : _a.name) || "Hizmet";
      }).join(", ");
      return /* @__PURE__ */ React.createElement("div", { key: tr.id, className: "bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-xs flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-left space-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, new Date(tr.date).toLocaleString("tr-TR")), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-200" }, srvs), tr.notes && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-amber-500/80 bg-amber-500/5 p-1 rounded" }, "Not: ", tr.notes)), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-emerald-400 block" }, formatCurrency(tr.totalPrice)), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, tr.isLoyaltyReward ? "Ödül" : "Tahsil Edildi")));
    }))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setViewHistoryCust(null),
        className: "w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded text-xs transition"
      },
      "Pencereyi Kapat"
    ))));
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
    const [sedanPrice, setSedanPrice] = useState7(250);
    const [suvPrice, setSuvPrice] = useState7(300);
    const [minibusPrice, setMinibusPrice] = useState7(350);
    const [ticariPrice, setTicariPrice] = useState7(300);
    const [motosikletPrice, setMotosikletPrice] = useState7(150);
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
      setSedanPrice(250);
      setSuvPrice(300);
      setMinibusPrice(350);
      setTicariPrice(300);
      setMotosikletPrice(150);
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
    const [prodName, setProdName] = useState8("");
    const [prodCategory, setProdCategory] = useState8("Hızlı Satış");
    const [prodPrice, setProdPrice] = useState8(100);
    const [prodCost, setProdCost] = useState8(40);
    const [prodStock, setProdStock] = useState8(10);
    const [prodUnit, setProdUnit] = useState8("Adet");
    const [selectedProdId, setSelectedProdId] = useState8("");
    const [selectedCustId, setSelectedCustId] = useState8("");
    const [saleQty, setSaleQty] = useState8(1);
    const [deleteSaleConfirm, setDeleteSaleConfirm] = useState8({ isOpen: false, targetId: null });
    const handleAddProduct = (e) => {
      e.preventDefault();
      if (!prodName) return;
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
      setIsOpenProdModal(false);
      setProdName("");
      setProdStock(10);
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
      const newSale = {
        id: generateUUID(),
        productId: selectedProdId,
        customerId: selectedCustId || "CARI_MUSTERI",
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        date: (/* @__PURE__ */ new Date()).toISOString()
      };
      setSales((prev) => [newSale, ...prev]);
      showNotification("Aksesuar/ürün satışı tamamlandı!");
      setIsOpenSaleModal(false);
      setSelectedProdId("");
      setSelectedCustId("");
      setSaleQty(1);
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
            onClick: () => setIsOpenProdModal(true),
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Stoğa Ürün Ekle")
        ))
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl overflow-hidden shadow" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-xs text-gray-400" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-darkBg-deep text-gray-300 font-bold border-b border-darkBg-border" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Ürün Adı"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Kategori"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-right" }, "Maliyet"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-right" }, "Satış Fiyatı"), /* @__PURE__ */ React.createElement("th", { className: "p-4 text-center" }, "Mevcut Stok"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Birim"), /* @__PURE__ */ React.createElement("th", { className: "p-4" }, "Durum"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-darkBg-border" }, products.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, className: "p-8 text-center text-gray-500" }, "Stokta kayıtlı ürün bulunmuyor.")) : products.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id, className: "hover:bg-darkBg-hover" }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-white" }, p.name), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, p.category), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-right" }, formatCurrency(p.cost)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-right text-emerald-400 font-bold" }, formatCurrency(p.price)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-full font-extrabold ${p.stock <= 5 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-brand-500/10 text-brand-300"}` }, p.stock)), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, p.unit), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full inline-block ${p.stock > 0 ? "bg-emerald-400" : "bg-red-500"}` })))))))), /* @__PURE__ */ React.createElement("div", { className: "bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white mb-3" }, "Tamamlanan Ürün Satış Geçmişi"), sales.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 py-6 text-center" }, "Henüz yapılmış bir market satışı bulunmuyor.") : /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-darkBg-border" }, sales.map((s) => {
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
    }))), isOpenProdModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Yeni Ürün / Stok Kartı Oluştur"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleAddProduct, className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Ürün Adı *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: prodName, onChange: (e) => setProdName(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Kategori *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: prodCategory, onChange: (e) => setProdCategory(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Maliyet Tutarı (₺) *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: prodCost, onChange: (e) => setProdCost(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Satış Fiyatı (₺) *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: prodPrice, onChange: (e) => setProdPrice(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Stok Adedi *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value: prodStock, onChange: (e) => setProdStock(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Birim *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: prodUnit, onChange: (e) => setProdUnit(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }))), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenProdModal(false), className: "flex-1 bg-gray-800 p-2.5 rounded font-bold" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-brand-600 p-2.5 rounded font-bold" }, "Kaydet"))))), isOpenSaleModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Market Ürünü Satış Fişi"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleDirectSale, className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Satılacak Ürün *"), /* @__PURE__ */ React.createElement(
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
    )), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenSaleModal(false), className: "flex-1 bg-gray-800 p-2.5 rounded font-bold" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-emerald-600 p-2.5 rounded font-bold" }, "Ödemeyi Al"))))));
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

  // src/tabs/CampaignsTab.jsx
  var { useState: useState10 } = React;
  var CampaignsTab = ({
    campaigns,
    setCampaigns,
    services,
    showNotification
  }) => {
    const [isOpenModal, setIsOpenModal] = useState10(false);
    const [name, setName] = useState10("");
    const [type, setType] = useState10("PERCENTAGE");
    const [value, setValue] = useState10(10);
    const [vehicleClass, setVehicleClass] = useState10("SUV");
    const [selectedServiceId, setSelectedServiceId] = useState10("");
    const handleCreateCampaign = (e) => {
      e.preventDefault();
      if (!name) return;
      const newCamp = {
        id: generateUUID(),
        name,
        type,
        value: parsePositiveNumber(value),
        startDate: (/* @__PURE__ */ new Date()).toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString(),
        isActive: true,
        applicableServices: selectedServiceId ? [selectedServiceId] : [],
        applicableVehicleTypes: vehicleClass ? [vehicleClass] : [],
        minSpend: 0
      };
      setCampaigns((prev) => [newCamp, ...prev]);
      showNotification("Yeni kampanya aktif edildi.");
      setIsOpenModal(false);
      setName("");
    };
    const deleteCampaign = (id) => {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      showNotification("Kampanya silindi.", "warning");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 text-left" }, /* @__PURE__ */ React.createElement(
      PageHeader,
      {
        title: "İndirim & Kampanyalar",
        description: "Satışlarda otomatik uygulanan sepet ve araç sınıfı indirimlerini belirleyin.",
        actions: /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setIsOpenModal(true),
            className: "px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold text-white flex items-center space-x-2 transition"
          },
          /* @__PURE__ */ React.createElement(Icons.Plus, null),
          /* @__PURE__ */ React.createElement("span", null, "Yeni Kampanya Kur")
        )
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, campaigns.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 text-center py-10 col-span-2" }, "Kayıtlı aktif kampanya bulunmuyor.") : campaigns.map((camp) => {
      const vehicleLabels = camp.applicableVehicleTypes && camp.applicableVehicleTypes.length > 0 ? camp.applicableVehicleTypes.map((id) => {
        var _a;
        return ((_a = VEHICLE_TYPES.find((v) => v.id === id)) == null ? void 0 : _a.label) || id;
      }).join(", ") : "Tümü";
      return /* @__PURE__ */ React.createElement("div", { key: camp.id, className: "bg-darkBg-card border border-darkBg-border p-5 rounded-xl flex justify-between items-start shadow" }, /* @__PURE__ */ React.createElement("div", { className: "text-left space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-extrabold" }, camp.type === "PERCENTAGE" ? `% ${camp.value} İNDİRİM` : `${camp.value} ₺ İNDİRİM`), /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-bold text-white" }, camp.name), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-400" }, "Hedef Araç Tipi: ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, vehicleLabels))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => deleteCampaign(camp.id),
          className: "text-gray-500 hover:text-red-400 transition"
        },
        /* @__PURE__ */ React.createElement(Icons.Trash, null)
      ));
    })), isOpenModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-xl p-6 shadow-2xl space-y-4 text-xs" }, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "İndirim Kampanyası Tanımla"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleCreateCampaign, className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Kampanya Adı *"), /* @__PURE__ */ React.createElement("input", { type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "Örn: Hafta İçi Sedan İndirimi", className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Tipi"), /* @__PURE__ */ React.createElement("select", { value: type, onChange: (e) => setType(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }, /* @__PURE__ */ React.createElement("option", { value: "PERCENTAGE" }, "Yüzde (%)"), /* @__PURE__ */ React.createElement("option", { value: "FIXED" }, "Sabit Tutar (₺)"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "İndirim Değeri *"), /* @__PURE__ */ React.createElement("input", { type: "number", required: true, value, onChange: (e) => setValue(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Uygulanacak Araç Sınıfı"), /* @__PURE__ */ React.createElement("select", { value: vehicleClass, onChange: (e) => setVehicleClass(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Tüm Araç Tipleri"), VEHICLE_TYPES.map((type2) => /* @__PURE__ */ React.createElement("option", { key: type2.id, value: type2.id }, type2.label.toLocaleUpperCase("tr-TR"))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 block font-semibold" }, "Özel Hizmet İlişkisi"), /* @__PURE__ */ React.createElement("select", { value: selectedServiceId, onChange: (e) => setSelectedServiceId(e.target.value), className: "w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Tüm Hizmetlerde Geçerli"), services.map((s) => /* @__PURE__ */ React.createElement("option", { key: s.id, value: s.id }, s.name)))), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setIsOpenModal(false), className: "flex-1 bg-gray-800 p-2.5 rounded font-bold" }, "Vazgeç"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-brand-600 p-2.5 rounded font-bold" }, "Aktif Et"))))));
  };

  // src/tabs/BackupTab.jsx
  var { useEffect: useEffect4, useState: useState11 } = React;
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
    const [pinSetting, setPinSetting] = useState11(((_a = users[0]) == null ? void 0 : _a.pinCode) || "1234");
    const [targetVisits, setTargetVisits] = useState11(settings.loyalty_target_visits || 5);
    const [idleTime, setIdleTime] = useState11(settings.idle_lock_time || 60);
    const [pinSecurityEnabled, setPinSecurityEnabled] = useState11(
      settings.pin_security_enabled !== false
    );
    const [resetConfirm, setResetConfirm] = useState11(false);
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
  var { useState: useState12, useEffect: useEffect5, useRef } = React;
  db.seed();
  var NAV_ITEMS = [
    { id: "dashboard", label: "Kontrol Paneli", icon: Icons.Dashboard },
    { id: "sales", label: "Hizmet / Satış Girişi", icon: Icons.Plus },
    { id: "appointments", label: "Randevular", icon: Icons.Calendar },
    { id: "customers", label: "Müşteriler (CRM)", mobileLabel: "Müşteriler", icon: Icons.Users },
    { id: "services", label: "Hizmet Kataloğu", icon: Icons.Clipboard },
    { id: "products", label: "Stok & Market", icon: Icons.Package },
    { id: "finance", label: "Kasa & Giderler", icon: Icons.Coins },
    { id: "campaigns", label: "Kampanyalar", icon: Icons.Percent },
    { id: "backup", label: "Sistem & Yedekleme", icon: Icons.Database }
  ];
  function App() {
    const [activeTab, setActiveTab] = useState12("dashboard");
    const [users, setUsers] = useState12(() => db.get(DB_KEYS.USERS));
    const [customers, setCustomers] = useState12(() => db.get(DB_KEYS.CUSTOMERS));
    const [services, setServices] = useState12(() => db.get(DB_KEYS.SERVICES));
    const [transactions, setTransactions] = useState12(() => db.get(DB_KEYS.TRANSACTIONS));
    const [appointments, setAppointments] = useState12(() => db.get(DB_KEYS.APPOINTMENTS));
    const [expenses, setExpenses] = useState12(() => db.get(DB_KEYS.EXPENSES));
    const [products, setProducts] = useState12(() => db.get(DB_KEYS.PRODUCTS));
    const [sales, setSales] = useState12(() => db.get(DB_KEYS.SALES));
    const [campaigns, setCampaigns] = useState12(() => db.get(DB_KEYS.CAMPAIGNS));
    const [settings, setSettings] = useState12(() => db.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS));
    const [isLocked, setIsLocked] = useState12(() => {
      const initial = db.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
      return (initial == null ? void 0 : initial.pin_security_enabled) !== false;
    });
    const [isSensitiveHidden, setIsSensitiveHidden] = useState12(true);
    const lastActiveRef = useRef(Date.now());
    const [notification, setNotification] = useState12(null);
    const [pinError, setPinError] = useState12(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState12(false);
    const [quickPlateContext, setQuickPlateContext] = useState12("");
    const [pinGateModal, setPinGateModal] = useState12(createEmptyPinGate);
    const [gatePinInput, setGatePinInput] = useState12("");
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
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex flex-col md:flex-row bg-darkBg-deep text-gray-200" }, isLocked && /* @__PURE__ */ React.createElement(LockScreen, { users, handleUnlock, pinError }), /* @__PURE__ */ React.createElement(
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
    ), /* @__PURE__ */ React.createElement(NotificationBadge, { notification }), /* @__PURE__ */ React.createElement("aside", { className: "hidden md:flex flex-col w-64 bg-darkBg-card border-r border-darkBg-border p-5 justify-between flex-shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(AppLogo, null), /* @__PURE__ */ React.createElement("nav", { className: "space-y-1 text-xs" }, NAV_ITEMS.map((item) => /* @__PURE__ */ React.createElement(
      NavButton,
      {
        key: item.id,
        item,
        activeTab,
        onSelect: setActiveTab
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-darkBg-border pt-4 text-xs space-y-2 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] text-gray-500 font-semibold" }, /* @__PURE__ */ React.createElement("span", null, "Oturum: Admin"), /* @__PURE__ */ React.createElement("span", { className: "bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded" }, "Lokal")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setIsLocked(true);
          showNotification("Panel kilitlendi.", "warning");
        },
        className: "w-full bg-darkBg-deep hover:bg-red-950/20 hover:text-red-400 border border-darkBg-border py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition"
      },
      /* @__PURE__ */ React.createElement(Icons.Lock, null),
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
