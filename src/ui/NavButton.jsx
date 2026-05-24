export const NavButton = ({ item, activeTab, onSelect, mobile = false }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const label = mobile ? (item.mobileLabel || item.label) : item.label;

    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={`${mobile ? 'w-full text-left py-2.5 px-3' : 'w-full flex items-center space-x-3 px-3 py-2.5'} rounded-lg font-bold transition ${
                isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10'
                    : 'text-gray-400 hover:bg-darkBg-hover hover:text-white'
            }`}
        >
            {mobile ? label : (
                <>
                    <Icon />
                    <span>{label}</span>
                </>
            )}
        </button>
    );
};
