// PIN onayı ile açılan hassas alan kilidi (Finans / Gelir Kayıtları üstündeki blur perdesi).
// IncomeTab ve FinanceTab aynı 25+ satırı kopyalıyordu; tek kaynak haline getirildi.
import { Icons } from '../core/icons.jsx';

export const SensitiveLockOverlay = ({
    isHidden,
    title,
    description,
    promptText,
    requestPinApproval,
    onUnlock
}) => {
    if (!isHidden) return null;
    return (
        <div className="absolute inset-0 z-10 modal-backdrop flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-darkBg-border">
            <span className="inline-flex w-12 h-12 rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30 items-center justify-center mb-3">
                <Icons.Shield />
            </span>
            <h3
                className="text-lg font-extrabold text-white mb-1"
                style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
                {title}
            </h3>
            <p className="text-xs text-gray-400 mb-4 max-w-sm">{description}</p>
            <button
                type="button"
                onClick={() => requestPinApproval(promptText, onUnlock)}
                className="btn btn-primary"
            >
                PIN ile Kilidi Aç
            </button>
        </div>
    );
};
