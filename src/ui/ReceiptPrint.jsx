// Yazdırılabilir fiş (makbuz). window.print() çağrıldığında @media print kuralları
// sayesinde sadece bu komponent yazdırılır; diğer arayüz gizlenir.

import { formatCurrency, getPaymentLabel } from '../core/app-core.js';
import { Icons } from '../core/icons.jsx';

const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

const buildShareText = (data) => {
    const lines = [];
    lines.push(`OTO YIKAMA PRO`);
    lines.push(`Tarih: ${formatDate(data.date)}`);
    if (data.customer?.plate) lines.push(`Plaka: ${data.customer.plate}`);
    if (data.customer?.name) lines.push(`Müşteri: ${data.customer.name}`);
    lines.push('');
    data.lines.forEach(l => {
        lines.push(`${l.label} - ${formatCurrency(l.amount)}`);
    });
    lines.push('');
    if (data.discount > 0) lines.push(`İndirim: -${formatCurrency(data.discount)}`);
    lines.push(`Toplam: ${formatCurrency(data.total)}`);
    lines.push(`Ödeme: ${getPaymentLabel(data.paymentMethod)}`);
    if (data.note) {
        lines.push('');
        lines.push(`Not: ${data.note}`);
    }
    return lines.join('\n');
};

export const ReceiptPrint = ({ isOpen, data, onClose }) => {
    if (!isOpen || !data) return null;

    const shareText = buildShareText(data);
    const handlePrint = () => window.print();
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            alert('Fiş metni panoya kopyalandı.');
        } catch {
            alert('Kopyalama desteklenmiyor.');
        }
    };
    const handleWhatsApp = () => {
        const phone = (data.customer?.phone || '').replace(/\D/g, '');
        const url = phone
            ? `https://wa.me/${phone.startsWith('90') ? phone : '90' + phone}?text=${encodeURIComponent(shareText)}`
            : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 print:bg-white print:p-0 print:items-start">
            <div className="receipt-modal w-full max-w-sm bg-darkBg-card border border-darkBg-border rounded-2xl shadow-2xl print:bg-white print:border-0 print:shadow-none print:rounded-none print:max-w-full">
                {/* Aksiyonlar (yazdırılırken gizli) */}
                <div className="p-4 border-b border-darkBg-border flex items-center justify-between gap-2 print:hidden">
                    <h3 className="text-sm font-bold text-white">Satış Fişi</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
                        <Icons.X />
                    </button>
                </div>

                {/* Yazdırılan içerik */}
                <div className="p-5 print:p-3 print:text-black bg-white text-gray-900 receipt-body">
                    <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-3">
                        <h2 className="text-base font-extrabold tracking-wide">OTO YIKAMA PRO</h2>
                        <p className="text-[11px] text-gray-500">{formatDate(data.date)}</p>
                    </div>

                    {(data.customer?.plate || data.customer?.name) && (
                        <div className="py-3 text-[12px] space-y-0.5 border-b border-dashed border-gray-300">
                            {data.customer.plate && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Plaka</span>
                                    <span className="font-bold uppercase">{data.customer.plate}</span>
                                </div>
                            )}
                            {data.customer.name && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Müşteri</span>
                                    <span className="font-bold">{data.customer.name}</span>
                                </div>
                            )}
                            {data.customer.vehicleType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Araç</span>
                                    <span className="font-bold">{data.customer.vehicleType}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="py-3 space-y-1 text-[12px] border-b border-dashed border-gray-300">
                        {data.lines.map((line, idx) => (
                            <div key={idx} className="flex justify-between">
                                <span className="truncate pr-2">{line.label}</span>
                                <span className="font-bold whitespace-nowrap">{formatCurrency(line.amount)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 space-y-1 text-[12px]">
                        <div className="flex justify-between text-gray-600">
                            <span>Ara Toplam</span>
                            <span>{formatCurrency(data.subTotal)}</span>
                        </div>
                        {data.discount > 0 && (
                            <div className="flex justify-between text-emerald-700">
                                <span>İndirim</span>
                                <span>- {formatCurrency(data.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-extrabold pt-1 border-t border-gray-300 mt-1">
                            <span>TOPLAM</span>
                            <span>{formatCurrency(data.total)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-600 pt-1">
                            <span>Ödeme</span>
                            <span className="font-bold">{getPaymentLabel(data.paymentMethod)}</span>
                        </div>
                    </div>

                    {data.note && (
                        <div className="pt-3 mt-3 border-t border-dashed border-gray-300 text-[11px] text-gray-700">
                            <span className="font-bold">Not: </span>{data.note}
                        </div>
                    )}

                    <p className="text-center text-[10px] text-gray-400 mt-4 italic">Bizi tercih ettiğiniz için teşekkürler.</p>
                </div>

                {/* Aksiyon butonları (yazdırılırken gizli) */}
                <div className="p-3 border-t border-darkBg-border grid grid-cols-3 gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-xs transition"
                    >
                        Yazdır
                    </button>
                    <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition"
                    >
                        WhatsApp
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="bg-darkBg-deep hover:bg-darkBg-hover text-gray-200 font-bold py-2 rounded-lg text-xs transition"
                    >
                        Kopyala
                    </button>
                </div>
            </div>
        </div>
    );
};
