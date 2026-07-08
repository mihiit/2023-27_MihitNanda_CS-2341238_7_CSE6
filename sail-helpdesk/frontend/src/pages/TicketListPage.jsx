// frontend/src/pages/TicketListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusCircle, Search, RefreshCw, Ticket, X, SlidersHorizontal, MessageSquare, User as UserIcon } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, PageLoader, Pagination, SLAIndicator } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const STATUSES = ['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED'];

export default function TicketListPage() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority_id: searchParams.get('priority_id') || '',
    cat_id: searchParams.get('cat_id') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  useEffect(() => {
    api.get('/lookup/categories').then(r => setCategories(r.data.data || []));
    api.get('/lookup/priorities').then(r => setPriorities(r.data.data || []));
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 15, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await api.get('/tickets', { params });
      setTickets(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 15 });
    } catch { } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const clearFilters = () => setFilters({ search: '', status: '', priority_id: '', cat_id: '', page: 1 });
  const activeFilterCount = [filters.status, filters.priority_id, filters.cat_id].filter(Boolean).length;

  return (
    <AppLayout
      title={isAdmin ? 'All Tickets' : 'My Tickets'}
      subtitle={`${pagination.total} total ticket${pagination.total !== 1 ? 's' : ''}`}>

      {/* Toolbar */}
      <div className="glass-panel mb-4">
        <div className="p-3.5 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Search by subject or ticket ID…"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className="sail-input pl-9"
              style={{ background: 'rgba(255,255,255,0.7)' }}
            />
            {filters.search && (
              <button onClick={() => updateFilter('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-red-500" style={{ color: 'var(--text-light)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(s => !s)}
            className="btn-outline px-3.5 py-2 rounded-lg text-sm relative"
            style={showFilters ? { borderColor: 'var(--sail)', color: 'var(--sail)', background: 'var(--sail-light)' } : {}}>
            <SlidersHorizontal size={15} /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--sail-gold)', width: 18, height: 18 }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          <button onClick={fetchTickets} className="btn-outline p-2.5 rounded-lg" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link to="/tickets/new" className="btn-sail px-4 py-2 rounded-lg text-sm">
            <PlusCircle size={15} /> New Ticket
          </Link>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-3.5 pb-4 fade-up" style={{ borderTop: '1px solid var(--border-soft)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div>
                <label className="sail-label text-xs">Status</label>
                <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} className="sail-input py-2 text-sm">
                  <option value="">All statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="sail-label text-xs">Priority</label>
                <select value={filters.priority_id} onChange={e => updateFilter('priority_id', e.target.value)} className="sail-input py-2 text-sm">
                  <option value="">All priorities</option>
                  {priorities.map(p => <option key={p.PRIORITY_ID} value={p.PRIORITY_ID}>{p.PRIORITY_NAME}</option>)}
                </select>
              </div>
              <div>
                <label className="sail-label text-xs">Category</label>
                <select value={filters.cat_id} onChange={e => updateFilter('cat_id', e.target.value)} className="sail-input py-2 text-sm">
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c.CAT_ID} value={c.CAT_ID}>{c.CAT_NAME}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="btn-outline w-full justify-center py-2 rounded-lg text-sm">
                  <X size={14} /> Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status quick-filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', ...STATUSES].map(s => {
          const active = filters.status === s;
          return (
            <button
              key={s}
              onClick={() => updateFilter('status', s)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200"
              style={active ? {
                background: 'linear-gradient(135deg, var(--sail), var(--sail-mid))',
                color: '#fff',
                boxShadow: '0 4px 12px -2px rgba(27,42,107,0.45)',
                transform: 'translateY(-1px)',
              } : {
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--border-soft)',
                color: 'var(--text-mid)',
              }}>
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-panel">
        {loading ? (
          <PageLoader />
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-mid)' }}>No tickets found</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
              {activeFilterCount > 0 ? 'Try adjusting your filters.' : "You haven't submitted any tickets yet."}
            </p>
            <Link to="/tickets/new" className="btn-sail px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm">
              <PlusCircle size={15} /> Create Ticket
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="sail-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Category</th>
                    {isAdmin && <th>Raised By</th>}
                    {isAdmin && <th>Assigned To</th>}
                    <th>SLA</th>
                    <th>Updated</th>
                    <th></th>
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
                        <div className="max-w-xs">
                          <p className="text-sm font-medium truncate leading-tight" style={{ color: 'var(--text)' }}>{t.SUBJECT}</p>
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-light)' }}>
                            <MessageSquare size={11} /> {t.REPLY_COUNT || 0} repl{t.REPLY_COUNT !== 1 ? 'ies' : 'y'}
                          </p>
                        </div>
                      </td>
                      <td><StatusBadge status={t.STATUS} /></td>
                      <td><PriorityBadge priority={t.PRIORITY_NAME} /></td>
                      <td><span className="text-xs" style={{ color: 'var(--text-mid)' }}>{t.CAT_NAME}</span></td>
                      {isAdmin && (
                        <td className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <UserIcon size={11} style={{ color: 'var(--text-light)' }} />
                            <div>
                              <p style={{ color: 'var(--text-mid)' }}>{t.CREATED_BY_NAME}</p>
                              <p style={{ color: 'var(--text-light)' }}>{t.CREATED_BY_EMP}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      {isAdmin && (
                        <td className="text-xs">
                          {t.ASSIGNED_TO_NAME
                            ? <span style={{ color: 'var(--text-mid)' }}>{t.ASSIGNED_TO_NAME}</span>
                            : <span className="italic" style={{ color: 'var(--text-light)' }}>Unassigned</span>}
                        </td>
                      )}
                      <td><SLAIndicator dueDate={t.DUE_DATE} status={t.STATUS} /></td>
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-light)' }}>
                        {t.UPDATED_AT ? formatDistanceToNow(new Date(t.UPDATED_AT), { addSuffix: true }) : '—'}
                      </td>
                      <td>
                        <Link to={`/tickets/${t.TICKET_ID}`} className="btn-outline text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4">
              <Pagination {...pagination} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}