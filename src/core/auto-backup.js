/* Otomatik dosyaya yedekleme (File System Access API).
 * Kullanıcı bir kez KLASÖR seçer (örn. OneDrive/Drive/USB klasörü); panel her
 * veri değişiminde o klasör içindeki sabit isimli yedek dosyasını sessizce
 * günceller. Kullanıcıya klasör adını + dosya adını birlikte gösterebiliriz.
 *
 * Notlar:
 *  - showDirectoryPicker yalnızca Chromium tabanlı tarayıcılarda mevcuttur.
 *  - Tarayıcı tam disk yolunu (C:\...) JavaScript'e vermez; en fazla seçilen
 *    klasörün görünen adıdır (örn. "OneDrive - Soner").
 *  - Eski sürüm tek bir DOSYA handle'ı saklıyordu. Geriye uyum için
 *    writeJsonToHandle hem 'file' hem 'directory' kind'ını destekler.
 */

const DB_NAME = 'zehedisode-autobackup';
const DB_VERSION = 1;
const STORE = 'handles';
const HANDLE_KEY = 'primary-handle';

// Klasör seçildiğinde içine yazılacak sabit yedek dosyası adı.
export const BACKUP_FILE_NAME = 'zehedisode_yedek.json';

export const isAutoBackupSupported = () => {
    if (typeof window === 'undefined') return false;
    // Klasör seçici tercih edilir; eski sürümle bağlı kalan kullanıcılar için
    // showSaveFilePicker fallback'i de yeterli.
    return typeof window.showDirectoryPicker === 'function'
        || typeof window.showSaveFilePicker === 'function';
};

const openDb = () => new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB desteği yok.'));
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB açılamadı.'));
});

const idbGet = async (key) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
};

const idbSet = async (key, value) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};

const idbDelete = async (key) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};

export const loadStoredHandle = async () => {
    if (!isAutoBackupSupported()) return null;
    try {
        return await idbGet(HANDLE_KEY);
    } catch (e) {
        console.warn('Auto-backup handle okunamadı:', e);
        return null;
    }
};

export const clearStoredHandle = async () => {
    try {
        await idbDelete(HANDLE_KEY);
        return true;
    } catch (e) {
        console.warn('Auto-backup handle silinemedi:', e);
        return false;
    }
};

/** İzin durumu: 'granted' | 'prompt' | 'denied' | 'unavailable'. */
export const queryHandlePermission = async (handle) => {
    if (!handle || typeof handle.queryPermission !== 'function') return 'unavailable';
    try {
        return await handle.queryPermission({ mode: 'readwrite' });
    } catch (e) {
        return 'denied';
    }
};

/** Yalnızca kullanıcı eyleminden (click) çağrılmalı; aksi halde 'denied' dönebilir. */
export const requestHandlePermission = async (handle) => {
    if (!handle || typeof handle.requestPermission !== 'function') return 'unavailable';
    try {
        return await handle.requestPermission({ mode: 'readwrite' });
    } catch (e) {
        return 'denied';
    }
};

/**
 * Kullanıcıya bir KLASÖR seçtirir (varsa) ve handle'ı kalıcı saklar.
 * Klasör seçici desteklenmiyorsa eski usul tek dosya seçiciye düşer.
 */
export const pickAndStoreHandle = async () => {
    if (typeof window === 'undefined') {
        throw new Error('Tarayıcı ortamı gerekli.');
    }
    let handle;
    if (typeof window.showDirectoryPicker === 'function') {
        handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } else if (typeof window.showSaveFilePicker === 'function') {
        const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        handle = await window.showSaveFilePicker({
            suggestedName: `zehedisode_yedek_${dateStamp}.json`,
            types: [
                {
                    description: 'Zehedisode JSON yedek dosyası',
                    accept: { 'application/json': ['.json'] }
                }
            ],
            excludeAcceptAllOption: false
        });
    } else {
        throw new Error('Tarayıcı File System Access API desteklemiyor (Chrome/Edge gerekli).');
    }
    await idbSet(HANDLE_KEY, handle);
    return handle;
};

/**
 * Handle bir KLASÖR ise içindeki BACKUP_FILE_NAME dosyasına yazar; yoksa
 * oluşturur. Handle bir DOSYA ise (eski sürüm) doğrudan o dosyaya yazar.
 * İzin yoksa hata fırlatır.
 */
export const writeJsonToHandle = async (handle, dataObject) => {
    if (!handle) throw new Error('Geçersiz dosya tanıtıcısı.');
    const perm = await queryHandlePermission(handle);
    if (perm !== 'granted') {
        throw Object.assign(new Error('PERMISSION_REQUIRED'), { code: 'PERMISSION_REQUIRED' });
    }

    let fileHandle = handle;
    if (handle.kind === 'directory') {
        fileHandle = await handle.getFileHandle(BACKUP_FILE_NAME, { create: true });
    }

    const writable = await fileHandle.createWritable();
    try {
        const text = JSON.stringify(dataObject, null, 2);
        await writable.write(text);
    } finally {
        await writable.close();
    }
    return true;
};

/**
 * UI gösterimi için handle bilgisini düzleştir.
 * - directory ise: klasör adı + sabit dosya adı
 * - file ise: dosya adı
 */
export const describeHandle = (handle) => {
    if (!handle) return { kind: null, folderName: null, fileName: null };
    if (handle.kind === 'directory') {
        return { kind: 'directory', folderName: handle.name || null, fileName: BACKUP_FILE_NAME };
    }
    return { kind: 'file', folderName: null, fileName: handle.name || null };
};
