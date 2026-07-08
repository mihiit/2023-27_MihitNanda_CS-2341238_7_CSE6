// frontend/src/pages/CreateTicketPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Upload, X, CheckCircle, Loader2, Tag,
  Monitor, Wifi, Database, Mail, Shield, Printer, HelpCircle,
  Clock, Target, Sparkles,
} from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

/* Map category codes to icons — falls back to HelpCircle for anything unmapped */
const CAT_ICONS = {
  HARDWARE: Monitor, NETWORK: Wifi, SOFTWARE: Database,
  EMAIL: Mail, SECURITY: Shield, PRINTER: Printer,
};

const PRIORITY_META = {
  CRITICAL: { desc: 'System down / Security breach', color: '#C0392B', glow: 'rgba(192,57,43,0.22)' },
  HIGH:     { desc: 'Major function impacted',        color: '#D97706', glow: 'rgba(217,119,6,0.20)' },
  MEDIUM:   { desc: 'Workaround available',            color: '#B7950B', glow: 'rgba(183,149,11,0.18)' },
  LOW:      { desc: 'Minor issue / Request',           color: '#15803D', glow: 'rgba(21,128,61,0.18)' },
};

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    subject: '', description: '', priority_id: '', cat_id: '', dept_id: '', tags: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/lookup/categories'),
      api.get('/lookup/priorities'),
      api.get('/lookup/departments'),
    ]).then(([cats, pris, depts]) => {
      setCategories(cats.data.data || []);
      setPriorities(pris.data.data || []);
      setDepartments(depts.data.data || []);
      const med = (pris.data.data || []).find(p => p.PRIORITY_CODE === 'MEDIUM');
      if (med) setForm(f => ({ ...f, priority_id: String(med.PRIORITY_ID) }));
    });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.subject.trim() || form.subject.length < 5) e.subject = 'Subject must be at least 5 characters';
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.priority_id) e.priority_id = 'Select a priority';
    if (!form.cat_id) e.cat_id = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    const filtered = newFiles.filter(f => f.size <= 10 * 1024 * 1024);
    if (filtered.length < newFiles.length) toast.error('Some files exceed 10MB limit');
    setFiles(prev => [...prev, ...filtered].slice(0, 5));
  };
  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      files.forEach(f => fd.append('attachments', f));
      const res = await api.post('/tickets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Ticket ${res.data.data.ticket_ref} created successfully!`);
      navigate(`/tickets/${res.data.data.ticket_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorities.find(p => String(p.PRIORITY_ID) === form.priority_id);
  const selectedCategory = categories.find(c => String(c.CAT_ID) === form.cat_id);
  const selectedDept = departments.find(d => String(d.DEPT_ID) === form.dept_id);
  const pMeta = selectedPriority ? PRIORITY_META[selectedPriority.PRIORITY_CODE] : null;

  return (
    <AppLayout title="Create New Ticket" subtitle="Submit a new IT support request">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Form column ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

          {/* Subject + Description */}
          <div className="glass-panel">
            <div className="glass-panel-header"><h3 className="glass-panel-title">Ticket Details</h3></div>
            <div className="p-5 space-y-4">
              <div>
                <label className="sail-label">Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Brief description of your issue (e.g., 'SAP login error on workstation WS-FIN-012')"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className={`sail-input ${errors.subject ? 'ring-2 ring-red-300 border-red-400' : ''}`}
                  maxLength={300}
                />
                <div className="flex justify-between mt-1">
                  {errors.subject ? <p className="text-xs text-red-500">{errors.subject}</p> : <span />}
                  <span className="text-xs" style={{ color: 'var(--text-light)' }}>{form.subject.length}/300</span>
                </div>
              </div>

              <div>
                <label className="sail-label">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={6}
                  placeholder={"Please describe the issue in detail:\n• What were you trying to do?\n• What error message did you see?\n• When did it start?"}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`sail-input resize-none ${errors.description ? 'ring-2 ring-red-300 border-red-400' : ''}`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="sail-label">Department</label>
                <select
                  value={form.dept_id}
                  onChange={e => setForm(f => ({ ...f, dept_id: e.target.value }))}
                  className="sail-input">
                  <option value="">My Department (default)</option>
                  {departments.map(d => <option key={d.DEPT_ID} value={d.DEPT_ID}>{d.DEPT_NAME}</option>)}
                </select>
              </div>

              <div>
                <label className="sail-label flex items-center gap-1.5"><Tag size={12} /> Tags (optional)</label>
                <input type="text" placeholder="e.g. SAP, email, VPN (comma separated)"
                  value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="sail-input" />
              </div>
            </div>
          </div>

          {/* Category — icon tiles */}
          <div className="glass-panel">
            <div className="glass-panel-header">
              <h3 className="glass-panel-title">Category</h3>
              {errors.cat_id && <span className="text-xs text-red-500 font-semibold">{errors.cat_id}</span>}
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {categories.map(c => {
                  const Icon = CAT_ICONS[c.CAT_CODE] || HelpCircle;
                  const selected = form.cat_id === String(c.CAT_ID);
                  return (
                    <button
                      type="button" key={c.CAT_ID}
                      onClick={() => setForm(f => ({ ...f, cat_id: String(c.CAT_ID) }))}
                      className={`cat-tile ${selected ? 'selected' : ''}`}>
                      <div className="cat-tile-icon">
                        <Icon size={18} style={{ color: 'var(--sail)' }} />
                      </div>
                      <span className="text-xs font-semibold text-center leading-tight" style={{ color: selected ? 'var(--sail)' : 'var(--text-mid)' }}>
                        {c.CAT_NAME}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Priority — physical tiles */}
          <div className="glass-panel">
            <div className="glass-panel-header">
              <h3 className="glass-panel-title">Priority Level</h3>
              <span className="text-xs" style={{ color: 'var(--text-light)' }}>Select based on business impact</span>
            </div>
            <div className="p-5">
              {errors.priority_id && <p className="text-xs text-red-500 mb-3 font-semibold">{errors.priority_id}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {priorities.map(p => {
                  const selected = form.priority_id === String(p.PRIORITY_ID);
                  const meta = PRIORITY_META[p.PRIORITY_CODE] || PRIORITY_META.MEDIUM;
                  return (
                    <button
                      type="button" key={p.PRIORITY_ID}
                      onClick={() => setForm(f => ({ ...f, priority_id: String(p.PRIORITY_ID) }))}
                      className={`priority-tile ${selected ? 'selected' : ''} ${p.PRIORITY_CODE === 'CRITICAL' ? 'critical' : ''}`}
                      style={{ '--tile-color': meta.color, '--tile-glow': meta.glow }}>
                      <div className="relative z-[1]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold" style={{ color: meta.color }}>{p.PRIORITY_NAME}</span>
                          {selected && <CheckCircle size={14} style={{ color: meta.color }} />}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-light)' }}>{meta.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPriority && (
                <div className="mt-4 p-3.5 rounded-xl flex gap-6 text-xs glass-card"
                  style={{ background: 'rgba(247,246,243,0.7)' }}>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
                    <Clock size={13} /> Response: <strong>{selectedPriority.RESPONSE_HRS}h</strong>
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
                    <Target size={13} /> Resolution: <strong>{selectedPriority.RESOLVE_HRS}h</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="glass-panel">
            <div className="glass-panel-header">
              <h3 className="glass-panel-title">Attachments</h3>
              <span className="text-xs" style={{ color: 'var(--text-light)' }}>Max 5 files, 10MB each</span>
            </div>
            <div className="p-5">
              <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl cursor-pointer transition-colors"
                style={{ border: '2px dashed var(--border)', background: 'var(--off)' }}>
                <Upload size={22} className="mb-2" style={{ color: 'var(--text-light)' }} />
                <span className="text-sm" style={{ color: 'var(--text-mid)' }}>
                  Drop files here or <span className="font-semibold" style={{ color: 'var(--sail)' }}>browse</span>
                </span>
                <span className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>PDF, images, Word, Excel supported</span>
                <input type="file" className="hidden" multiple onChange={handleFileAdd}
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.txt" />
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: 'var(--off)', border: '1px solid var(--border-soft)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Upload size={14} style={{ color: 'var(--text-light)' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{f.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-light)' }}>{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="ml-2 text-red-400 hover:text-red-600">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline px-4 py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="btn-sail px-5 py-2.5 rounded-lg">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> : <><PlusCircle size={18} /> Submit Ticket</>}
            </button>
          </div>
        </form>

        {/* ── Live preview column ── */}
        <div className="preview-panel">
          <div className="preview-glow p-5 fade-up">
            <div className="relative z-[1]">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={15} style={{ color: 'var(--sail-gold)' }} />
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Live Preview</span>
              </div>

              <p className="text-white font-bold text-lg leading-snug mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {form.subject || 'Your ticket subject will appear here'}
              </p>

              <p className="text-white/55 text-sm leading-relaxed mb-4 line-clamp-4">
                {form.description || 'Describe your issue and a live summary will build itself here as you type.'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory && <span className="chip-float">{selectedCategory.CAT_NAME}</span>}
                {selectedPriority && (
                  <span className="chip-float" style={{ background: pMeta?.color }}>
                    {selectedPriority.PRIORITY_NAME}
                  </span>
                )}
                {selectedDept && <span className="chip-float">{selectedDept.DEPT_NAME}</span>}
                {form.tags && form.tags.split(',').map((t, i) => t.trim() && (
                  <span key={i} className="chip-float">#{t.trim()}</span>
                ))}
              </div>

              {selectedPriority && (
                <div className="grid grid-cols-2 gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide">Response by</p>
                    <p className="text-white text-sm font-bold">{selectedPriority.RESPONSE_HRS}h</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide">Resolve by</p>
                    <p className="text-white text-sm font-bold">{selectedPriority.RESOLVE_HRS}h</p>
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <p className="text-white/40 text-xs mt-4">{files.length} attachment{files.length > 1 ? 's' : ''} ready</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}