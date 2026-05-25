const { useState, useEffect } = React;

import { AppLogo } from './AppLogo.jsx';
import {
    getPinLockState,
    getCooldownRemainingMs,
    PIN_ATTEMPT_LIMIT
} from '../core/security.js';

const formatRemaining = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    return `${seconds} sn`;
};

export const LockScreen = ({ users, handleUnlock, pinError, onPinReset }) => {
    const [pin, setPin] = useState('');
    const [cooldownMs, setCooldownMs] = useState(getCooldownRemainingMs());
    const [failedAttempts, setFailedAttempts] = useState(getPinLockState().failedAttempts);
    const [showRecovery, setShowRecovery] = useState(false);

    // Cooldown sayacını canlı tut.
    useEffect(() => {
        const tick = () => {
            const remaining = getCooldownRemainingMs();
            setCooldownMs(remaining);
            const state = getPinLockState();
            setFailedAttempts(state.failedAttempts);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [pinError]);

    // Cooldown bittiğinde PIN alanını temizle.
    useEffect(() => {
        if (cooldownMs <= 0) {
            return undefined;
        }
        setPin('');
        return undefined;
    }, [cooldownMs]);

    const isCoolingDown = cooldownMs > 0;
    const remainingInTier = PIN_ATTEMPT_LIMIT - (failedAttempts % PIN_ATTEMPT_LIMIT);
    const showAttemptsHint = !isCoolingDown && failedAttempts > 0 && remainingInTier < PIN_ATTEMPT_LIMIT;

    // Kilitliyken arka plan içeriğine Tab ile ulaşılmasını engelle.
    useEffect(() => {
        const root = document.getElementById('root');
        if (!root) return undefined;
        const previous = root.getAttribute('aria-hidden');
        const previousInert = root.getAttribute('inert');
        // Kilit modali aslında root'un içinde render olduğu için root yerine 'main' bölgesini kilitlemek mantıklı.
        // Ancak bu uygulamada LockScreen tüm ekrana fixed konumlandırıldığı için yeterli korumayı zaten sağlar.
        // Yine de odak yönetimini güçlendirmek için klavye tuzağı ekleyelim.
        const handler = (event) => {
            if (event.key === 'Tab') {
                // Tab ile arka plana atlamayı engelle; LockScreen düğmeleri zaten aynı modal içinde dolaşır.
                const focusable = document.querySelectorAll('.lock-screen-focusable');
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
        document.addEventListener('keydown', handler);
        return () => {
            document.removeEventListener('keydown', handler);
            if (previous === null) root.removeAttribute('aria-hidden');
            else root.setAttribute('aria-hidden', previous);
            if (previousInert === null) root.removeAttribute('inert');
            else root.setAttribute('inert', previousInert);
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
                    setPin('');
                }, 200);
            }
        }
    };
    const handleBackspace = () => {
        if (isCoolingDown) return;
        setPin(pin.slice(0, -1));
    };

    // Fiziksel klavye desteği: 0-9 ile yaz, Backspace ile sil, Escape ile temizle, Enter ile doğrula.
    useEffect(() => {
        const onKeyDown = (event) => {
            if (showRecovery) return;
            if (isCoolingDown) return;

            // Modifier tuşlu kombinasyonları (Ctrl+R vb.) yakalama.
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            if (/^[0-9]$/.test(event.key)) {
                event.preventDefault();
                handleKeypad(event.key);
                return;
            }
            if (event.key === 'Backspace') {
                event.preventDefault();
                handleBackspace();
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                setPin('');
                return;
            }
            if (event.key === 'Enter' && pin.length === 4) {
                event.preventDefault();
                handleUnlock(pin);
                setPin('');
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [pin, isCoolingDown, showRecovery, handleUnlock]);

    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-darkBg-deep bg-opacity-95 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Ekran Kilidi"
        >
            <div className="w-full max-w-md p-8 bg-darkBg-card rounded-2xl border border-darkBg-border shadow-2xl flex flex-col items-center text-center">
                <div className="mb-6">
                    <AppLogo />
                </div>

                <p className="text-sm text-gray-400 mb-6">Sisteme erişmek için 4 haneli PIN kodunuzu girin</p>
                
                <div className="flex space-x-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                                pin.length > i 
                                    ? 'bg-brand-500 border-brand-500 shadow-md shadow-brand-500/50 scale-110' 
                                    : 'border-gray-600'
                            }`}
                        />
                    ))}
                </div>

                {isCoolingDown && (
                    <div className="mb-4 w-full bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm font-semibold">
                        Çok fazla hatalı deneme. Yeniden denemek için bekleyin: <span className="font-extrabold">{formatRemaining(cooldownMs)}</span>
                    </div>
                )}

                {!isCoolingDown && pinError && (
                    <p className="text-red-400 text-sm font-semibold mb-2 animate-bounce">Hatalı PIN! Tekrar Deneyin.</p>
                )}

                {showAttemptsHint && (
                    <p className="text-amber-400 text-[11px] font-semibold mb-3">
                        Kilitlenmeden önce kalan deneme: <span className="font-extrabold">{remainingInTier}</span>
                    </p>
                )}

                <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-6" aria-disabled={isCoolingDown}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            type="button"
                            disabled={isCoolingDown}
                            onClick={() => handleKeypad(num.toString())}
                            className={`lock-screen-focusable h-14 rounded-xl bg-darkBg-deep border border-darkBg-border text-lg font-bold transition-all duration-150 ${
                                isCoolingDown
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:bg-brand-900/30 hover:border-brand-500 active:scale-95'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        type="button"
                        disabled={isCoolingDown}
                        onClick={() => setPin('')}
                        className={`lock-screen-focusable h-14 rounded-xl text-gray-400 flex items-center justify-center text-sm font-semibold transition duration-150 ${
                            isCoolingDown ? 'opacity-40 cursor-not-allowed' : 'hover:text-white'
                        }`}
                    >
                        Temizle
                    </button>
                    <button
                        type="button"
                        disabled={isCoolingDown}
                        onClick={() => handleKeypad('0')}
                        className={`lock-screen-focusable h-14 rounded-xl bg-darkBg-deep border border-darkBg-border text-lg font-bold transition-all duration-150 ${
                            isCoolingDown
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-brand-900/30 hover:border-brand-500 active:scale-95'
                        }`}
                    >
                        0
                    </button>
                    <button
                        type="button"
                        disabled={isCoolingDown}
                        onClick={handleBackspace}
                        className={`lock-screen-focusable h-14 rounded-xl text-gray-400 flex items-center justify-center transition duration-150 ${
                            isCoolingDown ? 'opacity-40 cursor-not-allowed' : 'hover:text-white'
                        }`}
                    >
                        Sil
                    </button>
                </div>
                <span className="text-xs text-gray-600">PIN ayarları Sistem & Yedekleme bölümünden yönetilir.</span>

                {onPinReset && (
                    <button
                        type="button"
                        onClick={() => setShowRecovery(true)}
                        className="lock-screen-focusable mt-4 text-[11px] text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline transition"
                    >
                        PIN'imi Unuttum
                    </button>
                )}
            </div>

            {showRecovery && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-sm bg-darkBg-card border border-amber-500/40 rounded-xl p-6 shadow-2xl space-y-4 text-left">
                        <h3 className="text-base font-extrabold text-white">PIN Kodunu Sıfırla</h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            PIN kodunuz <span className="font-extrabold text-amber-300">1234</span> olarak sıfırlanacak.
                            Müşteri, hizmet, gelir ve gider verileriniz silinmez. Giriş yaptıktan sonra
                            <span className="text-white font-bold"> Sistem & Yedekleme </span>
                            sekmesinden hemen yeni bir PIN belirlemenizi öneririm.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowRecovery(false)}
                                className="lock-screen-focusable flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-2.5 rounded transition"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onPinReset();
                                    setShowRecovery(false);
                                    setPin('');
                                }}
                                className="lock-screen-focusable flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded transition"
                            >
                                Sıfırla (1234)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
