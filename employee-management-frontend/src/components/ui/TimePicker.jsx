import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

/**
 * Themed time picker (24h) — portal popover with scrollable hour/minute columns.
 * value/onChange use 'HH:MM' strings.
 */
export default function TimePicker({ value, onChange, placeholder = 'Select time', error }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const [h, m] = value ? value.split(':') : ['', ''];

  const reposition = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 180);
    const calH = 260;
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

  const setH = (hh) => onChange(`${hh}:${m || '00'}`);
  const setM = (mm) => onChange(`${h || '00'}:${mm}`);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen((o) => !o)}
        className={`inp w-full flex items-center justify-between ${error ? 'err' : ''}`}>
        <span className={value ? 'text-slate-200' : 'text-slate-500'}>{value || placeholder}</span>
        <Clock size={15} className="text-slate-500" />
      </button>

      {open && pos && createPortal(
        <div ref={popRef} className="rounded-2xl p-2 modal-panel"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-center text-[10px] font-semibold text-slate-600 uppercase mb-1">Hour</p>
              <div className="h-44 overflow-y-auto pr-1 space-y-0.5">
                {HOURS.map((hh) => (
                  <button type="button" key={hh} onClick={() => setH(hh)}
                    className={`w-full py-1.5 rounded-lg text-sm font-medium transition-all ${h === hh ? 'btn-glow' : 'text-slate-300 hover:bg-violet-500/15'}`}>
                    {hh}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-center text-[10px] font-semibold text-slate-600 uppercase mb-1">Minute</p>
              <div className="h-44 overflow-y-auto pr-1 space-y-0.5">
                {MINUTES.map((mm) => (
                  <button type="button" key={mm} onClick={() => setM(mm)}
                    className={`w-full py-1.5 rounded-lg text-sm font-medium transition-all ${m === mm ? 'btn-glow' : 'text-slate-300 hover:bg-violet-500/15'}`}>
                    {mm}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="btn-glass w-full mt-2 py-1.5 rounded-lg text-xs font-semibold">Done</button>
        </div>,
        document.body
      )}
    </>
  );
}
