import { formatCurrency } from '../core/app-core.js';

export const CustomFinanceChart = ({ washIncome, productIncome, totalExpenses }) => {
    const maxVal = Math.max(washIncome + productIncome, totalExpenses, 1000) * 1.15;
    const totalIncome = washIncome + productIncome;
    
    const incHeight = (totalIncome / maxVal) * 120;
    const expHeight = (totalExpenses / maxVal) * 120;
    const washBarHeight = (washIncome / maxVal) * 120;
    const prodBarHeight = (productIncome / maxVal) * 120;

    return (
        <div className="bg-darkBg-card border border-darkBg-border rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 text-left">
                <div>
                    <h3 className="text-base font-bold text-gray-200">Kasa Genel Analizi (Cari Dönem)</h3>
                    <p className="text-xs text-gray-500">Hizmet, Ürün Satışı ve Gider dağılımı</p>
                </div>
            </div>

            <div className="flex items-end justify-around h-48 border-b border-darkBg-border pb-2 pt-6">
                <div className="flex flex-col items-center w-1/4 group">
                    <div className="w-12 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative" style={{ height: `${Math.max(washBarHeight, 5)}px` }}>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-emerald-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap">
                            {formatCurrency(washIncome)}
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 text-center truncate w-full">Hizmet Gelir</span>
                </div>

                <div className="flex flex-col items-center w-1/4 group">
                    <div className="w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative" style={{ height: `${Math.max(prodBarHeight, 5)}px` }}>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-teal-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap">
                            {formatCurrency(productIncome)}
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 text-center truncate w-full">Ürün Satış</span>
                </div>

                <div className="flex flex-col items-center w-1/4 group">
                    <div className="w-12 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative" style={{ height: `${Math.max(incHeight, 5)}px` }}>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-brand-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap">
                            {formatCurrency(totalIncome)}
                        </div>
                    </div>
                    <span className="text-xs text-gray-300 mt-2 font-semibold text-center truncate w-full">Toplam Ciro</span>
                </div>

                <div className="flex flex-col items-center w-1/4 group">
                    <div className="w-12 bg-gradient-to-t from-red-600 to-red-400 rounded-t-md transition-all duration-500 hover:opacity-90 relative" style={{ height: `${Math.max(expHeight, 5)}px` }}>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-red-400 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow font-bold whitespace-nowrap">
                            {formatCurrency(totalExpenses)}
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 text-center truncate w-full">Toplam Gider</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-left">
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full inline-block"></span>
                    <span className="text-gray-400">Yıkama Hizmeti: {formatCurrency(washIncome)}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-teal-400 rounded-full inline-block"></span>
                    <span className="text-gray-400">Aksesuar & Ürün: {formatCurrency(productIncome)}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-brand-400 rounded-full inline-block"></span>
                    <span className="text-gray-300 font-bold">Toplam Brüt Gelir: {formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-400 rounded-full inline-block"></span>
                    <span className="text-gray-400">Tüm Giderler: {formatCurrency(totalExpenses)}</span>
                </div>
            </div>
        </div>
    );
};
