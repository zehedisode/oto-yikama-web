// Tek tip KPI kutusu. Tıklanabilir/aktif desteği ile.
const ACCENTS = {
    brand: { iconBg: 'bg-brand-500/10 text-brand-300 ring-brand-500/30', valueColor: 'text-brand-200' },
    emerald: { iconBg: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30', valueColor: 'text-emerald-200' },
    amber: { iconBg: 'bg-amber-500/10 text-amber-300 ring-amber-500/30', valueColor: 'text-amber-200' },
    rose: { iconBg: 'bg-rose-500/10 text-rose-300 ring-rose-500/30', valueColor: 'text-rose-200' },
    indigo: { iconBg: 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/30', valueColor: 'text-indigo-200' },
    neutral: { iconBg: 'bg-white/5 text-gray-200 ring-white/10', valueColor: 'text-white' }
};

export const StatTile = ({
    label,
    value,
    sub = null,
    icon = null,
    accent = 'neutral',
    onClick = null,
    active = false,
    blur = false,
    valueClassName = ''
}) => {
    const a = ACCENTS[accent] || ACCENTS.neutral;
    const Wrapper = onClick ? 'button' : 'div';
    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick || undefined}
            className={`surface-card kpi-card rounded-xl p-4 flex items-center justify-between text-left transition ${
                onClick ? 'hover:border-brand-500/40 cursor-pointer' : ''
            } ${active ? 'border-brand-500/60 ring-1 ring-brand-500/40' : ''}`}
        >
            <div className="relative min-w-0">
                <span className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.18em] mb-1">
                    {label}
                </span>
                <span
                    className={`kpi-value text-[22px] block transition duration-200 ${a.valueColor} ${valueClassName} ${
                        blur ? 'blur-md select-none' : ''
                    }`}
                >
                    {value}
                </span>
                {sub && (
                    <span className="text-[10px] text-gray-400 block mt-0.5">{sub}</span>
                )}
            </div>
            {icon && (
                <div className={`relative shrink-0 p-3 rounded-lg ring-1 ${a.iconBg}`}>
                    {icon}
                </div>
            )}
        </Wrapper>
    );
};
