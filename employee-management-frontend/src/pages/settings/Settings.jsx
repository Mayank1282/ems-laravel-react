import { useEffect, useState } from 'react';
import { Save, Clock, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../../services/attendanceService';
import { setCurrency, CURRENCIES } from '../../utils/currency';
import TimePicker from '../../components/ui/TimePicker';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function Settings() {
  const [settings, setSettings] = useState({ work_start_time: '09:00', work_end_time: '18:00', required_minutes: 480, currency: 'USD' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    attendanceService.settings()
      .then(({ data }) => setSettings({
        work_start_time: data.data.work_start_time,
        work_end_time: data.data.work_end_time,
        required_minutes: data.data.required_minutes,
        currency: data.data.currency || 'USD',
      }))
      .catch(() => toast.error('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await attendanceService.updateSettings(settings);
      setCurrency(settings.currency); // reflect immediately in amounts
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Global configuration applied across the company</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <Clock size={17} className="text-violet-500 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Company Settings</h2>
            <p className="text-xs text-slate-500">Work schedule &amp; payment currency — applied across the company</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <form onSubmit={save} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Clock size={13} /> Work Schedule</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Time</label>
                  <TimePicker value={settings.work_start_time} onChange={(v) => setSettings((s) => ({ ...s, work_start_time: v }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Time</label>
                  <TimePicker value={settings.work_end_time} onChange={(v) => setSettings((s) => ({ ...s, work_end_time: v }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Required Hours</label>
                  <input type="number" min="1" max="24" step="0.5" value={settings.required_minutes / 60}
                    onChange={(e) => setSettings((s) => ({ ...s, required_minutes: Math.round(Number(e.target.value) * 60) }))} className="inp w-full" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Wallet size={13} /> Payment Currency</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select label="Currency" value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </Select>
                <div className="sm:col-span-2 flex items-end">
                  <p className="text-xs text-slate-500">All salaries, payslips and overtime are paid and displayed in this currency.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={saving} className="justify-center py-2.5"><Save size={15} /> Save Settings</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
