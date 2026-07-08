import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts';
import { Ticket, Users, Clock, CheckCircle, AlertTriangle, TrendingUp, RefreshCw, ShieldAlert, ArrowRight, Activity, Radio } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, PageLoader } from '../components/shared/UI';
import { CountUp, RadialGauge } from '../components/shared/AnimatedStats';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const COLORS = ['#1B2A6B','#3D50A0','#6B7FC0','#C9A84C','#D97706','#C0392B'];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 text-xs">
      <p className="font-semibold mb-1" style={{ color: 'var(--sail)' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>)}
    </div>
  );
};

/* ── Glass KPI card with 3D tilt-on-hover, icon glow, accent palette ── */
function GlassKpi({ icon: Icon, label, value, sub, accent }) {
  const palette = {
    navy:   { icon: 'var(--sail)',     glow: 'rgba(27,42,107,0.16)',  shadow: 'rgba(27,42,107,0.45)' },
    gold:   { icon: 'var(--sail-gold)',glow: 'rgba(201,168,76,0.20)', shadow: 'rgba(201,168,76,0.45)' },
    amber:  { icon: '#D97706',         glow: 'rgba(217,119,6,0.18)',  shadow: 'rgba(217,119,6,0.40)' },
    blue:   { icon: '#1D4ED8',         glow: 'rgba(29,78,216,0.16)',  shadow: 'rgba(29,78,216,0.40)' },
    green:  { icon: '#15803D',         glow: 'rgba(21,128,61,0.16)',  shadow: 'rgba(21,128,61,0.40)' },
    purple: { icon: '#7C3AED',         glow: 'rgba(124,58,237,0.16)', shadow: 'rgba(124,58,237,0.40)' },
    teal:   { icon: '#0891B2',         glow: 'rgba(8,145,178,0.16)',  shadow: 'rgba(8,145,178,0.40)' },
    red:    { icon: '#C0392B',         glow: 'rgba(192,57,43,0.18)',  shadow: 'rgba(192,57,43,0.40)' },
    emerald:{ icon: '#059669',         glow: 'rgba(5,150,105,0.16)',  shadow: 'rgba(5,150,105,0.40)' },
  }[accent] || { icon: 'var(--sail)', glow: 'rgba(27,42,107,0.16)', shadow: 'rgba(27,42,107,0.45)' };

  return (
    <div className="glass-kpi" style={{ '--kpi-glow': palette.glow, '--kpi-shadow': palette.shadow }}>
      <div className="glass-kpi-icon" style={{ background: palette.icon }}>
        <Icon size={20} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="relative z-[1] min-w-0">
        <p className="glass-kpi-value"><CountUp value={value} duration={1000} /></p>
        <p className="glass-kpi-label">{label}</p>
        {sub && <p className="glass-kpi-sub">{sub}</p>}
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
        <div className="mb-4 p-3.5 rounded-xl flex items-center gap-3 glass-card"
          style={{ background: 'rgba(254,242,242,0.85)', borderColor: 'rgba(252,165,165,0.6)' }}>
          <ShieldAlert size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700 flex-1">
            {data.slaBreach} ticket{data.slaBreach > 1 ? 's' : ''} breached SLA deadline
          </p>
          <Link to="/admin/tickets" className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold">
            View Now
          </Link>
        </div>
      )}

      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs" style={{ color: 'var(--text-light)' }}>Auto-refreshes every 5 minutes</p>
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

      {/* ── Hero centerpiece: Operations Health gauge + live activity ticker ── */}
      <div className="glass-panel mb-5 overflow-hidden">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="flex justify-center lg:justify-start">
            <RadialGauge
              value={s.TOTAL > 0 ? Math.round(((s.RESOLVED_COUNT || 0) / s.TOTAL) * 100) : 0}
              size={140} strokeWidth={12} color="var(--sail-gold)"
              label="Resolved" sublabel="of total tickets" />
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Radio size={13} className="text-green-500" />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-light)' }}>
                Live Activity
              </span>
            </div>
            <div className="space-y-2 max-h-[168px] overflow-y-auto pr-1">
              {(data?.recentTickets || []).slice(0, 5).map((t, i) => {
                const dotColor = t.STATUS === 'OPEN' ? '#D97706' : t.STATUS === 'IN_PROGRESS' ? '#1D4ED8' : '#15803D';
                return (
                  <div key={i} className="ticker-row" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="ticker-dot" style={{ background: dotColor, color: dotColor }} />
                    <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: 'var(--sail)' }}>
                      {t.TICKET_REF}
                    </span>
                    <span className="text-sm truncate flex-1" style={{ color: 'var(--text-mid)' }}>{t.SUBJECT}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-light)' }}>
                      {t.CREATED_AT ? formatDistanceToNow(new Date(t.CREATED_AT), { addSuffix: true }) : ''}
                    </span>
                  </div>
                );
              })}
              {(!data?.recentTickets || data.recentTickets.length === 0) && (
                <p className="text-sm py-6 text-center" style={{ color: 'var(--text-light)' }}>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <GlassKpi icon={Ticket}        label="Total Tickets"  value={s.TOTAL || 0}            accent="navy"  sub="All time" />
        <GlassKpi icon={AlertTriangle} label="Open"           value={s.OPEN_COUNT || 0}       accent="amber" sub="Awaiting action" />
        <GlassKpi icon={Activity}      label="In Progress"    value={s.INPROGRESS_COUNT || 0} accent="blue"  sub="Being worked on" />
        <GlassKpi icon={CheckCircle}   label="Resolved"       value={s.RESOLVED_COUNT || 0}   accent="green" sub="Completed" />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassKpi icon={TrendingUp}  label="Today"        value={s.TODAY_COUNT || 0}     accent="purple" sub="New today" />
        <GlassKpi icon={Clock}       label="This Week"    value={s.WEEK_COUNT || 0}      accent="teal"   sub="Last 7 days" />
        <GlassKpi icon={ShieldAlert} label="SLA Breaches" value={data?.slaBreach || 0}   accent="red"    sub="Overdue" />
        <GlassKpi icon={Users}       label="Top Agents"   value={data?.topAgents?.length || 0} accent="emerald" sub="Active resolvers" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Area chart */}
        <div className="lg:col-span-2 glass-panel">
          <div className="glass-panel-header">
            <h3 className="glass-panel-title">Ticket Volume — Last 7 Days</h3>
          </div>
          <div className="p-4 chart-draw">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B2A6B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1B2A6B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(227,225,220,0.6)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-light)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} allowDecimals={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="tickets" name="Tickets" stroke="#1B2A6B"
                  strokeWidth={2.5} fill="url(#volGrad)" dot={{ r: 4, fill: '#1B2A6B', strokeWidth: 0 }} activeDot={{ r: 6 }}
                  isAnimationActive animationDuration={1200} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie / Status */}
        <div className="glass-panel">
          <div className="glass-panel-header">
            <h3 className="glass-panel-title">By Status</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<TT />} />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category bar + top agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="glass-panel">
          <div className="glass-panel-header"><h3 className="glass-panel-title">By Category</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(227,225,220,0.6)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-light)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-mid)' }} width={120} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" name="Tickets" radius={[0,8,8,0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agents */}
        <div className="glass-panel">
          <div className="glass-panel-header"><h3 className="glass-panel-title">Top Resolving Agents</h3></div>
          <div className="p-4">
            {!data?.topAgents?.length ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-light)' }}>No resolution data yet</p>
            ) : (
              <div className="space-y-4">
                {data.topAgents.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--sail)', boxShadow: '0 4px 10px -2px rgba(27,42,107,0.5)' }}>
                      {a.FULL_NAME?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{a.FULL_NAME}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--off)' }}>
                          <div className="h-full rounded-full" style={{
                            background: 'linear-gradient(90deg, var(--sail), var(--sail-mid))',
                            width: `${Math.min(100,(a.RESOLVED_COUNT/(data.topAgents[0]?.RESOLVED_COUNT||1))*100)}%`
                          }} />
                        </div>
                        <span className="text-xs font-bold w-6 text-right" style={{ color: 'var(--sail)' }}>{a.RESOLVED_COUNT}</span>
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
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 className="glass-panel-title">Recent Tickets</h3>
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
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      style={{ color: 'var(--sail)', background: 'var(--sail-light)' }}>
                      {t.TICKET_REF}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{t.SUBJECT}</p>
                  </td>
                  <td><StatusBadge status={t.STATUS} /></td>
                  <td><PriorityBadge priority={t.PRIORITY_NAME} /></td>
                  <td className="text-xs">{t.CREATED_BY_NAME}</td>
                  <td className="text-xs" style={{ color: 'var(--text-light)' }}>
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