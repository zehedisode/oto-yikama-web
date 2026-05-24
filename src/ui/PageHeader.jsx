export const PageHeader = ({ title, description, actions }) => (
    <div className="app-page-header border-b border-darkBg-border pb-4">
        <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-white">{title}</h2>
            {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        {actions && <div className="app-page-actions flex flex-wrap gap-3">{actions}</div>}
    </div>
);
