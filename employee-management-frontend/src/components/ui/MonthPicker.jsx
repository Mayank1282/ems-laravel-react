import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Themed month picker — portal popover with a year selector + month grid.
 * value/onChange use 'YYYY-MM' strings.
 */
export default function MonthPicker({ value, onChange, max, disabledMonths = [], placeholder = 'Select month', error }) {
  const blocked = new Set(disabledMonths);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [year, setYear] = useState(() => (value ? Number(value.slice(0, 4)) : new Date().getFullYear()));
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const selYear = value ? Number(value.slice(0, 4)) : null;
  const selMonth = value ? Number(value.slice(5, 7)) - 1 : null;
  const maxYear = max ? Number(max.slice(0, 4)) : null;
  const maxMonth = max ? Number(max.slice(5, 7)) - 1 : null;

  const reposition = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 260);
    const h = 240;
    const below = window.innerHeight - r.bottom;
    const top = below < h && r.top > h ? r.top - h - 6 : r.bottom + 6;
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    setPos({ top, left, width });
  };

  useLayoutEffect(() => { if (open) { setYear(value ? Number(value.slice(0, 4)) : new Date().getFullYear()); reposition(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const pick = (mIdx) => {
    onChange(`${year}-${String(mIdx + 1).padStart(2, '0')}`);
    setOpen(false);
  };

  const display = value ? `${FULL[selMonth]} ${selYear}` : '';

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen((o) => !o)}
        className={`inp w-full flex items-center justify-between ${error ? 'err' : ''}`}>
        <span className={display ? 'text-slate-200' : 'text-slate-500'}>{display || placeholder}</span>
        <Calendar size={15} className="text-slate-500" />
      </button>

      {open && pos && createPortal(
        <div ref={popRef} className="rounded-2xl p-3 modal-panel"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setYear((y) => y - 1)}
              className="icon-tile w-7 h-7 rounded-lg flex items-center justify-center"><ChevronLeft size={15} /></button>
            <span className="text-sm font-bold text-slate-200">{year}</span>
            <button type="button" onClick={() => setYear((y) => y + 1)}
              className="icon-tile w-7 h-7 rounded-lg flex items-center justify-center"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MON.map((m, i) => {
              const key = `${year}-${String(i + 1).padStart(2, '0')}`;
              const isSel = selYear === year && selMonth === i;
              const booked = blocked.has(key);
              const disabled = booked || (maxYear !== null && (year > maxYear || (year === maxYear && i > maxMonth)));
              return (
                <button type="button" key={m} disabled={disabled} onClick={() => pick(i)}
                  title={booked ? 'Payslip already generated — delete it to regenerate' : ''}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    isSel ? 'btn-glow'
                    : disabled ? 'text-slate-700 cursor-not-allowed line-through'
                    : 'text-slate-300 hover:bg-violet-500/15'
                  }`}
                  style={booked && !isSel ? { background: 'rgba(239,68,68,0.08)', color: '#9b3b3b' } : undefined}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
