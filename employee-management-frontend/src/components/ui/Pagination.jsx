import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, from, to, total } = meta;
  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, current_page - delta); i <= Math.min(last_page, current_page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4">
      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{from}</span> – <span className="text-slate-300 font-medium">{to}</span> of{' '}
        <span className="text-slate-300 font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => onPageChange(current_page - 1)} disabled={current_page === 1}>
          <ChevronLeft size={15} />
        </NavBtn>

        {current_page > delta + 1 && (
          <>
            <PageBtn page={1} active={false} onClick={onPageChange} />
            {current_page > delta + 2 && <span className="px-1 text-slate-600 text-sm">…</span>}
          </>
        )}

        {pages.map((p) => <PageBtn key={p} page={p} active={p === current_page} onClick={onPageChange} />)}

        {current_page < last_page - delta && (
          <>
            {current_page < last_page - delta - 1 && <span className="px-1 text-slate-600 text-sm">…</span>}
            <PageBtn page={last_page} active={false} onClick={onPageChange} />
          </>
        )}

        <NavBtn onClick={() => onPageChange(current_page + 1)} disabled={current_page === last_page}>
          <ChevronRight size={15} />
        </NavBtn>
      </div>
    </div>
  );
}

function NavBtn({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
    >
      {children}
    </button>
  );
}

function PageBtn({ page, active, onClick }) {
  return (
    <button
      onClick={() => onClick(page)}
      className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
      style={
        active
          ? { background: 'linear-gradient(135deg,#7C3AED,#4338CA)', color: 'white', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }
          : { background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      {page}
    </button>
  );
}
