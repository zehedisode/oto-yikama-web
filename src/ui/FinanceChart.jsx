import { formatCurrency } from '../core/app-core.js';

// Bar chart — refined visual, same data contract.
// Hassas veriler gizliyken bar yüksekliklerini de eşitleyerek miktarın grafikten
// tahmin edilmesini engelliyoruz. Tooltip ve sayısal etiketler de blur'lanıyor.
export const CustomFinanceChart = ({ washIncome, productIncome, totalExpenses, isSensitiveHidden = false }) => {
    const totalIncome = washIncome + productIncome;
    const maxVal = Math.max(totalIncome, totalExpenses, 1000) * 1.15;

    const placeholderHeight = 60; // gizliyken tüm barlar tek tip
    const incHeight = isSensitiveHidden ? placeholderHeight : (totalIncome / maxVal) * 140;
    const expHeight = isSensitiveHidden ? placeholderHeight : (totalExpenses / maxVal) * 140;
    const washBarHeight = isSensitiveHidden ? placeholderHeight : (washIncome / maxVal) * 140;
    const prodBarHeight = isSensitiveHidden ? placeholderHeight : (productIncome / maxVal) * 140;

    const amountClass = (extraColor) => isSensitiveHidden
        ? 'blur-md select-none text-gray-400'
        : extraColor;

    const Bar = ({ height, hiddenBar, gradient, glow, color, value, label, emphasized = false }) => (
        <div className="flex flex-col items-center w-1/4 group">
            <div
                className={`relative w-12 rounded-md transition-all duration-500 hover:opacity-95 ${
                    isSensitiveHidden
                        ? 'bg-darkBg-deep border border-darkBg-border'
                        : `${gradient} ${glow}`
                }`}
                style={{ height: `${Math.max(height, 5)}px` }}
            >
                {!isSensitiveHidden && (
                    <>
                        <span className="absolute inset-x-0 top-0 h-1.5 rounded-t-md bg-white/15 pointer-events-none" />
                        <div
                            className={`absolute -top-9 left-1/2 -translate-x-1/2 ${color} bg-darkBg-deep border border-darkBg-border text-[11px] py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 shadow font-mono-num font-bold whitespace-nowrap`}
                        >
                            {formatCurrency(value)}
                        </div>
                    </>
                )}
            </div>
            <span className={`text-[11px] mt-2 text-center truncate w-full ${emphasized ? 'text-gray-200 font-bold' : 'text-gray-400'}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="surface-card rounded-xl p-5">
            <div className="flex justify-between items-start mb-4 text-left gap-4">
                <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold tracking-[0.2em] uppercase text-brand-300/80 mb-1">
                        Kasa Analizi
                    </span>
                    <h3
                        className="text-base font-extrabold text-white"
                        style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.01em' }}
                    >
                        Cari Dönem · Hizmet, Ürün, Gider
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {isSensitiveHidden
                            ? 'Tutarlar gizli. Detayları görmek için PIN ile kilidi açın.'
                            : 'Üzerine geldiğinizde tutarlar görünür.'}
                    </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 uppercase tracking-wider whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                    Canlı
                </span>
            </div>

            <div
                className="relative flex items-end justify-around h-52 border-b border-darkBg-border pb-2 pt-6"
                style={{
                    backgroundImage:
                        'linear-gradient(to top, transparent 0, transparent calc(25% - 1px), rgba(255,255,255,0.04) 25%, transparent calc(25% + 1px), transparent calc(50% - 1px), rgba(255,255,255,0.04) 50%, transparent calc(50% + 1px), transparent calc(75% - 1px), rgba(255,255,255,0.04) 75%, transparent calc(75% + 1px))'
                }}
            >
                <Bar
                    height={washBarHeight}
                    gradient="bg-gradient-to-t from-emerald-700 via-emerald-500 to-emerald-300"
                    glow="shadow-[0_0_24px_-6px_rgba(16,185,129,0.55)]"
                    color="text-emerald-300"
                    value={washIncome}
                    label="Hizmet Geliri"
                />
                <Bar
                    height={prodBarHeight}
                    gradient="bg-gradient-to-t from-teal-700 via-teal-500 to-teal-300"
                    glow="shadow-[0_0_24px_-6px_rgba(20,184,166,0.55)]"
                    color="text-teal-300"
                    value={productIncome}
                    label="Ürün Satışı"
                />
                <Bar
                    height={incHeight}
                    gradient="bg-gradient-to-t from-brand-700 via-brand-500 to-brand-300"
                    glow="shadow-[0_0_28px_-6px_rgba(34,211,238,0.7)]"
                    color="text-brand-300"
                    value={totalIncome}
                    label="Toplam Ciro"
                    emphasized
                />
                <Bar
                    height={expHeight}
                    gradient="bg-gradient-to-t from-rose-700 via-rose-500 to-rose-300"
                    glow="shadow-[0_0_24px_-6px_rgba(244,63,94,0.55)]"
                    color="text-rose-300"
                    value={totalExpenses}
                    label="Toplam Gider"
                />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-left">
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-gray-400">
                        Yıkama Hizmeti: <span className={`font-mono-num ${amountClass('text-gray-100')}`}>{formatCurrency(washIncome)}</span>
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-teal-400 rounded-sm shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                    <span className="text-gray-400">
                        Aksesuar &amp; Ürün: <span className={`font-mono-num ${amountClass('text-gray-100')}`}>{formatCurrency(productIncome)}</span>
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-brand-400 rounded-sm shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                    <span className="text-gray-200 font-semibold">
                        Toplam Brüt Gelir: <span className={`font-mono-num ${amountClass('text-gray-50')}`}>{formatCurrency(totalIncome)}</span>
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <span className="text-gray-400">
                        Tüm Giderler: <span className={`font-mono-num ${amountClass('text-gray-100')}`}>{formatCurrency(totalExpenses)}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
