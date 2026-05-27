// Tüm modallar için tek tip kabuk: cam backdrop, sol renk rayı,
// display fontunda başlık, kicker etiketi ve yapışkan footer.
import { Icons } from '../core/icons.jsx';

const RAIL = {
    brand: 'bg-brand-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]',
    emerald: 'bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.55)]',
    amber: 'bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]',
    rose: 'bg-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.55)]'
};

const SIZE = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
};

export const Modal = ({
    isOpen,
    onClose,
    title,
    kicker,
    description,
    icon = null,
    accent = 'brand',
    size = 'md',
    children,
    footer = null,
    bodyClassName = '',
    zIndex = 50
}) => {
    if (!isOpen) return null;
    const railClass = RAIL[accent] || RAIL.brand;
    const sizeClass = SIZE[size] || SIZE.md;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
        >
            <div className={`relative w-full ${sizeClass} bg-darkBg-card rounded-2xl border border-darkBg-border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}>
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${railClass}`} aria-hidden="true" />
                <div
                    className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-500/15 blur-2xl pointer-events-none"
                    aria-hidden="true"
                />

                <div className="relative px-6 pt-5 pb-4 border-b border-darkBg-border flex items-start gap-3">
                    {icon && (
                        <span className="inline-flex w-10 h-10 rounded-lg items-center justify-center bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30 shrink-0">
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        {kicker && (
                            <span className="block text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-300/90 mb-0.5">
                                {kicker}
                            </span>
                        )}
                        <h3
                            className="text-lg font-extrabold text-white leading-tight"
                            style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.01em' }}
                        >
                            {title}
                        </h3>
                        {description && (
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{description}</p>
                        )}
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-darkBg-hover transition"
                            aria-label="Kapat"
                        >
                            <Icons.X />
                        </button>
                    )}
                </div>

                <div className={`flex-1 overflow-y-auto px-6 py-5 ${bodyClassName}`}>
                    {children}
                </div>

                {footer && (
                    <div className="px-6 py-4 border-t border-darkBg-border bg-darkBg-deep/40">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
