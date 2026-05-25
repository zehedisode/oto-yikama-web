const { useEffect, useState } = React;

import { Icons } from '../core/icons.jsx';
import {
    getCooldownRemainingMs,
    getPinLockState,
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

export const PinGateModal = ({ isOpen, customText, gatePin, setGatePin, onFail, onSubmit }) => {
    const [cooldownMs, setCooldownMs] = useState(0);
    const [failedAttempts, setFailedAttempts] = useState(0);

    useEffect(() => {
        if (!isOpen) return undefined;
        const tick = () => {
            setCooldownMs(getCooldownRemainingMs());
            setFailedAttempts(getPinLockState().failedAttempts);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isOpen, gatePin]);

    // 4 hane tamamlandığında Enter beklemeden otomatik onayla.
    useEffect(() => {
        if (!isOpen) return undefined;
        if (gatePin.length !== 4) return undefined;
        if (getCooldownRemainingMs() > 0) return undefined;
        const timer = setTimeout(() => onSubmit(), 150);
        return () => clearTimeout(timer);
    }, [gatePin, isOpen, onSubmit]);

    if (!isOpen) return null;

    const isCoolingDown = cooldownMs > 0;
    const remainingInTier = PIN_ATTEMPT_LIMIT - (failedAttempts % PIN_ATTEMPT_LIMIT);
    const showAttemptsHint = !isCoolingDown && failedAttempts > 0 && remainingInTier < PIN_ATTEMPT_LIMIT;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Güvenlik Onayı"
        >
            <div className="w-full max-w-sm p-6 bg-darkBg-card rounded-xl border border-darkBg-border shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
                    <Icons.Shield />
                    <span>Güvenlik Onayı</span>
                </h3>
                <p className="text-sm text-gray-400 mb-4 text-left">
                    {customText || 'Bu işleme devam etmek için Yönetici PIN kodunu giriniz.'}
                </p>

                {isCoolingDown && (
                    <div className="mb-3 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs font-semibold">
                        Çok fazla hatalı deneme. Bekleyin: <span className="font-extrabold">{formatRemaining(cooldownMs)}</span>
                    </div>
                )}

                {showAttemptsHint && (
                    <p className="text-amber-400 text-[11px] font-semibold mb-2">
                        Kilitlenmeden önce kalan deneme: <span className="font-extrabold">{remainingInTier}</span>
                    </p>
                )}

                <form onSubmit={(e) => { e.preventDefault(); if (!isCoolingDown) onSubmit(); }} className="space-y-4">
                    <input
                        type="password"
                        maxLength={4}
                        autoFocus
                        disabled={isCoolingDown}
                        placeholder="••••"
                        value={gatePin}
                        onChange={(e) => setGatePin(e.target.value.replace(/\D/g, ''))}
                        className={`w-full text-center text-2xl tracking-widest bg-darkBg-deep border border-darkBg-border p-3 rounded-lg text-brand-400 font-bold focus:outline-none focus:border-brand-500 ${
                            isCoolingDown ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    />
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onFail}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg font-semibold transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isCoolingDown || gatePin.length !== 4}
                            className={`flex-1 text-sm py-2 rounded-lg font-semibold transition ${
                                isCoolingDown || gatePin.length !== 4
                                    ? 'bg-brand-900/40 text-brand-300/50 cursor-not-allowed'
                                    : 'bg-brand-600 hover:bg-brand-500'
                            }`}
                        >
                            Onayla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
