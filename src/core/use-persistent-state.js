// app.jsx içinde 10 ayrı useState + useEffect(() => db.set(KEY, x), [x])
// blokunu tek bir hook'a indirir.
//
// Kullanım:
//   const [users, setUsers] = usePersistentState(DB_KEYS.USERS);
//   const [settings, setSettings] = usePersistentState(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
//
// React global'i index.html üzerinden CDN ile geliyor; useState/useEffect'i React.* üzerinden alıyoruz.

import { db } from './db.js';

const { useState, useEffect, useRef } = React;

export function usePersistentState(key, defaultValue) {
    const [value, setValue] = useState(() => db.get(key, defaultValue));

    // İlk mount sırasında zaten okunmuş veriyi tekrar yazmamak için skip ref.
    const skipFirstRef = useRef(true);

    useEffect(() => {
        if (skipFirstRef.current) {
            skipFirstRef.current = false;
            return;
        }
        db.set(key, value);
    }, [key, value]);

    return [value, setValue];
}
