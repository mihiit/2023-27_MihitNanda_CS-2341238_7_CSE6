import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Ticket, Clock, CheckCircle, AlertTriangle, RefreshCw, ArrowRight, Phone, Mail, Building2 } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, PageLoader, SLAIndicator } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

function GlassKpi({ icon: Icon, label, value, sub, accent }) {
  const palette = {
    navy:  { icon: 'var(--sail)', glow: 'rgba(27,42,107,0.16)',  shadow: 'rgba(27,42,107,0.45)' },
    amber: { icon: '#D97706',     glow: 'rgba(217,119,6,0.18)',  shadow: 'rgba(217,119,6,0.40)' },
    blue:  { icon: '#1D4ED8',     glow: 'rgba(29,78,216,0.16)',  shadow: 'rgba(29,78,216,0.40)' },
    green: { icon: '#15803D',     glow: 'rgba(21,128,61,0.16)',  shadow: 'rgba(21,128,61,0.40)' },
  }[accent] || { icon: 'var(--sail)', glow: 'rgba(27,42,107,0.16)', shadow: 'rgba(27,42,107,0.45)' };

  return (
    <div className="glass-kpi" style={{ '--kpi-glow': palette.glow, '--kpi-shadow': palette.shadow }}>
      <div className="glass-kpi-icon" style={{ background: palette.icon }}>
        <Icon size={20} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="relative z-[1] min-w-0">
        <p className="glass-kpi-value">{value}</p>
        <p className="glass-kpi-label">{label}</p>
        {sub && <p className="glass-kpi-sub">{sub}</p>}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets', { params: { limit: 5, sort: 'created_at', order: 'DESC' } });
      setTickets(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const open      = tickets.filter(t => t.STATUS === 'OPEN').length;
  const inProgress= tickets.filter(t => t.STATUS === 'IN_PROGRESS').length;
  const resolved  = tickets.filter(t => ['RESOLVED','CLOSED'].includes(t.STATUS)).length;
  const firstName = user?.full_name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <AppLayout title={`${greeting}, ${firstName}!`} subtitle={`${user?.designation || ''} · ${user?.dept_name || ''}`}>

      {/* Welcome banner */}
      <div className="mb-5 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden steel-mesh"
        style={{ background: 'linear-gradient(120deg, #1B2A6B 0%, #233a8a 60%, #16215A 100%)', boxShadow: 'var(--shadow-3)' }}>
        <div className="relative z-[1]">
          <h2 className="text-white font-bold text-lg mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>SAIL IT Helpdesk Portal</h2>
          <p className="text-white/60 text-sm">Need IT support? Submit a ticket and our team will assist you.</p>
        </div>
        <Link to="/tickets/new"
          className="relative z-[1] flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--sail-gold)', color: 'var(--sail-deep)', boxShadow: '0 6px 16px -4px rgba(201,168,76,0.5)' }}>
          <PlusCircle size={15} /> New Ticket
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <GlassKpi icon={Ticket}        label="Total Tickets"  value={total}      sub="All time"        accent="navy" />
        <GlassKpi icon={AlertTriangle} label="Open"           value={open}       sub="Awaiting action" accent="amber" />
        <GlassKpi icon={Clock}         label="In Progress"    value={inProgress} sub="Being worked on" accent="blue" />
        <GlassKpi icon={CheckCircle}   label="Resolved"       value={resolved}   sub="Completed"       accent="green" />
      </div>

      {/* Recent tickets */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 className="glass-panel-title">Recent Tickets</h3>
          <div className="flex gap-2">
            <button onClick={fetchData} className="btn-outline p-2 rounded-lg text-xs">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            {tickets.length > 0 && (
              <Link to="/tickets" className="btn-outline text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>

        {loading ? <PageLoader /> : tickets.length === 0 ? (
          <div className="text-center py-14">
            <Ticket size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-mid)' }}>No tickets yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>Create your first IT support ticket</p>
            <Link to="/tickets/new" className="btn-sail px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm">
              <PlusCircle size={14} /> Create Ticket
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="sail-table">
              <thead>
                <tr>
                  <th>Ticket ID</th><th>Subject</th><th>Status</th>
                  <th>Priority</th><th>SLA</th><th>Created</th><th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.TICKET_ID}>
                    <td>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                        style={{ color: 'var(--sail)', background: 'var(--sail-light)' }}>
                        {t.TICKET_REF}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm truncate max-w-xs" style={{ color: 'var(--text)' }}>{t.SUBJECT}</p>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t.CAT_NAME}</p>
                    </td>
                    <td><StatusBadge status={t.STATUS} /></td>
                    <td><PriorityBadge priority={t.PRIORITY_NAME} /></td>
                    <td><SLAIndicator dueDate={t.DUE_DATE} status={t.STATUS} /></td>
                    <td className="text-xs" style={{ color: 'var(--text-light)' }}>
                      {t.CREATED_AT ? formatDistanceToNow(new Date(t.CREATED_AT), { addSuffix: true }) : '—'}
                    </td>
                    <td>
                      <Link to={`/tickets/${t.TICKET_ID}`}
                        className="btn-outline text-xs px-3 py-1 rounded-lg">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact info row */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { Icon: Phone,     title: 'IT Helpline',     desc: 'Ext. 1234  ·  Mon–Fri, 8AM–8PM',     accent: 'navy' },
          { Icon: Mail,      title: 'Email Support',   desc: 'helpdesk@sail.in · Avg. 2hr response', accent: 'gold' },
          { Icon: Building2, title: 'Walk-In Support', desc: 'Admin Block, Room 101',               accent: 'navy' },
        ].map((c, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: c.accent === 'gold' ? 'var(--sail-gold)' : 'var(--sail)' }}>
              <c.Icon size={18} className="text-white" />
            </div>
            <div className="relative z-[1]">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.title}</p>
              <p className="text-xs" style={{ color: 'var(--text-light)' }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}