// frontend/src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Ticket, RefreshCw, BellOff } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { PageLoader } from '../components/shared/UI';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_META = {
  NEW_TICKET:      { color: '#1D4ED8', bg: 'rgba(29,78,216,0.1)' },
  STATUS_CHANGE:   { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  NEW_REPLY:       { color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
  TICKET_RESOLVED: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  SLA_WARNING:     { color: '#C0392B', bg: 'rgba(192,57,43,0.1)' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-read');
      setNotifications(n => n.map(x => ({ ...x, IS_READ: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to update notifications'); }
  };

  return (
    <AppLayout title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>

      {/* Toolbar */}
      <div className="glass-panel mb-4">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: 'var(--sail)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {notifications.length} total
            </span>
            {unreadCount > 0 && (
              <span className="badge" style={{ background: 'var(--sail-gold)', color: 'var(--sail-deep)' }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={fetchNotifications} className="btn-outline p-2 rounded-lg" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-sail text-xs px-3 py-1.5 rounded-lg">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="glass-panel">
        {loading ? (
          <PageLoader />
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellOff size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-mid)' }}>No notifications yet</p>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              You'll see updates about your tickets here.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((n, i) => {
              const meta = TYPE_META[n.NOTIF_TYPE] || { color: 'var(--sail)', bg: 'var(--sail-light)' };
              const isUnread = !n.IS_READ;
              const content = (
                <div className="flex items-start gap-3 px-5 py-4 transition-colors"
                  style={{
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    background: isUnread ? 'rgba(27,42,107,0.03)' : 'transparent',
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative"
                    style={{ background: meta.bg }}>
                    <Ticket size={15} style={{ color: meta.color }} />
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                        style={{ background: 'var(--sail-gold)', border: '2px solid #fff' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: 'var(--text)', fontWeight: isUnread ? 600 : 500 }}>
                      {n.TITLE}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-mid)' }}>{n.MESSAGE}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {n.TICKET_REF && (
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ color: 'var(--sail)', background: 'var(--sail-light)' }}>
                          {n.TICKET_REF}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-light)' }}>
                        {n.CREATED_AT ? formatDistanceToNow(new Date(n.CREATED_AT), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
              return n.TICKET_ID ? (
                <Link key={n.NOTIF_ID} to={`/tickets/${n.TICKET_ID}`} className="block hover:bg-[--off]">
                  {content}
                </Link>
              ) : (
                <div key={n.NOTIF_ID}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}