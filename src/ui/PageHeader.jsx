// Consistent page header used by every tab.
// The display heading + brand-accented underline (CSS) gives each page
// the same editorial, magazine-like rhythm without changing tab markup.
export const PageHeader = ({ title, description, actions }) => (
    <div className="app-page-header border-b border-darkBg-border pb-5">
        <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" aria-hidden="true" />
                <span className="text-[10px] font-extrabold text-brand-300/90 uppercase tracking-[0.22em]">
                    Konsol
                </span>
            </div>
            <h2
                className="text-2xl md:text-[26px] font-extrabold text-white leading-tight"
                style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.02em' }}
            >
                {title}
            </h2>
            {description && (
                <p className="text-[12px] text-gray-400 mt-2 max-w-2xl leading-relaxed">
                    {description}
                </p>
            )}
        </div>
        {actions && (
            <div className="app-page-actions flex flex-wrap gap-2.5">
                {actions}
            </div>
        )}
    </div>
);
