import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Custom date picker with month/year dropdowns. The calendar floats as a
 * portal popover (overlays other fields, never pushes layout / never clipped).
 * value/onChange use 'YYYY-MM-DD'. Props: disabledDates[], min, max.
 */
export default function DatePicker({ value, onChange, disabledDates = [], min, max, placeholder = 'Select date', error }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date((value || min || todayKey()) + 'T00:00:00'));
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const disabled = new Set(disabledDates);

  const reposition = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 300);
    const calH = 360;
    // Flip above if not enough room below.
    const below = window.innerHeight - r.bottom;
    const top = below < calH && r.top > calH ? r.top - calH - 6 : r.bottom + 6;
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    setPos({ top, left, width });
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

  const openPicker = () => {
    setView(new Date((value || min || todayKey()) + 'T00:00:00'));
    setOpen((o) => !o);
  };

  const year = view.getFullYear();
  const month = view.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const isDisabled = (d) => {
    const key = toKey(d);
    if (disabled.has(key)) return true;
    if (min && key < min) return true;
    if (max && key > max) return true;
    return false;
  };

  const pick = (d) => {
    if (isDisabled(d)) return;
    onChange(toKey(d));
    setOpen(false);
  };

  const minYear = min ? Number(min.slice(0, 4)) : 1950;
  const maxYear = max ? Number(max.slice(0, 4)) : new Date().getFullYear() + 5;
  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <>
      <button ref={triggerRef} type="button" onClick={openPicker}
        className={`inp w-full flex items-center justify-between ${error ? 'err' : ''}`}>
        <span className={display ? 'text-slate-200' : 'text-slate-500'}>{display || placeholder}</span>
        <Calendar size={15} className="text-slate-500" />
      </button>

      {open && pos && createPortal(
        <div ref={popRef} className="rounded-2xl p-3 modal-panel"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          <div className="flex items-center gap-1.5 mb-3">
            <button type="button" onClick={() => setView(new Date(year, month - 1, 1))}
              className="icon-tile w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"><ChevronLeft size={15} /></button>
            <select value={month} onChange={(e) => setView(new Date(year, Number(e.target.value), 1))}
              className="inp flex-1 py-1.5 text-sm">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setView(new Date(Number(e.target.value), month, 1))}
              className="inp w-24 py-1.5 text-sm">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={() => setView(new Date(year, month + 1, 1))}
              className="icon-tile w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"><ChevronRight size={15} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WD.map((w) => <div key={w} className="text-center text-[10px] font-semibold text-slate-600 py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = toKey(d);
              const dis = isDisabled(d);
              const selected = value === key;
              const booked = disabled.has(key);
              return (
                <button type="button" key={i} disabled={dis} onClick={() => pick(d)}
                  title={booked ? 'Already booked' : ''}
                  className={`h-8 rounded-lg text-xs font-medium transition-all ${
                    selected ? 'btn-glow'
                    : dis ? 'text-slate-700 line-through cursor-not-allowed'
                    : 'text-slate-300 hover:bg-violet-500/15'
                  }`}
                  style={booked && !selected ? { background: 'rgba(239,68,68,0.08)', color: '#9b3b3b' } : undefined}>
                  {d.getDate()}
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
