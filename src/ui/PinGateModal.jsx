const { useEffect, useState } = React;

import { Icons } from '../core/icons.jsx';
import {
    getCooldownRemainingMs,
    getPinLockState,
    PIN_ATTEMPT_LIMIT
} from '../core/security.js';
import { PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '../core/app-core.js';

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

    if (!isOpen) return null;

    const isCoolingDown = cooldownMs > 0;
    const remainingInTier = PIN_ATTEMPT_LIMIT - (failedAttempts % PIN_ATTEMPT_LIMIT);
    const showAttemptsHint = !isCoolingDown && failedAttempts > 0 && remainingInTier < PIN_ATTEMPT_LIMIT;
    const canSubmit = !isCoolingDown && gatePin.length >= PIN_MIN_LENGTH && gatePin.length <= PIN_MAX_LENGTH;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Güvenlik Onayı"
        >
            <div className="w-full max-w-sm relative overflow-hidden rounded-2xl border border-darkBg-border bg-darkBg-card shadow-2xl">
                <span
                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]"
                    aria-hidden="true"
                />
                {/* Soft brand bloom in the top-right corner */}
                <div
                    className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-500/20 blur-2xl pointer-events-none"
                    aria-hidden="true"
                />

                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex w-10 h-10 rounded-lg items-center justify-center bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
                            <Icons.Shield />
                        </span>
                        <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-300/90">
                                Güvenlik
                            </span>
                            <h3
                                className="text-lg font-extrabold text-white leading-tight"
                                style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.01em' }}
                            >
                                Yönetici Onayı
                            </h3>
                        </div>
                    </div>

                    <p className="text-sm text-gray-300 mb-1 text-left leading-relaxed">
                        {customText || 'Bu işleme devam etmek için Yönetici PIN kodunu giriniz.'}
                    </p>
                    <p className="text-[11px] text-gray-500 mb-4 text-left">
                        {PIN_MIN_LENGTH}-{PIN_MAX_LENGTH} hane arası rakam, sonra <span className="text-brand-300 font-bold">Onayla</span>.
                    </p>

                    {isCoolingDown && (
                        <div className="mb-3 bg-rose-950/50 border border-rose-500/40 rounded-lg px-3 py-2 text-rose-200 text-xs font-semibold">
                            Çok fazla hatalı deneme. Bekleyin: <span className="font-mono-num font-extrabold">{formatRemaining(cooldownMs)}</span>
                        </div>
                    )}

                    {showAttemptsHint && (
                        <p className="text-amber-300 text-[11px] font-semibold mb-2">
                            Kilitlenmeden önce kalan deneme: <span className="font-mono-num font-extrabold">{remainingInTier}</span>
                        </p>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }} className="space-y-4">
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={PIN_MAX_LENGTH}
                            autoFocus
                            disabled={isCoolingDown}
                            placeholder="••••"
                            value={gatePin}
                            onChange={(e) => setGatePin(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
                            className={`w-full text-center text-3xl tracking-[0.4em] bg-darkBg-deep border border-darkBg-border p-3 rounded-xl text-brand-300 font-mono-num font-bold focus:outline-none focus:border-brand-500 ${
                                isCoolingDown ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onFail}
                                className="flex-1 bg-darkBg-deep hover:bg-darkBg-hover border border-darkBg-border text-sm py-2.5 rounded-lg font-bold transition text-gray-200"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className={`flex-1 text-sm py-2.5 rounded-lg font-bold transition ${
                                    !canSubmit
                                        ? 'bg-brand-900/40 text-brand-300/50 cursor-not-allowed'
                                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-[0_10px_22px_-12px_rgba(6,182,212,0.7)]'
                                }`}
                            >
                                Onayla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
