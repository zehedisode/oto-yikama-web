export const NotificationBadge = ({ notification }) => {
    if (!notification) return null;

    const { message, type } = notification;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-5 py-3 rounded-xl border shadow-2xl transition duration-150 transform translate-y-0 scale-100 animate-fade-in ${
            type === 'error' 
                ? 'bg-red-950/90 border-red-500/30 text-red-400' 
                : type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-400'
                : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400'
        }`}>
            <span className="text-sm font-bold">{message}</span>
        </div>
    );
};
