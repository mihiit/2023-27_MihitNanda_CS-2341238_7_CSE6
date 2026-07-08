// frontend/src/pages/TicketDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Paperclip, Tag,
  Edit3, CheckCircle, Loader2, Lock, Star, MessageSquare, Mail, Phone, Clock4,
} from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, SLAIndicator, Modal, StarRating, PageLoader } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

function ReplyBubble({ reply }) {
  const isAgent = ['ADMIN','SUPERADMIN','AGENT'].includes(reply.AUTHOR_ROLE);
  const isInternal = reply.REPLY_TYPE === 'INTERNAL';

  return (
    <div className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={isAgent
          ? { background: 'var(--sail)', color: '#fff', boxShadow: '0 4px 10px -2px rgba(27,42,107,0.5)' }
          : { background: 'var(--off)', color: 'var(--text-mid)', border: '1px solid var(--border-soft)' }}>
        {reply.AUTHOR_NAME?.charAt(0)}
      </div>
      <div className={`flex-1 max-w-2xl ${isAgent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-light)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-mid)' }}>{reply.AUTHOR_NAME}</span>
          <span>·</span>
          <span>{reply.AUTHOR_EMP}</span>
          {isInternal && (
            <span className="badge flex items-center gap-1" style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309' }}>
              <Lock size={10} /> Internal Note
            </span>
          )}
          {reply.IS_SOLUTION === 1 && (
            <span className="badge flex items-center gap-1" style={{ background: 'rgba(21,128,61,0.12)', color: '#15803D' }}>
              <CheckCircle size={10} /> Solution
            </span>
          )}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isAgent ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
          style={isAgent
            ? { background: 'linear-gradient(135deg, var(--sail), var(--sail-mid))', color: '#fff', boxShadow: 'var(--shadow-1)' }
            : isInternal
            ? { background: 'rgba(254,243,224,0.8)', border: '1px solid rgba(217,119,6,0.25)', color: 'var(--text)' }
            : { background: 'var(--off)', color: 'var(--text)' }}>
          {reply.BODY}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-light)' }}>
          {reply.CREATED_AT ? formatDistanceToNow(new Date(reply.CREATED_AT), { addSuffix: true }) : ''}
        </span>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [replyType, setReplyType] = useState('PUBLIC');
  const [replyFiles, setReplyFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [updateForm, setUpdateForm] = useState({ status: '', assigned_to: '', priority_id: '', note: '' });
  const [feedback, setFeedback] = useState({ satisfaction: 0, feedback: '' });
  const repliesEndRef = useRef(null);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data);
      setUpdateForm({ status: res.data.data.STATUS, assigned_to: res.data.data.ASSIGNED_TO || '', priority_id: res.data.data.PRIORITY_ID, note: '' });
    } catch { navigate('/tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTicket();
    if (isAdmin) {
      api.get('/admin/users', { params: { role: 'AGENT' } }).then(r => setAgents(r.data.data || []));
      api.get('/lookup/priorities').then(r => setPriorities(r.data.data || []));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies]);

  const submitReply = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('body', reply);
      fd.append('reply_type', replyType);
      replyFiles.forEach(f => fd.append('attachments', f));
      await api.post(`/tickets/${id}/replies`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Reply sent');
      setReply('');
      setReplyFiles([]);
      fetchTicket();
    } catch { } finally { setSubmitting(false); }
  };

  const updateTicket = async () => {
    try {
      await api.put(`/tickets/${id}`, updateForm);
      toast.success('Ticket updated');
      setShowUpdateModal(false);
      fetchTicket();
    } catch { }
  };

  const submitFeedback = async () => {
    if (!feedback.satisfaction) { toast.error('Please rate the resolution'); return; }
    try {
      await api.post(`/tickets/${id}/feedback`, feedback);
      toast.success('Thank you for your feedback!');
      setShowFeedbackModal(false);
      fetchTicket();
    } catch { }
  };

  if (loading) return <AppLayout title="Loading ticket…"><PageLoader /></AppLayout>;
  if (!ticket) return null;

  const isOwner = ticket.CREATED_BY === user?.user_id;
  const canFeedback = isOwner && ['RESOLVED','CLOSED'].includes(ticket.STATUS) && !ticket.SATISFACTION;

  const infoRows = [
    { label: 'Status',      val: <StatusBadge status={ticket.STATUS} /> },
    { label: 'Priority',    val: <PriorityBadge priority={ticket.PRIORITY_NAME} /> },
    { label: 'Category',    val: ticket.CAT_NAME },
    { label: 'Department',  val: ticket.DEPT_NAME || '—' },
    { label: 'SLA',         val: <SLAIndicator dueDate={ticket.DUE_DATE} status={ticket.STATUS} /> },
    { label: 'Due',         val: ticket.DUE_DATE ? format(new Date(ticket.DUE_DATE), 'MMM d, h:mm a') : '—' },
    { label: 'Created',     val: ticket.CREATED_AT ? format(new Date(ticket.CREATED_AT), 'MMM d, yyyy') : '—' },
    { label: 'Resolved',    val: ticket.RESOLVED_AT ? format(new Date(ticket.RESOLVED_AT), 'MMM d, yyyy') : '—' },
    { label: 'Assigned To', val: ticket.ASSIGNED_TO_NAME || <span className="italic" style={{ color: 'var(--text-light)' }}>Unassigned</span> },
  ];

  return (
    <AppLayout title={ticket.TICKET_REF} subtitle={ticket.SUBJECT}>
      <div className="max-w-5xl mx-auto">
        {/* Back + Actions bar */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/tickets" className="btn-outline text-xs px-3 py-1.5 rounded-lg">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex gap-2">
            {canFeedback && (
              <button onClick={() => setShowFeedbackModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--sail-gold)', color: 'var(--sail-deep)', boxShadow: '0 4px 12px -2px rgba(201,168,76,0.5)' }}>
                <Star size={14} /> Rate Resolution
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowUpdateModal(true)} className="btn-sail text-xs px-3 py-1.5 rounded-lg">
                <Edit3 size={14} /> Update Ticket
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Ticket body */}
            <div className="glass-panel">
              <div className="glass-panel-header">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold" style={{ color: 'var(--sail)' }}>{ticket.TICKET_REF}</span>
                    <StatusBadge status={ticket.STATUS} />
                    <PriorityBadge priority={ticket.PRIORITY_NAME} />
                  </div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: "'Playfair Display', serif" }}>{ticket.SUBJECT}</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--off)', color: 'var(--text-mid)', border: '1px solid var(--border-soft)' }}>
                    {ticket.CREATED_BY_NAME?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{ticket.CREATED_BY_NAME}</p>
                    <p className="text-xs" style={{ color: 'var(--text-light)' }}>
                      {ticket.CREATED_AT ? format(new Date(ticket.CREATED_AT), 'MMM d, yyyy · h:mm a') : ''}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed"
                  style={{ background: 'var(--off)', color: 'var(--text)' }}>
                  {ticket.DESCRIPTION}
                </div>
                {ticket.TAGS && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {ticket.TAGS.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="badge flex items-center gap-1"
                        style={{ background: 'var(--sail-light)', color: 'var(--sail)' }}>
                        <Tag size={10} />{tag}
                      </span>
                    ))}
                  </div>
                )}
                {ticket.SATISFACTION && (
                  <div className="mt-4 p-3.5 rounded-xl glass-card" style={{ background: 'rgba(240,253,244,0.7)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#15803D' }}>Resolution Rating</p>
                    <StarRating value={ticket.SATISFACTION} readOnly />
                    {ticket.FEEDBACK && <p className="text-xs mt-1.5 italic" style={{ color: 'var(--text-mid)' }}>"{ticket.FEEDBACK}"</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Replies thread */}
            <div className="glass-panel">
              <div className="glass-panel-header">
                <h3 className="glass-panel-title flex items-center gap-2">
                  <MessageSquare size={15} /> Conversation ({ticket.replies?.length || 0})
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {!ticket.replies?.length && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-light)' }}>No replies yet. Add a comment below.</p>
                )}
                {ticket.replies?.map(r => <ReplyBubble key={r.REPLY_ID} reply={r} />)}
                <div ref={repliesEndRef} />
              </div>

              {/* Reply box */}
              {!['CLOSED','CANCELLED'].includes(ticket.STATUS) && (
                <div className="px-5 pb-5 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
                  {isAdmin && (
                    <div className="flex gap-2 mb-3">
                      {['PUBLIC','INTERNAL'].map(t => (
                        <button key={t} type="button" onClick={() => setReplyType(t)}
                          className="text-xs px-3 py-1 rounded-full border font-medium transition-all"
                          style={replyType === t
                            ? { background: 'var(--sail)', color: '#fff', borderColor: 'var(--sail)' }
                            : { borderColor: 'var(--border)', color: 'var(--text-mid)' }}>
                          {t === 'PUBLIC' ? 'Public Reply' : 'Internal Note'}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    rows={4}
                    placeholder={replyType === 'INTERNAL' ? 'Internal note (only visible to IT staff)…' : 'Type your reply…'}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    className="sail-input resize-none mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <label className="btn-outline text-xs px-3 py-1.5 rounded-lg cursor-pointer">
                      <Paperclip size={14} /> Attach
                      <input type="file" className="hidden" multiple onChange={e => setReplyFiles(Array.from(e.target.files))} />
                    </label>
                    {replyFiles.length > 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-light)' }}>{replyFiles.length} file(s) selected</span>
                    )}
                    <button onClick={submitReply} disabled={!reply.trim() || submitting} className="btn-sail px-4 py-2 rounded-lg text-sm">
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket meta */}
            <div className="glass-panel">
              <div className="glass-panel-header"><h3 className="glass-panel-title text-sm">Ticket Info</h3></div>
              <div className="p-4 space-y-3 text-sm">
                {infoRows.map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-light)' }}>{row.label}</span>
                    <span className="text-right text-xs font-semibold" style={{ color: 'var(--text)' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requester */}
            <div className="glass-panel">
              <div className="glass-panel-header"><h3 className="glass-panel-title text-sm">Requester</h3></div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'var(--sail)', boxShadow: '0 4px 10px -2px rgba(27,42,107,0.5)' }}>
                    {ticket.CREATED_BY_NAME?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{ticket.CREATED_BY_NAME}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-light)' }}>{ticket.CREATED_BY_EMP}</p>
                  </div>
                </div>
                <p className="text-xs flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-mid)' }}>
                  <Mail size={11} style={{ color: 'var(--text-light)' }} /> {ticket.CREATED_BY_EMAIL}
                </p>
                {ticket.CREATED_BY_PHONE && (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
                    <Phone size={11} style={{ color: 'var(--text-light)' }} /> {ticket.CREATED_BY_PHONE}
                  </p>
                )}
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div className="glass-panel">
                <div className="glass-panel-header"><h3 className="glass-panel-title text-sm">Attachments</h3></div>
                <div className="p-4 space-y-2">
                  {ticket.attachments.map(a => (
                    <a key={a.ATTACH_ID}
                      href={`/uploads/${a.STORAGE_PATH?.split('/').pop()}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg transition-colors"
                      style={{ border: '1px solid var(--border-soft)' }}>
                      <Paperclip size={14} style={{ color: 'var(--text-light)' }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{a.FILE_NAME}</p>
                        <p className="text-xs" style={{ color: 'var(--text-light)' }}>{(a.FILE_SIZE / 1024).toFixed(1)} KB</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {ticket.history?.length > 0 && (
              <div className="glass-panel">
                <div className="glass-panel-header"><h3 className="glass-panel-title text-sm">Change History</h3></div>
                <div className="p-4 space-y-3">
                  {ticket.history.map(h => (
                    <div key={h.HISTORY_ID} className="text-xs pl-3" style={{ borderLeft: '2px solid var(--sail-light)', color: 'var(--text-mid)' }}>
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{h.FIELD_NAME} changed</p>
                      <p>{h.OLD_VALUE} → {h.NEW_VALUE}</p>
                      {h.CHANGE_NOTE && <p className="italic" style={{ color: 'var(--text-light)' }}>"{h.CHANGE_NOTE}"</p>}
                      <p className="flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-light)' }}>
                        <Clock4 size={10} /> by {h.CHANGED_BY_NAME} · {h.CREATED_AT ? formatDistanceToNow(new Date(h.CREATED_AT), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <Modal open={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update Ticket" size="md">
        <div className="space-y-4">
          <div>
            <label className="sail-label">Status</label>
            <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))} className="sail-input">
              {['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="sail-label">Priority</label>
            <select value={updateForm.priority_id} onChange={e => setUpdateForm(f => ({ ...f, priority_id: e.target.value }))} className="sail-input">
              {priorities.map(p => <option key={p.PRIORITY_ID} value={p.PRIORITY_ID}>{p.PRIORITY_NAME}</option>)}
            </select>
          </div>
          <div>
            <label className="sail-label">Assign To</label>
            <select value={updateForm.assigned_to} onChange={e => setUpdateForm(f => ({ ...f, assigned_to: e.target.value }))} className="sail-input">
              <option value="">Unassigned</option>
              {agents.map(a => <option key={a.USER_ID} value={a.USER_ID}>{a.FULL_NAME} ({a.EMP_ID})</option>)}
            </select>
          </div>
          <div>
            <label className="sail-label">Internal Note</label>
            <textarea rows={3} value={updateForm.note} onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))}
              className="sail-input resize-none" placeholder="Reason for this update (optional)" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowUpdateModal(false)} className="btn-outline px-4 py-2 rounded-lg">Cancel</button>
            <button onClick={updateTicket} className="btn-sail px-4 py-2 rounded-lg">Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Rate This Resolution" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>How satisfied are you with the resolution of this ticket?</p>
          <div className="flex justify-center">
            <StarRating value={feedback.satisfaction} onChange={v => setFeedback(f => ({ ...f, satisfaction: v }))} />
          </div>
          <textarea rows={3} placeholder="Any additional comments? (optional)"
            value={feedback.feedback} onChange={e => setFeedback(f => ({ ...f, feedback: e.target.value }))}
            className="sail-input resize-none text-left" />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowFeedbackModal(false)} className="btn-outline px-4 py-2 rounded-lg">Skip</button>
            <button onClick={submitFeedback}
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{ background: 'var(--sail-gold)', color: 'var(--sail-deep)' }}>
              Submit Feedback
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}