import { Icons } from '../core/icons.jsx';

// Distinctive logomark: layered cyan badge with subtle inner sheen, soft glow.
// Wordmark uses the display family (Bricolage Grotesque via global h1 styling).
export const AppLogo = ({ compact = false }) => (
    <div className={`flex items-center ${compact ? 'space-x-3' : 'space-x-3 px-1 py-1'}`}>
        <div
            className={`relative ${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-lg text-white flex items-center justify-center
                         bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800
                         shadow-[0_10px_28px_-10px_rgba(6,182,212,0.7)]
                         ring-1 ring-brand-300/30`}
        >
            <span className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            <span className="relative drop-shadow-sm"><Icons.Car /></span>
        </div>
        <div className="text-left min-w-0">
            <h1
                className={`${compact ? 'text-[13px]' : 'text-[15px]'} font-extrabold text-white leading-tight truncate`}
                style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.01em' }}
            >
                Zehedisode
            </h1>
            {!compact && (
                <span className="block text-[10px] text-brand-300/80 font-bold uppercase tracking-[0.18em]">
                    Oto Yıkama · Konsol
                </span>
            )}
        </div>
    </div>
);
