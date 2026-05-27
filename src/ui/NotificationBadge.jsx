// Toast / status badge.
// Uses a left status rail + soft-glass card so success / warning / error
// register at a glance even from the corner of the eye.
export const NotificationBadge = ({ notification }) => {
    if (!notification) return null;

    const { message, type } = notification;

    const palette =
        type === 'error'
            ? {
                  rail: 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.55)]',
                  surface: 'bg-rose-950/85 border-rose-500/30 text-rose-100',
                  glyph: 'bg-rose-500/20 text-rose-300',
                  label: 'Hata',
                  icon: 'M12 9v3m0 4h.01M10.3 4.3L2.8 17.1A2 2 0 004.5 20h15a2 2 0 001.7-2.9L13.7 4.3a2 2 0 00-3.4 0z'
              }
            : type === 'warning'
            ? {
                  rail: 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.55)]',
                  surface: 'bg-amber-950/85 border-amber-500/30 text-amber-100',
                  glyph: 'bg-amber-500/20 text-amber-300',
                  label: 'Uyarı',
                  icon: 'M12 9v3m0 4h.01M10.3 4.3L2.8 17.1A2 2 0 004.5 20h15a2 2 0 001.7-2.9L13.7 4.3a2 2 0 00-3.4 0z'
              }
            : {
                  rail: 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.55)]',
                  surface: 'bg-emerald-950/85 border-emerald-500/30 text-emerald-100',
                  glyph: 'bg-emerald-500/20 text-emerald-300',
                  label: 'Başarılı',
                  icon: 'M5 13l4 4L19 7'
              };

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed top-4 right-4 z-50 max-w-sm flex items-stretch overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md animate-fade-in ${palette.surface}`}
        >
            <span className={`w-1.5 ${palette.rail}`} aria-hidden="true" />
            <div className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-md ${palette.glyph}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={palette.icon} />
                    </svg>
                </span>
                <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-80">
                        {palette.label}
                    </span>
                    <span className="block text-[13px] font-bold leading-snug">
                        {message}
                    </span>
                </div>
            </div>
        </div>
    );
};
