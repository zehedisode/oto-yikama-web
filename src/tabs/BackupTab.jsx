const { useEffect, useState } = React;

import { DEFAULT_SETTINGS, parsePositiveInteger, hasOwn, PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '../core/app-core.js';
import { createCleanDatabase, normalizeBackupData, persistDatabaseObject } from '../core/db.js';
import {
    isAutoBackupSupported,
    loadStoredHandle,
    pickAndStoreHandle,
    clearStoredHandle,
    queryHandlePermission,
    requestHandlePermission,
    writeJsonToHandle
} from '../core/auto-backup.js';
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

    // Otomatik dosyaya yedekleme durumu
    const autoSupported = isAutoBackupSupported();
    const [autoHandle, setAutoHandle] = useState(null);
    const [autoPermission, setAutoPermission] = useState('unknown');
    const [autoBusy, setAutoBusy] = useState(false);

    useEffect(() => {
        if (!autoSupported) return;
        let cancelled = false;
        (async () => {
            const handle = await loadStoredHandle();
            if (cancelled || !handle) return;
            setAutoHandle(handle);
            const perm = await queryHandlePermission(handle);
            if (!cancelled) setAutoPermission(perm);
        })();
        return () => { cancelled = true; };
    }, [autoSupported]);

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

        if (cleanPin.length < PIN_MIN_LENGTH || cleanPin.length > PIN_MAX_LENGTH) {
            showNotification(`PIN kodu ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} hane arası olmalıdır.`, "error");
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

        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, last_backup_at: new Date().toISOString() }));
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

    const buildSnapshot = () => ({
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
    });

    const handleAutoBackupConnect = async () => {
        if (!autoSupported) {
            showNotification("Bu tarayıcı otomatik yedeklemeyi desteklemiyor. Chrome veya Edge önerilir.", "error");
            return;
        }
        try {
            setAutoBusy(true);
            const handle = await pickAndStoreHandle();
            setAutoHandle(handle);
            const perm = await queryHandlePermission(handle);
            setAutoPermission(perm);
            // İlk yazımı hemen yap.
            await writeJsonToHandle(handle, buildSnapshot());
            setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, last_backup_at: new Date().toISOString() }));
            showNotification("Otomatik yedekleme bağlandı. Tüm değişiklikler artık dosyaya yazılacak.");
        } catch (err) {
            if (err && err.name === 'AbortError') return;
            console.error('Auto-backup connect error:', err);
            showNotification("Otomatik yedekleme bağlanamadı: " + (err?.message || 'bilinmeyen hata'), "error");
        } finally {
            setAutoBusy(false);
        }
    };

    const handleAutoBackupGrant = async () => {
        if (!autoHandle) return;
        const perm = await requestHandlePermission(autoHandle);
        setAutoPermission(perm);
        if (perm === 'granted') {
            try {
                await writeJsonToHandle(autoHandle, buildSnapshot());
                setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, last_backup_at: new Date().toISOString() }));
                showNotification("İzin yenilendi ve dosya güncellendi.");
            } catch (err) {
                showNotification("Dosyaya yazılamadı: " + (err?.message || 'hata'), "error");
            }
        } else {
            showNotification("Yazma izni reddedildi.", "warning");
        }
    };

    const handleAutoBackupNow = async () => {
        if (!autoHandle) return;
        try {
            setAutoBusy(true);
            await writeJsonToHandle(autoHandle, buildSnapshot());
            setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, last_backup_at: new Date().toISOString() }));
            showNotification("Yedek dosyası güncellendi.");
        } catch (err) {
            if (err?.code === 'PERMISSION_REQUIRED') {
                showNotification("Önce izni yenileyin.", "warning");
                setAutoPermission('prompt');
            } else {
                showNotification("Yazma hatası: " + (err?.message || 'hata'), "error");
            }
        } finally {
            setAutoBusy(false);
        }
    };

    const handleAutoBackupDisconnect = async () => {
        await clearStoredHandle();
        setAutoHandle(null);
        setAutoPermission('unknown');
        showNotification("Otomatik yedekleme kaldırıldı.", "warning");
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

                <div className="bg-darkBg-card border border-emerald-500/30 rounded-xl p-5 shadow space-y-4">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                                <Icons.Download />
                                <span>Otomatik Dosya Yedekleme</span>
                            </h3>
                            <p className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider mt-1">Bir kez seç, unut</p>
                        </div>
                        {autoHandle && autoPermission === 'granted' && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-extrabold whitespace-nowrap shrink-0">AKTİF</span>
                        )}
                        {autoHandle && autoPermission !== 'granted' && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-extrabold whitespace-nowrap shrink-0">İZİN GEREKLİ</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        Bir kez konum (örn. <span className="text-brand-300 font-bold">OneDrive</span>, <span className="text-brand-300 font-bold">Drive klasörü</span>, USB) seçin. Veri her değiştiğinde panel o JSON dosyasını sessizce günceller.
                    </p>

                    {!autoSupported && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded p-3 text-amber-200 text-[11px]">
                            <span className="shrink-0 mt-0.5"><Icons.AlertTriangle /></span>
                            <span>Bu tarayıcı File System Access API'sini desteklemiyor. Otomatik yedekleme için <b>Chrome</b> veya <b>Edge</b> kullanın. Manuel yedekleme yine sol kartta çalışıyor.</span>
                        </div>
                    )}

                    {autoSupported && !autoHandle && (
                        <div className="space-y-2">
                            <div className="bg-darkBg-deep border border-darkBg-border rounded p-3 space-y-1.5">
                                <p className="text-[11px] text-gray-300 font-bold">Nasıl çalışır?</p>
                                <ol className="text-[11px] text-gray-400 list-decimal list-inside space-y-0.5">
                                    <li>Aşağıdaki butona tıklayın</li>
                                    <li>OneDrive/Drive/USB klasörünüzü seçin</li>
                                    <li>Bir dosya adı verin (varsayılan otomatik gelir)</li>
                                    <li>Bittiniz. Her değişiklikte dosya yenilenir.</li>
                                </ol>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoBackupConnect}
                                disabled={autoBusy}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-2.5 rounded transition flex items-center justify-center gap-2"
                            >
                                <Icons.Plus />
                                <span>{autoBusy ? 'Bağlanıyor...' : 'Yedek Konumu Bağla'}</span>
                            </button>
                        </div>
                    )}

                    {autoSupported && autoHandle && (
                        <div className="space-y-2">
                            <div className="bg-darkBg-deep border border-darkBg-border rounded p-3 space-y-1">
                                <div className="flex justify-between items-start gap-2 text-[11px]">
                                    <span className="text-gray-400 shrink-0">Yedek dosyası:</span>
                                    <span className="text-emerald-300 font-bold truncate text-right" title={autoHandle.name}>{autoHandle.name || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-400">Son yazım:</span>
                                    <span className="text-gray-200 font-bold">
                                        {settings.last_backup_at ? new Date(settings.last_backup_at).toLocaleString('tr-TR') : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-400">Durum:</span>
                                    <span className={`font-bold ${autoPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {autoPermission === 'granted' ? 'İzin verildi' : autoPermission === 'prompt' ? 'İzin yenilenmeli' : autoPermission === 'denied' ? 'İzin reddedildi' : 'Bilinmiyor'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-snug pt-1 border-t border-darkBg-border/60 mt-1">
                                    Tarayıcı güvenlik kuralları gereği tam dosya yolu gösterilemez. Konumu değiştirmek için aşağıdaki <span className="text-brand-300 font-bold">Konumu Değiştir</span> butonunu kullanın.
                                </p>
                            </div>

                            {autoPermission !== 'granted' && (
                                <button
                                    type="button"
                                    onClick={handleAutoBackupGrant}
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded transition"
                                >
                                    İzni Yenile
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={handleAutoBackupNow}
                                    disabled={autoBusy}
                                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold py-2 rounded transition"
                                >
                                    {autoBusy ? 'Yazılıyor...' : 'Şimdi Yedekle'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAutoBackupConnect}
                                    disabled={autoBusy}
                                    className="bg-darkBg-deep hover:bg-darkBg-border border border-brand-500/40 text-brand-300 font-bold py-2 rounded transition disabled:opacity-60"
                                >
                                    Konumu Değiştir
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoBackupDisconnect}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-2 rounded transition"
                            >
                                Bağlantıyı Kaldır
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 text-xs text-left">

                <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow space-y-4">
                    <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                        <Icons.Lock />
                        <span>Sistem Güvenlik & İş Kuralları</span>
                    </h3>

                    <form onSubmit={saveSettings} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-gray-400 block font-semibold">Giriş / Yönetici PIN Kodu ({PIN_MIN_LENGTH}-{PIN_MAX_LENGTH} Hane)</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={PIN_MAX_LENGTH}
                                value={pinSetting}
                                onChange={(e) => setPinSetting(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
                                className="w-full bg-darkBg-deep border border-darkBg-border p-2 rounded text-white font-bold tracking-widest text-center"
                            />
                            <p className="text-[10px] text-gray-500">Sadece rakam. En az {PIN_MIN_LENGTH}, en fazla {PIN_MAX_LENGTH} hane.</p>
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
