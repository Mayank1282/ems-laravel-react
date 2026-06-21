import { useEffect, useState } from 'react';
import { Users, Building2, UserCheck, TrendingUp, Clock, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import TimeTracker from '../../components/attendance/TimeTracker';

const CHART_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="modal-panel px-4 py-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-violet-300 font-bold">{payload[0].value} employees</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const tracked = user?.role === 'employee' || user?.role === 'hr';
  const isEmployee = user?.role === 'employee';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Normal employees only see their time tracker — skip the workforce stats fetch.
    if (isEmployee) { setLoading(false); return; }
    dashboardService.stats()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, [isEmployee]);

  // Employee dashboard = time tracker only.
  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500 mt-1">Track your work hours for today</p>
        </div>
        <TimeTracker large />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const { stats, recent_activities } = data;

  const statCards = [
    { label: 'Total Employees', value: stats.total_employees, icon: Users, accent: 'stat-purple', iconClass: 'stat-icon-purple' },
    { label: 'Active Employees', value: stats.active_employees, icon: UserCheck, accent: 'stat-emerald', iconClass: 'stat-icon-emerald' },
    { label: 'Departments', value: stats.total_departments, icon: Building2, accent: 'stat-blue', iconClass: 'stat-icon-blue' },
    { label: 'New Hires This Month', value: stats.new_hires_this_month, icon: TrendingUp, accent: 'stat-cyan', iconClass: 'stat-icon-cyan' },
  ];

  const typeLabels = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract' };
  const typeColors = { full_time: '#3B82F6', part_time: '#F59E0B', contract: '#7C3AED' };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Workforce overview & analytics</p>
        </div>
        <div className="surface hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-active" />
          Live data
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent, iconClass }) => (
          <div key={label} className={`glass-card rounded-2xl p-5 card-lift ${accent}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-100 mt-2 leading-none">{value}</p>
              </div>
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tracker + chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {tracked && (
          <div className="lg:col-span-2">
            <TimeTracker />
          </div>
        )}

        {/* Bar Chart */}
        <Card className={`${tracked ? 'lg:col-span-3' : 'lg:col-span-5'} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-100">Employees Hired per Year</h2>
              <p className="text-xs text-slate-500 mt-0.5">New joiners by year, split by department</p>
            </div>
            <div
              className="text-xs text-violet-400 font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              Hiring trend
            </div>
          </div>

          {(!stats.hires_by_year || stats.hires_by_year.length === 0) ? (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data available</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.hires_by_year} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(124,58,237,0.05)' }}
                    contentStyle={{ background: 'var(--modal)', border: '1px solid var(--surface-border)', borderRadius: 12, fontSize: 12 }} />
                  {(stats.hire_departments || []).map((dept, i) => (
                    <Bar key={dept} dataKey={dept} stackId="hires"
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      radius={i === (stats.hire_departments.length - 1) ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                      maxBarSize={60} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {(stats.hire_departments || []).map((dept, i) => (
                  <span key={dept} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {dept}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Composition + activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employment Types */}
        <Card className="lg:col-span-1 p-6">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-100">Employment Types</h2>
            <p className="text-xs text-slate-500 mt-0.5">Workforce composition</p>
          </div>

          {stats.employees_by_type.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-5">
              {stats.employees_by_type.map((item) => {
                const total = stats.total_employees || 1;
                const pct = Math.round((item.count / total) * 100);
                const color = typeColors[item.employment_type] || '#7C3AED';
                return (
                  <div key={item.employment_type}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300 font-medium">
                        {typeLabels[item.employment_type] || item.employment_type}
                      </span>
                      <span className="text-slate-400">
                        {item.count} <span className="text-slate-600">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                          boxShadow: `0 0 8px ${color}66`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary counts */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--surface-border)' }}>
            <div className="grid grid-cols-3 gap-2 text-center">
              {stats.employees_by_type.slice(0, 3).map((item) => (
                <div key={item.employment_type}>
                  <p className="text-lg font-black text-slate-100">{item.count}</p>
                  <p className="text-[10px] text-slate-600">{typeLabels[item.employment_type]}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)' }}
            >
              <Activity size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Recent Activity</h2>
              <p className="text-xs text-slate-600">Latest system events</p>
            </div>
          </div>
          <span className="text-xs text-slate-600">{recent_activities.length} events</span>
        </div>

        {recent_activities.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {recent_activities.map((log, i) => {
              const actionMeta = {
                created: { color: '#10B981', bg: 'rgba(16,185,129,0.13)', verb: 'created' },
                updated: { color: '#3B82F6', bg: 'rgba(59,130,246,0.13)', verb: 'updated' },
                deleted: { color: '#EF4444', bg: 'rgba(239,68,68,0.13)', verb: 'deleted' },
              }[log.action] || { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', verb: log.action };
              // The target (e.g. "Design", "John Doe") is the part after the colon in the description.
              const target = log.description?.includes(':') ? log.description.split(':').slice(1).join(':').trim() : null;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-3 px-3 rounded-xl transition-all"
                  style={{ borderBottom: i < recent_activities.length - 1 ? '1px solid var(--surface-border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: actionMeta.bg, border: `1px solid ${actionMeta.color}33` }}>
                    <Activity size={13} style={{ color: actionMeta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* who · action · entity · target */}
                    <p className="text-sm text-slate-300 leading-snug">
                      <span className="font-semibold text-slate-100">{log.user?.name || 'Someone'}</span>
                      {log.user?.role && <span className="text-[10px] text-slate-600 ml-1.5 uppercase">({log.user.role})</span>}
                      <span className="font-semibold" style={{ color: actionMeta.color }}> {actionMeta.verb} </span>
                      {log.entity && <span className="text-slate-400">{log.entity.toLowerCase()}</span>}
                      {target && <span className="text-slate-100 font-medium"> “{target}”</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                        style={{ background: actionMeta.bg, color: actionMeta.color }}>
                        {actionMeta.verb}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Clock size={10} />
                        {log.created_at}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </Card>
      </div>
    </div>
  );
}
