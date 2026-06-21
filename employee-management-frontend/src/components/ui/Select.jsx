import { Children, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Themed custom select — keeps the <option> children API but renders a
 * portal popover (consistent with the date/time pickers; no native dropdown).
 * onChange receives an event-like object: { target: { name, value } }.
 */
export default function Select({ label, error, children, className = '', value, onChange, name, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  // Parse <option> children into { value, label }.
  const options = Children.toArray(children)
    .filter((c) => c?.type === 'option')
    .map((c) => ({ value: String(c.props.value ?? ''), label: c.props.children }));

  const selected = options.find((o) => o.value === String(value ?? ''));

  const reposition = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = r.width;
    const maxH = 260;
    const below = window.innerHeight - r.bottom;
    const top = below < maxH && r.top > below ? r.top - Math.min(maxH, r.top - 8) - 6 : r.bottom + 6;
    setPos({ top, left: r.left, width, openUp: below < maxH && r.top > below });
  };

  useLayoutEffect(() => { if (open) reposition(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (triggerRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onMove = () => reposition();
    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (val) => {
    onChange?.({ target: { name, value: val } });
    setOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}

      <button ref={triggerRef} type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className={`inp w-full flex items-center justify-between gap-2 ${error ? 'err' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <span className={`truncate ${selected && selected.value !== '' ? 'text-slate-200' : 'text-slate-500'}`}>
          {selected ? selected.label : (options[0]?.label ?? 'Select')}
        </span>
        <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {open && pos && createPortal(
        <div ref={popRef} className="rounded-xl py-1.5 modal-panel max-h-64 overflow-y-auto"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          {options.map((o) => {
            const isSel = o.value === String(value ?? '');
            return (
              <button type="button" key={o.value} onClick={() => choose(o.value)}
                className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                  isSel ? 'text-violet-300' : 'text-slate-300 hover:bg-violet-500/12'
                }`}>
                <span className="truncate">{o.label}</span>
                {isSel && <Check size={14} className="text-violet-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
