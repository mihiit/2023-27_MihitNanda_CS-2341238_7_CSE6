// frontend/src/pages/TicketListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusCircle, Search, Filter, RefreshCw, Ticket, X, SlidersHorizontal } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, PageLoader, EmptyState, Pagination, SLAIndicator } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const STATUSES = ['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED'];

export default function TicketListPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

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
      const res = await api.get(isAdmin ? '/admin/../tickets' : '/tickets', { params });
      setTickets(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 15 });
    } catch { } finally { setLoading(false); }
  }, [filters, isAdmin]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val, page: 1 }));
  };

  const clearFilters = () => setFilters({ search: '', status: '', priority_id: '', cat_id: '', page: 1 });

  const activeFilterCount = [filters.status, filters.priority_id, filters.cat_id].filter(Boolean).length;

  return (
    <AppLayout
      title={isAdmin ? 'All Tickets' : 'My Tickets'}
      subtitle={`${pagination.total} total ticket${pagination.total !== 1 ? 's' : ''}`}>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
          <input
            type="text"
            placeholder="Search by subject or ticket ID…"
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="form-input pl-9 py-2"
          />
          {filters.search && (
            <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`btn-secondary relative ${showFilters ? 'border-sail-400 text-sail-600 bg-sail-50' : ''}`}>
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sail-500 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button onClick={fetchTickets} className="btn-icon" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>

        <Link to="/tickets/new" className="btn-primary">
          <PlusCircle size={15} /> New Ticket
        </Link>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-4 animate-slide-down">
          <div className="card-body py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="form-label text-xs">Status</label>
                <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} className="form-input py-2 text-sm">
                  <option value="">All statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label text-xs">Priority</label>
                <select value={filters.priority_id} onChange={e => updateFilter('priority_id', e.target.value)} className="form-input py-2 text-sm">
                  <option value="">All priorities</option>
                  {priorities.map(p => <option key={p.PRIORITY_ID} value={p.PRIORITY_ID}>{p.PRIORITY_NAME}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label text-xs">Category</label>
                <select value={filters.cat_id} onChange={e => updateFilter('cat_id', e.target.value)} className="form-input py-2 text-sm">
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c.CAT_ID} value={c.CAT_ID}>{c.CAT_NAME}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="btn-secondary w-full justify-center">
                  <X size={14} /> Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status quick-filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => updateFilter('status', s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filters.status === s
                ? 'bg-sail-500 text-white shadow-sm'
                : 'bg-white border border-steel-200 text-steel-600 hover:border-sail-300 hover:text-sail-600'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <PageLoader />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets found"
            description={activeFilterCount > 0 ? 'Try adjusting your filters.' : "You haven't submitted any tickets yet."}
            action={<Link to="/tickets/new" className="btn-primary"><PlusCircle size={15} /> Create Ticket</Link>}
          />
        ) : (
          <>
            <div className="table-wrapper rounded-xl">
              <table className="data-table">
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.TICKET_ID}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-sail-600 bg-sail-50 px-1.5 py-0.5 rounded">
                          {t.TICKET_REF}
                        </span>
                      </td>
                      <td>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-steel-800 truncate leading-tight">{t.SUBJECT}</p>
                          <p className="text-xs text-steel-400">{t.REPLY_COUNT} repl{t.REPLY_COUNT !== 1 ? 'ies' : 'y'}</p>
                        </div>
                      </td>
                      <td><StatusBadge status={t.STATUS} /></td>
                      <td><PriorityBadge priority={t.PRIORITY_NAME} /></td>
                      <td><span className="text-xs text-steel-600">{t.CAT_NAME}</span></td>
                      {isAdmin && <td className="text-xs text-steel-600">{t.CREATED_BY_NAME}<br/><span className="text-steel-400">{t.CREATED_BY_EMP}</span></td>}
                      {isAdmin && <td className="text-xs">{t.ASSIGNED_TO_NAME || <span className="text-steel-400 italic">Unassigned</span>}</td>}
                      <td><SLAIndicator dueDate={t.DUE_DATE} status={t.STATUS} /></td>
                      <td className="text-xs text-steel-500">
                        {t.UPDATED_AT ? formatDistanceToNow(new Date(t.UPDATED_AT), { addSuffix: true }) : '—'}
                      </td>
                      <td>
                        <Link to={`/tickets/${t.TICKET_ID}`} className="btn-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
