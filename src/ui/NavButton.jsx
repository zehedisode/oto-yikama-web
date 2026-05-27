// Sidebar / mobile nav button.
// Active state uses a left "rail" indicator + brand-tinted surface;
// hover glides into a subtle hairline highlight. No layout changes.
export const NavButton = ({ item, activeTab, onSelect, mobile = false }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const label = mobile ? (item.mobileLabel || item.label) : item.label;

    if (mobile) {
        return (
            <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`relative w-full text-left py-2.5 px-3 rounded-lg font-bold transition
                    ${isActive
                        ? 'bg-brand-600/15 text-white border border-brand-500/40 shadow-[0_8px_22px_-14px_rgba(6,182,212,0.7)]'
                        : 'text-gray-300 hover:bg-darkBg-hover hover:text-white border border-transparent'}`}
            >
                {label}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={`group relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-bold transition
                ${isActive
                    ? 'bg-gradient-to-r from-brand-600/20 via-brand-600/10 to-transparent text-white'
                    : 'text-gray-400 hover:bg-darkBg-hover hover:text-white'}`}
        >
            <span
                className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-all
                    ${isActive ? 'bg-brand-400 shadow-[0_0_10px_rgba(34,211,238,0.55)]' : 'bg-transparent group-hover:bg-darkBg-border'}`}
                aria-hidden="true"
            />
            <span className={`shrink-0 transition ${isActive ? 'text-brand-300' : 'text-gray-500 group-hover:text-gray-200'}`}>
                <Icon />
            </span>
            <span className="truncate">{label}</span>
            {isActive && (
                <span
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-300 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                    aria-hidden="true"
                />
            )}
        </button>
    );
};
