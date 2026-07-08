// frontend/src/pages/AdminReportsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download, Calendar, RefreshCw, FileText, Star } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { PageLoader } from '../components/shared/UI';
import { CountUp, RadialGauge } from '../components/shared/AnimatedStats';
import api from '../utils/api';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#1B2A6B','#D97706','#15803D','#7C3AED','#C9A84C','#C0392B','#0891B2','#BE185D'];

function MiniStat({ label, value, unit, decimals = 0 }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-light)' }}>{label}</p>
      <p className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--text)' }}>
        <CountUp value={value ?? 0} decimals={decimals} />
        {unit && <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-light)' }}>{unit}</span>}
      </p>
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/summary', { params: dateRange });
      setData(res.data.data);
    } catch { toast.error('Failed to load report'); } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReport(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const s = data.summary;
    const rows = [
      ['Metric', 'Value'],
      ['Total Tickets', s.TOTAL_TICKETS],
      ['Resolved', s.RESOLVED],
      ['Open', s.OPEN_TICKETS],
      ['In Progress', s.IN_PROGRESS],
      ['Avg Resolution (hrs)', s.AVG_RESOLUTION_HRS],
      ['Avg Satisfaction', s.AVG_SATISFACTION],
      ['SLA Breaches', s.SLA_BREACHES],
      [],
      ['Department', 'Tickets'],
      ...(data.byDepartment || []).map(d => [d.DEPT_NAME, d.CNT]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAIL_Helpdesk_Report_${dateRange.from_date}_to_${dateRange.to_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const s = data?.summary || {};
  const deptData = (data?.byDepartment || []).map(d => ({ name: d.DEPT_NAME, tickets: d.CNT }));
  const resolutionRate = s.TOTAL_TICKETS > 0 ? Math.round((s.RESOLVED / s.TOTAL_TICKETS) * 100) : 0;

  return (
    <AppLayout title="Reports & Analytics" subtitle="IT Helpdesk performance metrics">

      {/* Controls */}
      <div className="glass-panel mb-5">
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="sail-label flex items-center gap-1.5 text-xs"><Calendar size={12} /> From Date</label>
              <input type="date" className="sail-input py-2 text-sm w-auto"
                value={dateRange.from_date}
                onChange={e => setDateRange(r => ({ ...r, from_date: e.target.value }))} />
            </div>
            <div>
              <label className="sail-label flex items-center gap-1.5 text-xs"><Calendar size={12} /> To Date</label>
              <input type="date" className="sail-input py-2 text-sm w-auto"
                value={dateRange.to_date}
                onChange={e => setDateRange(r => ({ ...r, to_date: e.target.value }))} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ label: 'Last 7 days', days: 7 }, { label: 'Last 30 days', days: 30 }, { label: 'Last 90 days', days: 90 }].map(({ label, days }) => (
                <button key={days}
                  onClick={() => setDateRange({ from_date: format(subDays(new Date(), days), 'yyyy-MM-dd'), to_date: format(new Date(), 'yyyy-MM-dd') })}
                  className="btn-outline text-xs px-3 py-1.5 rounded-lg">
                  {label}
                </button>
              ))}
            </div>
            <button onClick={fetchReport} disabled={loading} className="btn-sail px-4 py-2 rounded-lg text-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Generate Report
            </button>
            <button onClick={exportCSV} disabled={!data} className="btn-outline px-4 py-2 rounded-lg text-sm">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : !data ? (
        <div className="glass-card p-8 text-center">
          <FileText size={28} className="mx-auto mb-2" style={{ color: 'var(--border)' }} />
          <p style={{ color: 'var(--text-mid)' }}>Select a date range and click "Generate Report".</p>
        </div>
      ) : (
        <>
          {/* ── HERO ROW: resolution rate as the centerpiece ── */}
          <div className="glass-panel mb-5 overflow-hidden relative">
            <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--sail-gold-deep)' }}>
                  Resolution Rate — {dateRange.from_date} to {dateRange.to_date}
                </p>
                <div className="flex items-end gap-3">
                  <span className="hero-stat">
                    <CountUp value={resolutionRate} duration={1400} suffix="%" />
                  </span>
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--text-mid)' }}>
                  <CountUp value={s.RESOLVED || 0} duration={1000} /> of <CountUp value={s.TOTAL_TICKETS || 0} duration={1000} /> tickets resolved or closed in this period
                </p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <RadialGauge value={resolutionRate} size={150} strokeWidth={12} color="var(--sail-gold)" label="Resolved" />
              </div>
            </div>
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MiniStat label="Total Tickets" value={s.TOTAL_TICKETS} />
            <MiniStat label="Open"          value={s.OPEN_TICKETS} />
            <MiniStat label="Avg Resolution" value={s.AVG_RESOLUTION_HRS} unit="hrs" decimals={1} />
            <MiniStat label="SLA Breaches"  value={s.SLA_BREACHES} />
          </div>

          {/* Satisfaction */}
          {s.AVG_SATISFACTION > 0 && (
            <div className="glass-card p-4 mb-5 flex items-center gap-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={20}
                    fill={star <= Math.round(s.AVG_SATISFACTION) ? 'var(--sail-gold)' : 'none'}
                    style={{ color: 'var(--sail-gold)' }} />
                ))}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  <CountUp value={s.AVG_SATISFACTION} decimals={1} /> / 5
                </p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>Average satisfaction score</p>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="glass-panel">
              <div className="glass-panel-header"><h3 className="glass-panel-title">Tickets by Department</h3></div>
              <div className="p-4">
                {deptData.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-light)' }}>No data for this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(227,225,220,0.6)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-light)' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-mid)' }} width={130} />
                      <Tooltip />
                      <Bar dataKey="tickets" name="Tickets" radius={[0,8,8,0]} isAnimationActive animationDuration={900}>
                        {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-panel">
              <div className="glass-panel-header"><h3 className="glass-panel-title">Status Distribution</h3></div>
              <div className="p-4">
                {!s.TOTAL_TICKETS ? (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-light)' }}>No data for this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Resolved/Closed', value: s.RESOLVED || 0 },
                          { name: 'Open',            value: s.OPEN_TICKETS || 0 },
                          { name: 'In Progress',     value: s.IN_PROGRESS || 0 },
                        ]}
                        cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                        paddingAngle={3} dataKey="value"
                        isAnimationActive animationDuration={900}>
                        {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Dept breakdown table */}
          {deptData.length > 0 && (
            <div className="glass-panel">
              <div className="glass-panel-header"><h3 className="glass-panel-title">Department Breakdown</h3></div>
              <div className="overflow-x-auto">
                <table className="sail-table">
                  <thead><tr><th>Department</th><th className="text-right">Tickets</th><th>Share</th></tr></thead>
                  <tbody>
                    {deptData.map((d, i) => (
                      <tr key={i}>
                        <td className="font-medium" style={{ color: 'var(--text)' }}>{d.name}</td>
                        <td className="text-right font-bold" style={{ color: 'var(--text)' }}>{d.tickets}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden w-32" style={{ background: 'var(--off)' }}>
                              <div className="h-full rounded-full bar-grow" style={{
                                width: `${Math.round((d.tickets / (s.TOTAL_TICKETS || 1)) * 100)}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }} />
                            </div>
                            <span className="text-xs w-9" style={{ color: 'var(--text-light)' }}>
                              {Math.round((d.tickets / (s.TOTAL_TICKETS || 1)) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}