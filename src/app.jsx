import { DEFAULT_SETTINGS, createEmptyPinGate } from './core/app-core.js';
import { db, DB_KEYS } from './core/db.js';
import { usePersistentState } from './core/use-persistent-state.js';
import { Icons } from './core/icons.jsx';
import {
    recordFailedPinAttempt,
    resetPinLockState,
    isPinLockedOut
} from './core/security.js';
import {
    isAutoBackupSupported,
    loadStoredHandle,
    queryHandlePermission,
    writeJsonToHandle
} from './core/auto-backup.js';

import { AppLogo } from './ui/AppLogo.jsx';
import { NavButton } from './ui/NavButton.jsx';
import { LockScreen } from './ui/LockScreen.jsx';
import { PinGateModal } from './ui/PinGateModal.jsx';
import { NotificationBadge } from './ui/NotificationBadge.jsx';

import { DashboardTab } from './tabs/DashboardTab.jsx';
import { SalesTab } from './tabs/SalesTab.jsx';
import { AppointmentsTab } from './tabs/AppointmentsTab.jsx';
import { CustomersTab } from './tabs/CustomersTab.jsx';
import { ServicesTab } from './tabs/ServicesTab.jsx';
import { ProductsTab } from './tabs/ProductsTab.jsx';
import { FinanceTab } from './tabs/FinanceTab.jsx';
import { IncomeTab } from './tabs/IncomeTab.jsx';
import { CampaignsTab } from './tabs/CampaignsTab.jsx';
import { BackupTab } from './tabs/BackupTab.jsx';

const { useState, useEffect, useRef } = React;

db.seed();

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Kontrol Paneli', icon: Icons.Dashboard },
    { id: 'sales', label: 'Hizmet / Satış Girişi', icon: Icons.Plus },
    { id: 'appointments', label: 'Randevular', icon: Icons.Calendar },
    { id: 'customers', label: 'Müşteriler (CRM)', mobileLabel: 'Müşteriler', icon: Icons.Users },
    { id: 'services', label: 'Hizmet Kataloğu', icon: Icons.Clipboard },
    { id: 'products', label: 'Stok & Market', icon: Icons.Package },
    { id: 'finance', label: 'Kasa & Giderler', icon: Icons.Coins },
    { id: 'income', label: 'Gelir Kayıtları', icon: Icons.TrendingUp },
    { id: 'campaigns', label: 'Kampanyalar', icon: Icons.Percent },
    { id: 'backup', label: 'Sistem & Yedekleme', icon: Icons.Database }
];

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    // Tüm domain state'leri tek hook üzerinden persistlenir; mount'ta localStorage'dan okunur,
    // değişimde aynı anahtara yazılır. db.get'in default'u ile aynı semantiği korur.
    const [users, setUsers] = usePersistentState(DB_KEYS.USERS);
    const [customers, setCustomers] = usePersistentState(DB_KEYS.CUSTOMERS);
    const [services, setServices] = usePersistentState(DB_KEYS.SERVICES);
    const [transactions, setTransactions] = usePersistentState(DB_KEYS.TRANSACTIONS);
    const [appointments, setAppointments] = usePersistentState(DB_KEYS.APPOINTMENTS);
    const [expenses, setExpenses] = usePersistentState(DB_KEYS.EXPENSES);
    const [products, setProducts] = usePersistentState(DB_KEYS.PRODUCTS);
    const [sales, setSales] = usePersistentState(DB_KEYS.SALES);
    const [campaigns, setCampaigns] = usePersistentState(DB_KEYS.CAMPAIGNS);
    const [settings, setSettings] = usePersistentState(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    
    // Sayfa ilk yüklendiğinde PIN güvenliği aktifse panel kilitli başlar; refresh attack'a karşı koruma.
    const [isLocked, setIsLocked] = useState(() => {
        const initial = db.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
        return initial?.pin_security_enabled !== false;
    });
    const [isSensitiveHidden, setIsSensitiveHidden] = useState(true);
    const lastActiveRef = useRef(Date.now());
    const [notification, setNotification] = useState(null);
    const [pinError, setPinError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [quickPlateContext, setQuickPlateContext] = useState('');
    const [pendingFromAppointment, setPendingFromAppointment] = useState(null);
    const [pinGateModal, setPinGateModal] = useState(createEmptyPinGate);
    const [gatePinInput, setGatePinInput] = useState('');

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // Persist effect'leri usePersistentState içine taşındı.

    // Otomatik dosya yedekleme: değişikliklerden sonra debounce'lu yazım.
    // Tek yazıcı app.jsx'tir; BackupTab event'ler üzerinden tetikler.
    const autoBackupHandleRef = useRef(null);
    const autoBackupTimerRef = useRef(null);
    const autoBackupSkipFirstRef = useRef(true);
    const autoBackupWarnedRef = useRef(false);
    // Son başarıyla yazılan veri hash'i (last_backup_at hariç). Aynı veri tekrar
    // yazılmasın ve setSettings(last_backup_at) tetiklemesi loop oluşturmasın diye.
    const lastWrittenHashRef = useRef(null);

    // Render sırasında güncellenen veri snapshot referansı; event handler'ların
    // güncel veriye erişebilmesi için kullanılıyor (state tek bir useEffect deps'ine
    // bağlı kalmadan, ref üzerinden okunuyor).
    const dataRef = useRef(null);
    dataRef.current = { users, customers, services, transactions, appointments, expenses, products, sales, campaigns, settings };

    const computeAutoBackupHash = (data) => {
        if (!data) return '';
        const { settings: s, ...rest } = data;
        const settingsWithoutTimestamp = { ...s };
        delete settingsWithoutTimestamp.last_backup_at;
        return JSON.stringify({ ...rest, settings: settingsWithoutTimestamp });
    };

    const runAutoBackupWrite = async ({ forceImmediate = false } = {}) => {
        const handle = autoBackupHandleRef.current;
        if (!handle) {
            if (forceImmediate) {
                window.dispatchEvent(new CustomEvent('autobackup:write-result', {
                    detail: { success: false, error: new Error('Bağlı yedek konumu yok.') }
                }));
            }
            return false;
        }
        const data = dataRef.current;
        if (!data) return false;
        try {
            const perm = await queryHandlePermission(handle);
            if (perm !== 'granted') {
                if (!autoBackupWarnedRef.current) {
                    autoBackupWarnedRef.current = true;
                    showNotification("Otomatik yedekleme: yazma izni yenilenmeli. Sistem & Yedekleme'den izin verin.", "warning");
                }
                if (forceImmediate) {
                    window.dispatchEvent(new CustomEvent('autobackup:write-result', {
                        detail: { success: false, error: Object.assign(new Error('PERMISSION_REQUIRED'), { code: 'PERMISSION_REQUIRED' }) }
                    }));
                }
                return false;
            }

            const currentHash = computeAutoBackupHash(data);
            if (!forceImmediate && currentHash === lastWrittenHashRef.current) {
                return false;
            }

            const newTimestamp = new Date().toISOString();
            const snapshot = {
                users: data.users,
                customers: data.customers,
                services: data.services,
                transactions: data.transactions,
                appointments: data.appointments,
                expenses: data.expenses,
                products: data.products,
                sales: data.sales,
                campaigns: data.campaigns,
                settings: { ...data.settings, last_backup_at: newTimestamp }
            };

            await writeJsonToHandle(handle, snapshot);
            lastWrittenHashRef.current = currentHash;
            autoBackupWarnedRef.current = false;
            setSettings(prev => ({ ...prev, last_backup_at: newTimestamp }));

            window.dispatchEvent(new CustomEvent('autobackup:write-result', {
                detail: { success: true, timestamp: newTimestamp }
            }));
            return true;
        } catch (err) {
            if (err?.code !== 'PERMISSION_REQUIRED') {
                console.warn('Otomatik yedek yazımı başarısız:', err);
            }
            window.dispatchEvent(new CustomEvent('autobackup:write-result', {
                detail: { success: false, error: err }
            }));
            return false;
        }
    };

    // Mount: handle yükle ve event listener'ları kur.
    useEffect(() => {
        if (!isAutoBackupSupported()) return undefined;
        let cancelled = false;

        loadStoredHandle().then((handle) => {
            if (!cancelled) {
                autoBackupHandleRef.current = handle || null;
                lastWrittenHashRef.current = null;
            }
        }).catch(() => undefined);

        const handleHandleChanged = (event) => {
            const handle = event?.detail?.handle ?? null;
            autoBackupHandleRef.current = handle;
            lastWrittenHashRef.current = null;
        };

        const handleWriteNow = () => {
            if (autoBackupTimerRef.current) {
                clearTimeout(autoBackupTimerRef.current);
                autoBackupTimerRef.current = null;
            }
            void runAutoBackupWrite({ forceImmediate: true });
        };

        window.addEventListener('autobackup:handle-changed', handleHandleChanged);
        window.addEventListener('autobackup:write-now', handleWriteNow);

        return () => {
            cancelled = true;
            window.removeEventListener('autobackup:handle-changed', handleHandleChanged);
            window.removeEventListener('autobackup:write-now', handleWriteNow);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Veri değişimlerinde debounce'lu otomatik yazım.
    useEffect(() => {
        if (autoBackupSkipFirstRef.current) {
            autoBackupSkipFirstRef.current = false;
            return undefined;
        }
        if (!isAutoBackupSupported()) return undefined;

        if (autoBackupTimerRef.current) {
            clearTimeout(autoBackupTimerRef.current);
        }
        autoBackupTimerRef.current = setTimeout(() => {
            void runAutoBackupWrite();
        }, 1500);

        return () => {
            if (autoBackupTimerRef.current) {
                clearTimeout(autoBackupTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users, customers, services, transactions, appointments, expenses, products, sales, campaigns, settings]);

    useEffect(() => {
        // PIN güvenlik kapalıysa idle-lock zamanlayıcısını hiç kurma.
        if (!settings.pin_security_enabled) return undefined;

        const handleActivity = () => {
            lastActiveRef.current = Date.now();
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        const interval = setInterval(() => {
            if (!isLocked) {
                const elapsed = (Date.now() - lastActiveRef.current) / 1000;
                if (elapsed >= (settings.idle_lock_time || 60)) {
                    setIsLocked(true);
                    showNotification("Uzun süre işlem yapılmadığı için ekran kilitlendi.", "warning");
                }
            }
        }, 5000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            clearInterval(interval);
        };
    }, [isLocked, settings.pin_security_enabled, settings.idle_lock_time]);

    // PIN güvenlik kapatılırsa kilidi serbest bırak; tekrar açılırsa hemen kilitle.
    useEffect(() => {
        if (settings.pin_security_enabled === false && isLocked) {
            setIsLocked(false);
        }
    }, [settings.pin_security_enabled, isLocked]);

    const handlePinRecovery = () => {
        setUsers(prev => prev.map(u => u.id === 'admin-1' ? { ...u, pinCode: '1234' } : u));
        resetPinLockState();
        setPinError(false);
        showNotification("PIN kodu 1234 olarak sıfırlandı. Lütfen Sistem & Yedekleme'den yeni bir PIN belirleyin.", "warning");
    };

    const handleUnlock = (enteredPin) => {
        if (isPinLockedOut()) {
            setPinError(true);
            setTimeout(() => setPinError(false), 2000);
            showNotification("Çok fazla hatalı deneme. Lütfen bekleyin.", "error");
            return;
        }
        const admin = users.find(u => u.pinCode === enteredPin);
        if (admin) {
            resetPinLockState();
            setIsLocked(false);
            setPinError(false);
            lastActiveRef.current = Date.now();
            showNotification(`Hoş geldiniz, ${admin.name}!`);
        } else {
            const next = recordFailedPinAttempt();
            setPinError(true);
            setTimeout(() => setPinError(false), 2000);
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
                setGatePinInput('');
            },
            onFail: () => {
                setPinGateModal(createEmptyPinGate());
                setGatePinInput('');
            },
            customText
        });
    };

    const handlePinGateSubmit = () => {
        if (isPinLockedOut()) {
            showNotification("Çok fazla hatalı deneme. Lütfen bekleyin.", "error");
            return;
        }
        const admin = users.find(u => u.pinCode === gatePinInput);
        if (admin) {
            resetPinLockState();
            if (pinGateModal.onSuccess) pinGateModal.onSuccess();
        } else {
            const next = recordFailedPinAttempt();
            setGatePinInput('');
            if (next.lockedUntil > Date.now()) {
                showNotification("Hatalı deneme limiti aşıldı. Bu işlem geçici olarak kilitlendi.", "error");
                if (pinGateModal.onFail) pinGateModal.onFail();
            } else {
                showNotification("Hatalı PIN kodu girdiniz!", "error");
                // Modal açık kalır; kullanıcı yeniden dener.
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-darkBg-deep text-gray-200">
            {isLocked && <LockScreen users={users} handleUnlock={handleUnlock} pinError={pinError} onPinReset={handlePinRecovery} />}

            <PinGateModal 
                isOpen={pinGateModal.isOpen}
                customText={pinGateModal.customText}
                gatePin={gatePinInput}
                setGatePin={setGatePinInput}
                onFail={() => { if (pinGateModal.onFail) pinGateModal.onFail(); }}
                onSubmit={handlePinGateSubmit}
            />

            <NotificationBadge notification={notification} />

            {/* SIDEBAR FOR DESKTOP VIEW */}
            <aside className="hidden md:flex flex-col w-64 bg-darkBg-card/80 backdrop-blur-sm border-r border-darkBg-border flex-shrink-0 h-screen sticky top-0 overflow-hidden">
                {/* Top brand surface with subtle bloom */}
                <div className="relative p-5 pb-4 shrink-0 border-b border-darkBg-border">
                    <span
                        className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-brand-500/15 blur-3xl pointer-events-none"
                        aria-hidden="true"
                    />
                    <div className="relative">
                        <AppLogo />
                    </div>
                </div>

                <div className="px-5 pt-4 pb-2 shrink-0">
                    <span className="block text-[10px] font-extrabold tracking-[0.22em] uppercase text-gray-500">
                        Modüller
                    </span>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 text-xs">
                    {NAV_ITEMS.map(item => (
                        <NavButton
                            key={item.id}
                            item={item}
                            activeTab={activeTab}
                            onSelect={setActiveTab}
                        />
                    ))}
                </nav>

                <div className="p-4 pt-3 border-t border-darkBg-border space-y-3 shrink-0">
                    <div className="relative overflow-hidden bg-darkBg-deep border border-darkBg-border rounded-lg px-3 py-2.5 flex items-center justify-between">
                        <span
                            className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-brand-500/15 blur-2xl pointer-events-none"
                            aria-hidden="true"
                        />
                        <div className="relative flex items-center gap-2 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 ring-1 ring-brand-300/30 shadow-[0_8px_18px_-8px_rgba(6,182,212,0.7)]">
                                A
                            </span>
                            <div className="min-w-0">
                                <span className="block text-[9px] text-gray-500 leading-tight uppercase tracking-[0.18em] font-bold">Oturum</span>
                                <span className="block text-xs font-bold text-gray-100 truncate">Admin</span>
                            </div>
                        </div>
                        <span className="relative inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                            Lokal
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setIsLocked(true);
                            showNotification("Panel kilitlendi.", "warning");
                        }}
                        className="w-full bg-darkBg-deep hover:bg-rose-950/30 hover:border-rose-500/40 hover:text-rose-200 border border-darkBg-border text-gray-300 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition group"
                    >
                        <svg className="w-4 h-4 transition group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="tracking-wide">Ekranı Kilitle</span>
                    </button>
                </div>
            </aside>

            {/* MOBILE NAVIGATION BAR */}
            <header className="md:hidden sticky top-0 bg-darkBg-card/90 backdrop-blur-md border-b border-darkBg-border p-4 flex justify-between items-center z-20">
                <AppLogo compact />
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 bg-darkBg-deep rounded-lg text-gray-300 hover:text-brand-200 hover:border-brand-500/40 border border-darkBg-border transition"
                    aria-label="Menüyü aç/kapat"
                    aria-expanded={mobileMenuOpen}
                >
                    <Icons.Menu />
                </button>
            </header>

            {/* MOBILE MENU DROPDOWN */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-darkBg-card/95 backdrop-blur border-b border-darkBg-border text-xs flex flex-col p-4 space-y-2 z-20">
                    {NAV_ITEMS.map(item => (
                        <NavButton
                            key={item.id}
                            item={item}
                            activeTab={activeTab}
                            mobile
                            onSelect={(id) => {
                                setActiveTab(id);
                                setMobileMenuOpen(false);
                            }}
                        />
                    ))}
                    <hr className="border-darkBg-border my-2" />
                    <button
                        type="button"
                        onClick={() => {
                            setIsLocked(true);
                            setMobileMenuOpen(false);
                        }}
                        className="w-full py-2.5 bg-rose-950/30 text-rose-200 border border-rose-500/30 rounded-lg font-bold text-center hover:bg-rose-950/50 transition"
                    >
                        Ekranı Kilitle (PIN)
                    </button>
                </div>
            )}

            {/* MAIN CONTENT WRAPPER */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-full">
                <div className="max-w-6xl mx-auto h-full">
                    {activeTab === 'dashboard' && (
                        <DashboardTab 
                            transactions={transactions}
                            expenses={expenses}
                            appointments={appointments}
                            customers={customers}
                            sales={sales}
                            setActiveTab={setActiveTab}
                            setQuickPlateContext={setQuickPlateContext}
                            isSensitiveHidden={isSensitiveHidden}
                            setIsSensitiveHidden={setIsSensitiveHidden}
                            requestPinApproval={requestPinApproval}
                            settings={settings}
                        />
                    )}
                    
                    {activeTab === 'sales' && (
                        <SalesTab 
                            customers={customers}
                            setCustomers={setCustomers}
                            services={services}
                            transactions={transactions}
                            setTransactions={setTransactions}
                            campaigns={campaigns}
                            settings={settings}
                            quickPlateContext={quickPlateContext}
                            setQuickPlateContext={setQuickPlateContext}
                            pendingFromAppointment={pendingFromAppointment}
                            setPendingFromAppointment={setPendingFromAppointment}
                            appointments={appointments}
                            setAppointments={setAppointments}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'appointments' && (
                        <AppointmentsTab 
                            appointments={appointments}
                            setAppointments={setAppointments}
                            customers={customers}
                            setCustomers={setCustomers}
                            services={services}
                            setQuickPlateContext={setQuickPlateContext}
                            setPendingFromAppointment={setPendingFromAppointment}
                            setActiveTab={setActiveTab}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'customers' && (
                        <CustomersTab 
                            customers={customers}
                            setCustomers={setCustomers}
                            transactions={transactions}
                            setTransactions={setTransactions}
                            appointments={appointments}
                            setAppointments={setAppointments}
                            sales={sales}
                            setSales={setSales}
                            products={products}
                            setProducts={setProducts}
                            services={services}
                            settings={settings}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'services' && (
                        <ServicesTab 
                            services={services}
                            setServices={setServices}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'products' && (
                        <ProductsTab 
                            products={products}
                            setProducts={setProducts}
                            sales={sales}
                            setSales={setSales}
                            customers={customers}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'finance' && (
                        <FinanceTab 
                            transactions={transactions}
                            expenses={expenses}
                            setExpenses={setExpenses}
                            sales={sales}
                            isSensitiveHidden={isSensitiveHidden}
                            setIsSensitiveHidden={setIsSensitiveHidden}
                            requestPinApproval={requestPinApproval}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'income' && (
                        <IncomeTab
                            transactions={transactions}
                            setTransactions={setTransactions}
                            sales={sales}
                            setSales={setSales}
                            products={products}
                            setProducts={setProducts}
                            customers={customers}
                            services={services}
                            isSensitiveHidden={isSensitiveHidden}
                            setIsSensitiveHidden={setIsSensitiveHidden}
                            requestPinApproval={requestPinApproval}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'campaigns' && (
                        <CampaignsTab 
                            campaigns={campaigns}
                            setCampaigns={setCampaigns}
                            services={services}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'backup' && (
                        <BackupTab 
                            users={users}
                            customers={customers}
                            services={services}
                            transactions={transactions}
                            appointments={appointments}
                            expenses={expenses}
                            products={products}
                            sales={sales}
                            campaigns={campaigns}
                            setUsers={setUsers}
                            setCustomers={setCustomers}
                            setServices={setServices}
                            setTransactions={setTransactions}
                            setAppointments={setAppointments}
                            setExpenses={setExpenses}
                            setProducts={setProducts}
                            setSales={setSales}
                            setCampaigns={setCampaigns}
                            settings={settings}
                            setSettings={setSettings}
                            showNotification={showNotification}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
