const { useEffect, useState } = React;

import { DEFAULT_SETTINGS, parsePositiveInteger, hasOwn } from '../core/app-core.js';
import { createCleanDatabase, normalizeBackupData, persistDatabaseObject } from '../core/db.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { CustomConfirmModal } from '../ui/ConfirmModal.jsx';
import { Icons } from '../core/icons.jsx';

export const BackupTab = ({ 
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
    const [pinSetting, setPinSetting] = useState(users[0]?.pinCode || '1234');
    const [targetVisits, setTargetVisits] = useState(settings.loyalty_target_visits || 5);
    const [idleTime, setIdleTime] = useState(settings.idle_lock_time || 60);
    const [pinSecurityEnabled, setPinSecurityEnabled] = useState(
        settings.pin_security_enabled !== false
    );

    const [resetConfirm, setResetConfirm] = useState(false);

    useEffect(() => {
        setPinSetting(users[0]?.pinCode || '1234');
    }, [users]);

    useEffect(() => {
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
        const cleanPin = pinSetting.replace(/\D/g, '');
        const parsedTargetVisits = Math.max(1, parsePositiveInteger(targetVisits, DEFAULT_SETTINGS.loyalty_target_visits));
        const parsedIdleTime = Math.max(15, parsePositiveInteger(idleTime, DEFAULT_SETTINGS.idle_lock_time));

        if (cleanPin.length !== 4) {
            showNotification("PIN kodu 4 haneli olmalıdır.", "error");
            return;
        }

        setUsers(prev => prev.map(u => u.id === 'admin-1' ? { ...u, pinCode: cleanPin } : u));
        setSettings(prev => ({
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
        const downloadAnchor = document.createElement('a');
        
        const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
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
                const knownKeys = ['users', 'customers', 'services', 'transactions', 'appointments', 'expenses', 'products', 'sales', 'campaigns', 'settings'];
                const hasKnownKey = parsedData && typeof parsedData === 'object' && knownKeys.some(k => hasOwn(parsedData, k));

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

    return (
        <div className="space-y-6 text-left">
            <CustomConfirmModal 
                isOpen={resetConfirm}
                title="Veritabanını Tamamen Sıfırla?"
                message="DİKKAT! Tüm veritabanını sıfırlamak ve tüm verileri silmek istediğinize emin misiniz? Bu işlem kesinlikle geri alınamaz."
                onConfirm={clearDatabaseCompletely}
                onCancel={() => setResetConfirm(false)}
            />

            <PageHeader
                title="Sistem Yedekleme & Ayarlar"
                description="Yerel yedekler oluşturun, geri yükleyin ve erişim parametrelerini yapılandırın."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-left">
                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4">
                    <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                        <Icons.Database />
                        <span>Veri Yedekleme ve Kurtarma (JSON)</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                        Sunucusuz yerel altyapıda verileriniz yalnızca tarayıcınızda yaşar. Bilgisayarınızı değiştirirken veya her günün sonunda yedek dosyasını mutlaka bilgisayarınıza indirin.
                    </p>

                    <div className="space-y-4 pt-2">
                        <div>
                            <h4 className="font-bold text-white mb-2">1. Yedeği İndir (Dışa Aktar)</h4>
                            <button 
                                type="button"
                                onClick={handleExportBackup}
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded transition text-center"
                            >
                                Yedek JSON Dosyasını İndir (.json)
                            </button>
                        </div>

                        <div className="border-t border-darkBg-border pt-4">
                            <h4 className="font-bold text-white mb-2">2. Yedeği Geri Yükle (İçe Aktar)</h4>
                            <label className="block w-full text-center border border-dashed border-gray-700 bg-darkBg-deep rounded p-4 hover:border-brand-500 cursor-pointer transition">
                                <span className="text-xs text-gray-400 block mb-1">JSON Uzantılı Yedek Dosyasını Seçin</span>
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onChange={handleImportBackup}
                                    className="hidden" 
                                />
                                <span className="bg-brand-500/20 text-brand-300 font-bold py-1 px-3 rounded text-[10px] inline-block mt-1">Dosya Seç</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4">
                    <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                        <Icons.Lock />
                        <span>Sistem Güvenlik & İş Kuralları</span>
                    </h3>

                    <form onSubmit={saveSettings} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-gray-400 block font-semibold">Giriş / Yönetici PIN Kodu (4 Hane)</label>
                            <input 
                                type="password" 
                                maxLength={4}
                                value={pinSetting} 
                                onChange={(e) => setPinSetting(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white font-bold tracking-widest text-center" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Sadakat Hediye Hedefi</label>
                                <input 
                                    type="number" 
                                    value={targetVisits} 
                                    onChange={(e) => setTargetVisits(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-400 block font-semibold">Kilitleme Süresi (Saniye)</label>
                                <input 
                                    type="number" 
                                    value={idleTime} 
                                    onChange={(e) => setIdleTime(e.target.value)}
                                    className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white" 
                                />
                            </div>
                        </div>

                        <label className="flex items-center justify-between bg-darkBg-deep border border-darkBg-border rounded p-3 cursor-pointer">
                            <div className="text-left">
                                <span className="font-semibold text-gray-200 block">PIN Güvenlik Kilidi</span>
                                <span className="text-[10px] text-gray-500">Hassas alanlar ve boşta kilit için PIN onayı.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={pinSecurityEnabled}
                                onChange={(e) => setPinSecurityEnabled(e.target.checked)}
                                className="w-4 h-4 rounded text-brand-600 bg-darkBg-deep focus:ring-brand-500 border-gray-700"
                            />
                        </label>

                        <button 
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded transition"
                        >
                            Ayarları Kaydet & Güncelle
                        </button>
                    </form>

                    <div className="border-t border-darkBg-border pt-4">
                        <h4 className="font-bold text-red-400 mb-2">Tehlikeli Bölge</h4>
                        <button 
                            type="button"
                            onClick={() => setResetConfirm(true)}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded transition"
                        >
                            Tüm Veritabanını Temizle / Sıfırla
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
