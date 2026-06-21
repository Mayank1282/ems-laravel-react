export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {Icon && (
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)' }}
        >
          <Icon size={32} className="text-violet-400" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
