import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    OPEN:        ['badge-open',      'Open'],
    IN_PROGRESS: ['badge-progress',  'In Progress'],
    PENDING:     ['badge-pending',   'Pending'],
    RESOLVED:    ['badge-resolved',  'Resolved'],
    CLOSED:      ['badge-closed',    'Closed'],
    CANCELLED:   ['badge-cancelled', 'Cancelled'],
  };
  const [cls, label] = map[status] || ['badge bg-gray-100 text-gray-600', status];
  return <span className={cls}>{label}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    CRITICAL: 'badge-critical',
    HIGH:     'badge-high',
    MEDIUM:   'badge-medium',
    LOW:      'badge-low',
  };
  return <span className={map[priority?.toUpperCase()] || 'badge bg-gray-100 text-gray-600'}>{priority}</span>;
}

export function RoleBadge({ role }) {
  const map = {
    SUPERADMIN: 'badge bg-purple-100 text-purple-800',
    ADMIN:      'badge bg-[#EEF0FA] text-[#1B2A6B]',
    AGENT:      'badge bg-teal-100 text-teal-800',
    EMPLOYEE:   'badge bg-slate-100 text-slate-600',
  };
  return <span className={map[role] || 'badge bg-gray-100 text-gray-600'}>{role}</span>;
}

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-[#1B2A6B] ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <img src="/sail-logo.png" alt="SAIL" className="w-10 h-10 object-contain mx-auto mb-3 animate-pulse" />
        <p className="text-sm text-[#8890B5]">Loading…</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[#EEF0FA] flex items-center justify-center mb-4">
          <Icon size={24} className="text-[#8890B5]" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#4A5068] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#8890B5] max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  );
}

export function Alert({ type = 'info', title, children, onClose }) {
  const cfg = {
    info:    { cls: 'bg-blue-50 border-blue-200 text-blue-800',    Icon: Info },
    success: { cls: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle },
    warning: { cls: 'bg-amber-50 border-amber-200 text-amber-800', Icon: AlertCircle },
    error:   { cls: 'bg-red-50 border-red-200 text-red-800',       Icon: AlertCircle },
  };
  const { cls, Icon } = cfg[type] || cfg.info;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${cls}`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">{title && <p className="font-semibold mb-0.5">{title}</p>}{children}</div>
      {onClose && <button onClick={onClose}><X size={14} /></button>}
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pageNums = Array.from({ length: Math.min(pages, 5) }, (_, i) => {
    if (pages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pages - 2) return pages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#DDE3F0] bg-white rounded-b-xl">
      <p className="text-xs text-[#8890B5]">Showing <b>{from}–{to}</b> of <b>{total}</b></p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="w-7 h-7 rounded-lg border border-[#DDE3F0] flex items-center justify-center text-[#4A5068] disabled:opacity-40 hover:border-[#1B2A6B] hover:text-[#1B2A6B]">
          <ChevronLeft size={14} />
        </button>
        {pageNums.map(p => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              p === page ? 'text-white' : 'text-[#4A5068] hover:bg-[#EEF0FA]'
            }`}
            style={p === page ? { background: '#1B2A6B' } : {}}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === pages}
          className="w-7 h-7 rounded-lg border border-[#DDE3F0] flex items-center justify-center text-[#4A5068] disabled:opacity-40 hover:border-[#1B2A6B] hover:text-[#1B2A6B]">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} fade-up`}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <h2 className="text-base font-bold font-heading" style={{ color: 'var(--sail)', fontFamily: "'Playfair Display', serif" }}>{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[--off]" style={{ color: 'var(--text-light)' }}>
              <X size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SLAIndicator({ dueDate, status }) {
  if (!dueDate || ['RESOLVED','CLOSED','CANCELLED'].includes(status)) return null;
  const diff = (new Date(dueDate) - new Date()) / 3600000;
  if (diff < 0)  return <span className="text-xs text-red-600 font-bold">⚠ Breached</span>;
  if (diff < 2)  return <span className="text-xs text-orange-600 font-semibold">⏰ Due soon</span>;
  if (diff < 8)  return <span className="text-xs text-amber-600">Due in {Math.round(diff)}h</span>;
  return <span className="text-xs text-green-600">On track</span>;
}

export function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => !readOnly && onChange?.(s)}
          className={`text-xl transition-colors ${s <= value ? 'text-yellow-400' : 'text-gray-200'} ${readOnly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-400'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-[#4A5068] mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button onClick={onConfirm}
          className={danger ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700' : 'btn-sail px-4 py-2 rounded-lg'}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}