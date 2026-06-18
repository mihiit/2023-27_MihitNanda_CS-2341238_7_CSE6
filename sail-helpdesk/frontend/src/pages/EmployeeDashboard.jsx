import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Ticket, Clock, CheckCircle, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, PageLoader, SLAIndicator } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

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
      <div className="mb-5 rounded-xl p-5 flex items-center justify-between"
        style={{ background: '#1B2A6B' }}>
        <div>
          <h2 className="text-white font-bold text-lg mb-1">SAIL IT Helpdesk Portal</h2>
          <p className="text-white/60 text-sm">Need IT support? Submit a ticket and our team will assist you.</p>
        </div>
        <Link to="/tickets/new"
          className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-[#1B2A6B] hover:bg-[#EEF0FA] transition-colors">
          <PlusCircle size={15} /> New Ticket
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard icon={Ticket}        label="Total Tickets"  value={total}      sub="All time"        bg="#1B2A6B" />
        <KpiCard icon={AlertTriangle} label="Open"           value={open}       sub="Awaiting action" bg="#D97706" />
        <KpiCard icon={Clock}         label="In Progress"    value={inProgress} sub="Being worked on" bg="#1D4ED8" />
        <KpiCard icon={CheckCircle}   label="Resolved"       value={resolved}   sub="Completed"       bg="#15803D" />
      </div>

      {/* Recent tickets */}
      <div className="sail-card">
        <div className="sail-card-header">
          <h3 className="sail-card-title">Recent Tickets</h3>
          <div className="flex gap-2">
            <button onClick={fetchData} className="btn-outline p-2 rounded-lg text-xs">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/tickets" className="btn-outline text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {loading ? <PageLoader /> : tickets.length === 0 ? (
          <div className="text-center py-14">
            <Ticket size={36} className="mx-auto text-[#DDE3F0] mb-3" />
            <p className="text-[#4A5068] font-medium mb-1">No tickets yet</p>
            <p className="text-sm text-[#8890B5] mb-4">Create your first IT support ticket</p>
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
                      <span className="font-mono text-xs font-bold text-[#1B2A6B] bg-[#EEF0FA] px-2 py-0.5 rounded">
                        {t.TICKET_REF}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-[#1A1F3C] text-sm truncate max-w-xs">{t.SUBJECT}</p>
                      <p className="text-xs text-[#8890B5]">{t.CAT_NAME}</p>
                    </td>
                    <td><StatusBadge status={t.STATUS} /></td>
                    <td><PriorityBadge priority={t.PRIORITY_NAME} /></td>
                    <td><SLAIndicator dueDate={t.DUE_DATE} status={t.STATUS} /></td>
                    <td className="text-xs text-[#8890B5]">
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
          { emoji: '📞', title: 'IT Helpline', desc: 'Ext. 1234  ·  Mon–Fri, 8AM–8PM' },
          { emoji: '📧', title: 'Email Support', desc: 'helpdesk@sail.in · Avg. 2hr response' },
          { emoji: '🏢', title: 'Walk-In Support', desc: 'Admin Block, Room 101' },
        ].map((c, i) => (
          <div key={i} className="sail-card p-4 flex items-center gap-3">
            <span className="text-2xl">{c.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-[#1A1F3C]">{c.title}</p>
              <p className="text-xs text-[#8890B5]">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
