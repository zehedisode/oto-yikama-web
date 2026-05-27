const { useEffect, useState } = React;

import { DEFAULT_SETTINGS, parsePositiveInteger, PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '../core/app-core.js';
import { createCleanDatabase, persistDatabaseObject } from '../core/db.js';
import {
    isAutoBackupSupported,
    loadStoredHandle,
    pickAndStoreHandle,
    clearStoredHandle,
    queryHandlePermission,
    requestHandlePermission,
    describeHandle
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

    const clearDatabaseCompletely = () => {
        applyDatabaseState(createCleanDatabase());
        setResetConfirm(false);
        showNotification("Tüm işlem verileri silindi. Sistem temiz başlangıç durumuna alındı.", "warning");
    };

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
            // app.jsx tarafına yeni handle'ı duyur; tek yazıcı orası.
            window.dispatchEvent(new CustomEvent('autobackup:handle-changed', { detail: { handle } }));
            // İlk yazımı app.jsx üzerinden tetikle (zaman damgasını ve hash'i
            // tek noktadan günceller, çift yazımı engeller).
            window.dispatchEvent(new CustomEvent('autobackup:write-now'));
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
            // İzin alındı; yazımı app.jsx üstlensin.
            window.dispatchEvent(new CustomEvent('autobackup:write-now'));
            showNotification("İzin yenilendi, yedek dosyası güncelleniyor.");
        } else {
            showNotification("Yazma izni reddedildi.", "warning");
        }
    };

    const handleAutoBackupNow = async () => {
        if (!autoHandle) return;
        try {
            setAutoBusy(true);
            const result = await new Promise((resolve) => {
                const onDone = (event) => {
                    window.removeEventListener('autobackup:write-result', onDone);
                    resolve(event?.detail || { success: false });
                };
                window.addEventListener('autobackup:write-result', onDone, { once: true });
                window.dispatchEvent(new CustomEvent('autobackup:write-now'));
                // Güvenlik fallback'i: 5 sn içinde sonuç gelmezse promise'i kapat.
                setTimeout(() => {
                    window.removeEventListener('autobackup:write-result', onDone);
                    resolve({ success: false, error: new Error('timeout') });
                }, 5000);
            });
            if (result.success) {
                showNotification("Yedek dosyası güncellendi.");
            } else if (result.error?.code === 'PERMISSION_REQUIRED') {
                showNotification("Önce izni yenileyin.", "warning");
                setAutoPermission('prompt');
            } else if (result.error) {
                showNotification("Yazma hatası: " + (result.error.message || 'hata'), "error");
            }
        } finally {
            setAutoBusy(false);
        }
    };

    const handleAutoBackupDisconnect = async () => {
        await clearStoredHandle();
        setAutoHandle(null);
        setAutoPermission('unknown');
        // app.jsx tarafındaki ref'i de temizle.
        window.dispatchEvent(new CustomEvent('autobackup:handle-changed', { detail: { handle: null } }));
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
                description="Otomatik yedekleme bağlantısını yönetin ve erişim parametrelerini yapılandırın."
            />

            <div className="grid grid-cols-1 gap-6 text-xs text-left">
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
                            <span>Bu tarayıcı File System Access API'sini desteklemiyor. Otomatik yedekleme için <b>Chrome</b> veya <b>Edge</b> kullanın.</span>
                        </div>
                    )}

                    {autoSupported && !autoHandle && (
                        <div className="space-y-2">
                            <div className="bg-darkBg-deep border border-darkBg-border rounded p-3 space-y-1.5">
                                <p className="text-[11px] text-gray-300 font-bold">Nasıl çalışır?</p>
                                <ol className="text-[11px] text-gray-400 list-decimal list-inside space-y-0.5">
                                    <li>Aşağıdaki butona tıklayın</li>
                                    <li>OneDrive / Drive / USB klasörünüzü seçin</li>
                                    <li>İçine <span className="text-brand-300 font-bold">zehedisode_yedek.json</span> dosyası otomatik oluşur</li>
                                    <li>Her değişiklikte aynı dosya sessizce güncellenir</li>
                                </ol>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoBackupConnect}
                                disabled={autoBusy}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-2.5 rounded transition flex items-center justify-center gap-2"
                            >
                                <Icons.Plus />
                                <span>{autoBusy ? 'Bağlanıyor...' : 'Yedek Klasörü Bağla'}</span>
                            </button>
                        </div>
                    )}

                    {autoSupported && autoHandle && (
                        <div className="space-y-2">
                            {(() => {
                                const info = describeHandle(autoHandle);
                                return (
                                    <div className="bg-darkBg-deep border border-darkBg-border rounded p-3 space-y-1">
                                        {info.folderName && (
                                            <div className="flex justify-between items-start gap-2 text-[11px]">
                                                <span className="text-gray-400 shrink-0">Klasör:</span>
                                                <span className="text-emerald-300 font-bold truncate text-right" title={info.folderName}>
                                                    {info.folderName}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start gap-2 text-[11px]">
                                            <span className="text-gray-400 shrink-0">Yedek dosyası:</span>
                                            <span className="text-emerald-300 font-bold truncate text-right" title={info.fileName || ''}>
                                                {info.fileName || '—'}
                                            </span>
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
                                            Tarayıcı güvenlik kuralları gereği tam disk yolu (C:\\...) gösterilemez. {info.kind === 'directory' ? 'Klasör adı seçtiğiniz konumla eşleşir.' : 'Eski sürümden devreden tek dosya bağlantısı; yeni klasör bağlamak için Bağlantıyı Kaldır.'}
                                        </p>
                                    </div>
                                );
                            })()}

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
                                    onClick={handleAutoBackupDisconnect}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-2 rounded transition"
                                >
                                    Bağlantıyı Kaldır
                                </button>
                            </div>
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
