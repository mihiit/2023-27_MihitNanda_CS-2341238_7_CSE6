// frontend/src/pages/TicketDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Paperclip, User, Clock, Tag, Building2,
  Edit3, CheckCircle, XCircle, AlertTriangle, Loader2, Lock, Star,
} from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { StatusBadge, PriorityBadge, SLAIndicator, Modal, StarRating, Alert, PageLoader } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

function ReplyBubble({ reply, isAdmin }) {
  const isAgent = ['ADMIN','SUPERADMIN','AGENT'].includes(reply.AUTHOR_ROLE);
  const isInternal = reply.REPLY_TYPE === 'INTERNAL';

  return (
    <div className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isAgent ? 'bg-sail-500 text-white' : 'bg-steel-200 text-steel-600'
      }`}>
        {reply.AUTHOR_NAME?.charAt(0)}
      </div>
      <div className={`flex-1 max-w-2xl ${isAgent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2 text-xs text-steel-500">
          <span className="font-semibold text-steel-700">{reply.AUTHOR_NAME}</span>
          <span>·</span>
          <span>{reply.AUTHOR_EMP}</span>
          {isInternal && (
            <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
              <Lock size={10} /> Internal Note
            </span>
          )}
          {reply.IS_SOLUTION === 1 && (
            <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle size={10} /> Solution
            </span>
          )}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAgent
            ? 'bg-sail-500 text-white rounded-tr-sm'
            : isInternal
            ? 'bg-amber-50 border border-amber-200 text-steel-700 rounded-tl-sm'
            : 'bg-steel-100 text-steel-800 rounded-tl-sm'
        }`}>
          {reply.BODY}
        </div>
        <span className="text-xs text-steel-400">
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

  return (
    <AppLayout title={ticket.TICKET_REF} subtitle={ticket.SUBJECT}>
      <div className="max-w-5xl mx-auto">
        {/* Back + Actions bar */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/tickets" className="btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex gap-2">
            {canFeedback && (
              <button onClick={() => setShowFeedbackModal(true)} className="btn-gold btn-sm">
                <Star size={14} /> Rate Resolution
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowUpdateModal(true)} className="btn-primary btn-sm">
                <Edit3 size={14} /> Update Ticket
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Ticket body */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-sail-600 font-bold">{ticket.TICKET_REF}</span>
                    <StatusBadge status={ticket.STATUS} />
                    <PriorityBadge priority={ticket.PRIORITY_NAME} />
                  </div>
                  <h2 className="font-heading font-bold text-steel-800 text-lg">{ticket.SUBJECT}</h2>
                </div>
              </div>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-steel-200 flex items-center justify-center text-sm font-bold text-steel-600">
                    {ticket.CREATED_BY_NAME?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-steel-700">{ticket.CREATED_BY_NAME}</p>
                    <p className="text-xs text-steel-400">
                      {ticket.CREATED_AT ? format(new Date(ticket.CREATED_AT), 'MMM d, yyyy · h:mm a') : ''}
                    </p>
                  </div>
                </div>
                <div className="bg-steel-50 rounded-xl p-4 text-sm text-steel-700 whitespace-pre-wrap leading-relaxed">
                  {ticket.DESCRIPTION}
                </div>
                {ticket.TAGS && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {ticket.TAGS.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="badge bg-sail-50 text-sail-600 border border-sail-100">
                        <Tag size={10} className="mr-1" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Satisfaction rating if given */}
                {ticket.SATISFACTION && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-1">Resolution Rating</p>
                    <StarRating value={ticket.SATISFACTION} readOnly />
                    {ticket.FEEDBACK && <p className="text-xs text-steel-600 mt-1">"{ticket.FEEDBACK}"</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Replies thread */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-heading font-bold text-steel-700">
                  Conversation ({ticket.replies?.length || 0})
                </h3>
              </div>
              <div className="card-body space-y-5">
                {!ticket.replies?.length && (
                  <p className="text-sm text-steel-400 text-center py-4">No replies yet. Add a comment below.</p>
                )}
                {ticket.replies?.map(r => (
                  <ReplyBubble key={r.REPLY_ID} reply={r} isAdmin={isAdmin} />
                ))}
                <div ref={repliesEndRef} />
              </div>

              {/* Reply box */}
              {!['CLOSED','CANCELLED'].includes(ticket.STATUS) && (
                <div className="px-6 pb-6 border-t border-steel-100 pt-4">
                  {isAdmin && (
                    <div className="flex gap-2 mb-3">
                      {['PUBLIC','INTERNAL'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setReplyType(t)}
                          className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                            replyType === t ? 'bg-sail-500 text-white border-sail-500' : 'border-steel-200 text-steel-600 hover:border-sail-300'
                          }`}>
                          {t === 'PUBLIC' ? '💬 Public Reply' : '🔒 Internal Note'}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    rows={4}
                    placeholder={replyType === 'INTERNAL' ? 'Internal note (only visible to IT staff)…' : 'Type your reply…'}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    className="form-input resize-none mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <label className="btn-secondary btn-sm cursor-pointer">
                      <Paperclip size={14} /> Attach
                      <input type="file" className="hidden" multiple onChange={e => setReplyFiles(Array.from(e.target.files))} />
                    </label>
                    {replyFiles.length > 0 && (
                      <span className="text-xs text-steel-500">{replyFiles.length} file(s) selected</span>
                    )}
                    <button
                      onClick={submitReply}
                      disabled={!reply.trim() || submitting}
                      className="btn-primary">
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket meta */}
            <div className="card">
              <div className="card-header"><h3 className="font-heading font-bold text-steel-700 text-sm">Ticket Info</h3></div>
              <div className="card-body space-y-3 text-sm">
                {[
                  { label: 'Status',     val: <StatusBadge status={ticket.STATUS} /> },
                  { label: 'Priority',   val: <PriorityBadge priority={ticket.PRIORITY_NAME} /> },
                  { label: 'Category',   val: ticket.CAT_NAME },
                  { label: 'Department', val: ticket.DEPT_NAME || '—' },
                  { label: 'SLA',        val: <SLAIndicator dueDate={ticket.DUE_DATE} status={ticket.STATUS} /> },
                  { label: 'Due',        val: ticket.DUE_DATE ? format(new Date(ticket.DUE_DATE), 'MMM d, h:mm a') : '—' },
                  { label: 'Created',    val: ticket.CREATED_AT ? format(new Date(ticket.CREATED_AT), 'MMM d, yyyy') : '—' },
                  { label: 'Resolved',   val: ticket.RESOLVED_AT ? format(new Date(ticket.RESOLVED_AT), 'MMM d, yyyy') : '—' },
                  { label: 'Assigned To', val: ticket.ASSIGNED_TO_NAME || <span className="text-steel-400 italic">Unassigned</span> },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-2">
                    <span className="text-steel-500 text-xs font-medium whitespace-nowrap">{row.label}</span>
                    <span className="text-right text-xs text-steel-700 font-semibold">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requester */}
            <div className="card">
              <div className="card-header"><h3 className="font-heading font-bold text-steel-700 text-sm">Requester</h3></div>
              <div className="card-body">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-sail-500 flex items-center justify-center text-white font-bold">
                    {ticket.CREATED_BY_NAME?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-steel-700">{ticket.CREATED_BY_NAME}</p>
                    <p className="text-xs text-steel-400">{ticket.CREATED_BY_EMP}</p>
                  </div>
                </div>
                <p className="text-xs text-steel-500 mb-1">{ticket.CREATED_BY_EMAIL}</p>
                {ticket.CREATED_BY_PHONE && <p className="text-xs text-steel-500">{ticket.CREATED_BY_PHONE}</p>}
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div className="card">
                <div className="card-header"><h3 className="font-heading font-bold text-steel-700 text-sm">Attachments</h3></div>
                <div className="card-body space-y-2">
                  {ticket.attachments.map(a => (
                    <a key={a.ATTACH_ID}
                      href={`/uploads/${a.STORAGE_PATH?.split('/').pop()}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg border border-steel-100 hover:bg-sail-50 hover:border-sail-200 transition-colors">
                      <span className="text-base">📎</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-steel-700 truncate">{a.FILE_NAME}</p>
                        <p className="text-xs text-steel-400">{(a.FILE_SIZE / 1024).toFixed(1)} KB</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {ticket.history?.length > 0 && (
              <div className="card">
                <div className="card-header"><h3 className="font-heading font-bold text-steel-700 text-sm">Change History</h3></div>
                <div className="card-body space-y-3">
                  {ticket.history.map(h => (
                    <div key={h.HISTORY_ID} className="text-xs text-steel-600 border-l-2 border-sail-200 pl-3">
                      <p className="font-semibold text-steel-700">{h.FIELD_NAME} changed</p>
                      <p className="text-steel-500">{h.OLD_VALUE} → {h.NEW_VALUE}</p>
                      {h.CHANGE_NOTE && <p className="italic text-steel-400">"{h.CHANGE_NOTE}"</p>}
                      <p className="text-steel-400 mt-0.5">by {h.CHANGED_BY_NAME} · {h.CREATED_AT ? formatDistanceToNow(new Date(h.CREATED_AT), { addSuffix: true }) : ''}</p>
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
          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))} className="form-input">
              {['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select value={updateForm.priority_id} onChange={e => setUpdateForm(f => ({ ...f, priority_id: e.target.value }))} className="form-input">
              {priorities.map(p => <option key={p.PRIORITY_ID} value={p.PRIORITY_ID}>{p.PRIORITY_NAME}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select value={updateForm.assigned_to} onChange={e => setUpdateForm(f => ({ ...f, assigned_to: e.target.value }))} className="form-input">
              <option value="">Unassigned</option>
              {agents.map(a => <option key={a.USER_ID} value={a.USER_ID}>{a.FULL_NAME} ({a.EMPLOYEE_ID})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Internal Note</label>
            <textarea rows={3} value={updateForm.note} onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))} className="form-input resize-none" placeholder="Reason for this update (optional)" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowUpdateModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={updateTicket} className="btn-primary">Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Rate This Resolution" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-sm text-steel-600">How satisfied are you with the resolution of this ticket?</p>
          <div className="flex justify-center">
            <StarRating value={feedback.satisfaction} onChange={v => setFeedback(f => ({ ...f, satisfaction: v }))} />
          </div>
          <textarea
            rows={3}
            placeholder="Any additional comments? (optional)"
            value={feedback.feedback}
            onChange={e => setFeedback(f => ({ ...f, feedback: e.target.value }))}
            className="form-input resize-none text-left"
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowFeedbackModal(false)} className="btn-secondary">Skip</button>
            <button onClick={submitFeedback} className="btn-gold">Submit Feedback</button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
