import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Ticket, Users, Clock, CheckCircle, AlertTriangle, TrendingUp, RefreshCw, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, PageLoader, SLAIndicator } from '../components/shared/UI';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const COLORS = ['#1B2A6B','#3D50A0','#6B7FC0','#15803D','#D97706','#C0392B'];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#DDE3F0] rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-[#1B2A6B] mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>)}
    </div>
  );
};

function KpiCard({ icon: Icon, label, value, sub, bg }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: bg }}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1A1F3C]">{value}</p>
        <p className="text-sm font-medium text-[#4A5068]">{label}</p>
        {sub && <p className="text-xs text-[#8890B5] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading && !data) return <AppLayout title="Admin Dashboard"><PageLoader /></AppLayout>;

  const s = data?.summary || {};
  const trendData = (data?.dailyTrend || []).map(d => ({
    day: d.DAY ? format(new Date(d.DAY), 'MMM d') : '',
    tickets: d.CNT,
  }));
  const catData = (data?.byCat || []).slice(0, 7).map(c => ({ name: c.CAT_NAME, count: c.CNT }));
  const statusData = (data?.statusCounts || []).map(s => ({ name: s.STATUS?.replace('_',' '), value: s.CNT }));

  return (
    <AppLayout title="Admin Dashboard" subtitle="IT Operations Overview">

      {/* SLA breach alert */}
      {data?.slaBreach > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <ShieldAlert size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700 flex-1">
            ⚠ {data.slaBreach} ticket{data.slaBreach > 1 ? 's' : ''} breached SLA deadline
          </p>
          <Link to="/admin/tickets" className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold">
            View Now
          </Link>
        </div>
      )}

      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#8890B5]">Auto-refreshes every 5 minutes</p>
        <div className="flex gap-2">
          <button onClick={fetch} disabled={loading}
            className="btn-outline text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link to="/admin/tickets" className="btn-sail text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            All Tickets <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard icon={Ticket}        label="Total Tickets"  value={s.TOTAL || 0}            bg="#1B2A6B" sub="All time" />
        <KpiCard icon={AlertTriangle} label="Open"           value={s.OPEN_COUNT || 0}       bg="#D97706" sub="Awaiting action" />
        <KpiCard icon={Activity}      label="In Progress"    value={s.INPROGRESS_COUNT || 0} bg="#1D4ED8" sub="Being worked on" />
        <KpiCard icon={CheckCircle}   label="Resolved"       value={s.RESOLVED_COUNT || 0}   bg="#15803D" sub="Completed" />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard icon={TrendingUp}  label="Today"        value={s.TODAY_COUNT || 0}  bg="#7C3AED" sub="New today" />
        <KpiCard icon={Clock}       label="This Week"    value={s.WEEK_COUNT || 0}   bg="#0891B2" sub="Last 7 days" />
        <KpiCard icon={ShieldAlert} label="SLA Breaches" value={data?.slaBreach || 0} bg="#C0392B" sub="Overdue" />
        <KpiCard icon={Users}       label="Top Agents"   value={data?.topAgents?.length || 0} bg="#059669" sub="Active resolvers" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Line chart */}
        <div className="lg:col-span-2 sail-card">
          <div className="sail-card-header">
            <h3 className="sail-card-title">Ticket Volume – Last 7 Days</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8890B5' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8890B5' }} allowDecimals={false} />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="tickets" name="Tickets" stroke="#1B2A6B"
                  strokeWidth={2.5} dot={{ r: 4, fill: '#1B2A6B' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie / Status */}
        <div className="sail-card">
          <div className="sail-card-header">
            <h3 className="sail-card-title">By Status</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category bar + top agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="sail-card">
          <div className="sail-card-header"><h3 className="sail-card-title">By Category</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" name="Tickets" fill="#1B2A6B" radius={[0,4,4,0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agents */}
        <div className="sail-card">
          <div className="sail-card-header"><h3 className="sail-card-title">Top Resolving Agents</h3></div>
          <div className="p-4">
            {!data?.topAgents?.length ? (
              <p className="text-sm text-[#8890B5] text-center py-8">No resolution data yet</p>
            ) : (
              <div className="space-y-4">
                {data.topAgents.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: '#1B2A6B' }}>
                      {a.FULL_NAME?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1F3C] truncate">{a.FULL_NAME}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-[#EEF0FA] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            background: '#1B2A6B',
                            width: `${Math.min(100,(a.RESOLVED_COUNT/(data.topAgents[0]?.RESOLVED_COUNT||1))*100)}%`
                          }} />
                        </div>
                        <span className="text-xs font-bold text-[#1B2A6B] w-6 text-right">{a.RESOLVED_COUNT}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent tickets table */}
      <div className="sail-card">
        <div className="sail-card-header">
          <h3 className="sail-card-title">Recent Tickets</h3>
          <Link to="/admin/tickets" className="btn-outline text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="sail-table">
            <thead>
              <tr>
                <th>Ticket ID</th><th>Subject</th><th>Status</th>
                <th>Priority</th><th>Created By</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentTickets || []).map((t, i) => (
                <tr key={i}>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#1B2A6B] bg-[#EEF0FA] px-2 py-0.5 rounded">
                      {t.TICKET_REF}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm font-medium text-[#1A1F3C] truncate">{t.SUBJECT}</p>
                  </td>
                  <td><StatusBadge status={t.STATUS} /></td>
                  <td><PriorityBadge priority={t.PRIORITY_NAME} /></td>
                  <td className="text-xs">{t.CREATED_BY_NAME}</td>
                  <td className="text-xs text-[#8890B5]">
                    {t.CREATED_AT ? formatDistanceToNow(new Date(t.CREATED_AT), { addSuffix: true }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
