import { Icons } from '../core/icons.jsx';

export const AppLogo = ({ compact = false }) => (
    <div className={`flex items-center ${compact ? 'space-x-3' : 'space-x-3 px-2 py-1'}`}>
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white`}>
            <Icons.Car />
        </div>
        <div className="text-left min-w-0">
            <h1 className={`${compact ? 'text-sm' : 'text-sm'} font-black text-white leading-none truncate`}>Zehedisode Oto Yıkama</h1>
            {!compact && <span className="text-[10px] text-gray-500 font-semibold uppercase">Yönetim Paneli</span>}
        </div>
    </div>
);
