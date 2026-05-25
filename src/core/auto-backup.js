/* Otomatik dosyaya yedekleme (File System Access API).
 * Kullanıcı bir kez konum seçer (örn. OneDrive/Drive klasörü); sonra panel
 * her veri değişiminde sessizce o dosyayı günceller.
 *
 * Notlar:
 *  - showSaveFilePicker yalnızca Chromium tabanlı tarayıcılarda mevcuttur (Chrome/Edge/Brave).
 *  - FileSystemFileHandle JSON'a serileştirilemediği için IndexedDB'de saklanır.
 *  - Tarayıcı yeniden açıldığında izin "prompt" durumuna düşebilir; ilk yazımda bir
 *    kullanıcı eylemiyle (buton tıklaması) yeniden onay istenir.
 */

const DB_NAME = 'zehedisode-autobackup';
const DB_VERSION = 1;
const STORE = 'handles';
const HANDLE_KEY = 'primary-handle';

export const isAutoBackupSupported = () => {
    if (typeof window === 'undefined') return false;
    return typeof window.showSaveFilePicker === 'function';
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

/** Kullanıcıya yeni bir hedef dosya seçtirir ve handle'ı kalıcı saklar. */
export const pickAndStoreHandle = async () => {
    if (!isAutoBackupSupported()) {
        throw new Error('Tarayıcı otomatik yedeklemeyi desteklemiyor (Chrome/Edge gerekli).');
    }
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const handle = await window.showSaveFilePicker({
        suggestedName: `zehedisode_yedek_${dateStamp}.json`,
        types: [
            {
                description: 'Zehedisode JSON yedek dosyası',
                accept: { 'application/json': ['.json'] }
            }
        ],
        excludeAcceptAllOption: false
    });
    await idbSet(HANDLE_KEY, handle);
    return handle;
};

/** Handle'a JSON yazar. Önce izin kontrolü yapar; izin yoksa hata fırlatır. */
export const writeJsonToHandle = async (handle, dataObject) => {
    if (!handle) throw new Error('Geçersiz dosya tanıtıcısı.');
    const perm = await queryHandlePermission(handle);
    if (perm !== 'granted') {
        throw Object.assign(new Error('PERMISSION_REQUIRED'), { code: 'PERMISSION_REQUIRED' });
    }
    const writable = await handle.createWritable();
    try {
        const text = JSON.stringify(dataObject, null, 2);
        await writable.write(text);
    } finally {
        await writable.close();
    }
    return true;
};
