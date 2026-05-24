import { Icons } from '../core/icons.jsx';

export const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm p-6 bg-darkBg-card rounded-xl border border-darkBg-border shadow-2xl space-y-4">
                <div className="text-left">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span className="text-amber-500"><Icons.AlertTriangle /></span>
                        <span>{title}</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">{message}</p>
                </div>
                <div className="flex space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-xs py-2 rounded-lg font-semibold transition text-white"
                    >
                        İptal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-xs py-2 rounded-lg font-semibold transition text-white"
                    >
                        Onayla
                    </button>
                </div>
            </div>
        </div>
    );
};
