import { Icons } from '../core/icons.jsx';

// Confirmation dialog used by destructive flows (delete customer, reset, etc.).
// Same API/props as before; the surface gets a glassy backdrop, an amber
// status rail and a pair of weighted action buttons.
export const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                className="w-full max-w-sm relative overflow-hidden rounded-xl border border-darkBg-border bg-darkBg-card shadow-2xl"
            >
                <span
                    className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]"
                    aria-hidden="true"
                />
                <div className="p-6 space-y-4 text-left">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex w-10 h-10 rounded-lg items-center justify-center bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 shrink-0">
                            <Icons.AlertTriangle />
                        </span>
                        <div className="min-w-0">
                            <h3
                                id="confirm-title"
                                className="text-lg font-extrabold text-white leading-tight"
                                style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.01em' }}
                            >
                                {title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-darkBg-deep hover:bg-darkBg-hover border border-darkBg-border text-xs py-2.5 rounded-lg font-bold transition text-gray-200"
                        >
                            İptal
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-xs py-2.5 rounded-lg font-bold transition text-white shadow-[0_10px_22px_-12px_rgba(244,63,94,0.6)]"
                        >
                            Onayla
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
