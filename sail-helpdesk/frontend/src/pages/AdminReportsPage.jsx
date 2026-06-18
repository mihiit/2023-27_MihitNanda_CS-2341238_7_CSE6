// frontend/src/pages/AdminReportsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download, Calendar, RefreshCw, FileText } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { PageLoader, Alert } from '../components/shared/UI';
import api from '../utils/api';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#003087','#EA580C','#16A34A','#D97706','#7C3AED','#DC2626','#0891B2','#BE185D'];

function MetricCard({ label, value, unit, color = 'bg-sail-500' }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-steel-500 font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold text-steel-800`}>
        {value ?? '—'}
        {unit && <span className="text-base font-medium text-steel-500 ml-1">{unit}</span>}
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

  const resolutionRate = s.TOTAL_TICKETS > 0
    ? Math.round((s.RESOLVED / s.TOTAL_TICKETS) * 100) : 0;

  return (
    <AppLayout title="Reports & Analytics" subtitle="IT Helpdesk performance metrics">

      {/* Controls */}
      <div className="card mb-5">
        <div className="card-body py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5 text-xs">
                <Calendar size={12} /> From Date
              </label>
              <input type="date" className="form-input py-2 text-sm"
                value={dateRange.from_date}
                onChange={e => setDateRange(r => ({ ...r, from_date: e.target.value }))} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5 text-xs">
                <Calendar size={12} /> To Date
              </label>
              <input type="date" className="form-input py-2 text-sm"
                value={dateRange.to_date}
                onChange={e => setDateRange(r => ({ ...r, to_date: e.target.value }))} />
            </div>

            {/* Quick ranges */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Last 7 days',  days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 90 days', days: 90 },
              ].map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setDateRange({ from_date: format(subDays(new Date(), days), 'yyyy-MM-dd'), to_date: format(new Date(), 'yyyy-MM-dd') })}
                  className="btn-secondary btn-sm text-xs py-1.5">
                  {label}
                </button>
              ))}
            </div>

            <button onClick={fetchReport} disabled={loading} className="btn-primary">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Generate Report
            </button>
            <button onClick={exportCSV} disabled={!data} className="btn-secondary">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : !data ? (
        <Alert type="info">Select a date range and click "Generate Report".</Alert>
      ) : (
        <>
          {/* Period label */}
          <p className="text-sm text-steel-500 mb-4 flex items-center gap-2">
            <FileText size={14} />
            Report period: <strong>{dateRange.from_date}</strong> to <strong>{dateRange.to_date}</strong>
          </p>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Tickets"   value={s.TOTAL_TICKETS} />
            <MetricCard label="Resolved"        value={s.RESOLVED}      />
            <MetricCard label="Resolution Rate" value={resolutionRate}   unit="%" />
            <MetricCard label="SLA Breaches"    value={s.SLA_BREACHES}  />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Open Tickets"      value={s.OPEN_TICKETS}          />
            <MetricCard label="Avg Resolution"    value={s.AVG_RESOLUTION_HRS}    unit="hrs" />
            <MetricCard label="Avg Satisfaction"  value={s.AVG_SATISFACTION ? `${s.AVG_SATISFACTION}/5` : '—'} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* By Department Bar */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-heading font-bold text-steel-700">Tickets by Department</h3>
              </div>
              <div className="card-body">
                {deptData.length === 0 ? (
                  <p className="text-sm text-steel-400 text-center py-8">No data for this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                      <Tooltip />
                      <Bar dataKey="tickets" name="Tickets" radius={[0, 4, 4, 0]}>
                        {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status Donut */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-heading font-bold text-steel-700">Status Distribution</h3>
              </div>
              <div className="card-body">
                {!s.TOTAL_TICKETS ? (
                  <p className="text-sm text-steel-400 text-center py-8">No data for this period</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Resolved/Closed', value: s.RESOLVED || 0 },
                            { name: 'Open',            value: s.OPEN_TICKETS || 0 },
                            { name: 'In Progress',     value: s.IN_PROGRESS || 0 },
                          ]}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={3} dataKey="value">
                          {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Satisfaction gauge */}
                    {s.AVG_SATISFACTION > 0 && (
                      <div className="mt-4 p-3 bg-gold-300/20 border border-gold-400/30 rounded-lg text-center">
                        <p className="text-xs text-steel-600 mb-1">Average Satisfaction Score</p>
                        <div className="flex items-center justify-center gap-1">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={`text-xl ${star <= Math.round(s.AVG_SATISFACTION) ? 'text-gold-400' : 'text-steel-300'}`}>★</span>
                          ))}
                        </div>
                        <p className="text-lg font-bold text-steel-800 mt-0.5">{s.AVG_SATISFACTION} / 5</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dept table */}
          {deptData.length > 0 && (
            <div className="card mt-5">
              <div className="card-header">
                <h3 className="font-heading font-bold text-steel-700">Department Breakdown</h3>
              </div>
              <div className="table-wrapper rounded-xl">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th className="text-right">Tickets</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptData.map((d, i) => (
                      <tr key={i}>
                        <td className="font-medium">{d.name}</td>
                        <td className="text-right font-bold">{d.tickets}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-steel-100 rounded-full overflow-hidden w-32">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.round((d.tickets / (s.TOTAL_TICKETS || 1)) * 100)}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }} />
                            </div>
                            <span className="text-xs text-steel-500 w-8">
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
