// frontend/src/pages/CreateTicketPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Upload, X, AlertCircle, CheckCircle, Loader2, Tag } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { Alert } from '../components/shared/UI';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
      // Default priority = Medium
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

      const res = await api.post('/tickets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Ticket ${res.data.data.ticket_ref} created successfully!`);
      navigate(`/tickets/${res.data.data.ticket_id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create ticket';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = { CRITICAL: 'border-red-400 bg-red-50', HIGH: 'border-orange-400 bg-orange-50', MEDIUM: 'border-yellow-400 bg-yellow-50', LOW: 'border-green-400 bg-green-50' };

  return (
    <AppLayout title="Create New Ticket" subtitle="Submit a new IT support request">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Ticket Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-heading font-bold text-steel-700">Ticket Details</h3>
            </div>
            <div className="card-body space-y-4">

              {/* Subject */}
              <div className="form-group mb-0">
                <label className="form-label">Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Brief description of your issue (e.g., 'SAP login error on workstation WS-FIN-012')"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className={`form-input ${errors.subject ? 'border-red-400 focus:ring-red-400' : ''}`}
                  maxLength={300}
                />
                <div className="flex justify-between mt-1">
                  {errors.subject ? <p className="form-error">{errors.subject}</p> : <span />}
                  <span className="text-xs text-steel-400">{form.subject.length}/300</span>
                </div>
              </div>

              {/* Description */}
              <div className="form-group mb-0">
                <label className="form-label">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={6}
                  placeholder="Please describe the issue in detail:&#10;• What were you trying to do?&#10;• What error message did you see?&#10;• When did it start?&#10;• Have you tried any solutions?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`form-input resize-none ${errors.description ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              {/* Category + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Category <span className="text-red-500">*</span></label>
                  <select
                    value={form.cat_id}
                    onChange={e => setForm(f => ({ ...f, cat_id: e.target.value }))}
                    className={`form-input ${errors.cat_id ? 'border-red-400' : ''}`}>
                    <option value="">Select category…</option>
                    {categories.map(c => (
                      <option key={c.CAT_ID} value={c.CAT_ID}>{c.CAT_NAME}</option>
                    ))}
                  </select>
                  {errors.cat_id && <p className="form-error">{errors.cat_id}</p>}
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Department</label>
                  <select
                    value={form.dept_id}
                    onChange={e => setForm(f => ({ ...f, dept_id: e.target.value }))}
                    className="form-input">
                    <option value="">My Department (default)</option>
                    {departments.map(d => (
                      <option key={d.DEPT_ID} value={d.DEPT_ID}>{d.DEPT_NAME}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="form-group mb-0">
                <label className="form-label flex items-center gap-1.5">
                  <Tag size={13} /> Tags <span className="text-steel-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAP, email, VPN (comma separated)"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-heading font-bold text-steel-700">Priority Level</h3>
              <span className="text-xs text-steel-400">Select based on business impact</span>
            </div>
            <div className="card-body">
              {errors.priority_id && <p className="form-error mb-3">{errors.priority_id}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {priorities.map(p => {
                  const selected = form.priority_id === String(p.PRIORITY_ID);
                  const colorMap = { CRITICAL: 'border-red-400 bg-red-50 ring-red-300', HIGH: 'border-orange-400 bg-orange-50 ring-orange-300', MEDIUM: 'border-yellow-400 bg-yellow-50 ring-yellow-300', LOW: 'border-green-400 bg-green-50 ring-green-300' };
                  const descMap = { CRITICAL: 'System down / Security breach', HIGH: 'Major function impacted', MEDIUM: 'Workaround available', LOW: 'Minor issue / Request' };
                  return (
                    <button
                      type="button"
                      key={p.PRIORITY_ID}
                      onClick={() => setForm(f => ({ ...f, priority_id: String(p.PRIORITY_ID) }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? `${colorMap[p.PRIORITY_CODE]} ring-2`
                          : 'border-steel-200 bg-white hover:border-steel-300'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold" style={{ color: p.COLOR_HEX }}>{p.PRIORITY_NAME}</span>
                        {selected && <CheckCircle size={14} className="text-green-600" />}
                      </div>
                      <p className="text-xs text-steel-500">{descMap[p.PRIORITY_CODE]}</p>
                    </button>
                  );
                })}
              </div>

              {/* SLA info */}
              {form.priority_id && (() => {
                const p = priorities.find(pr => String(pr.PRIORITY_ID) === form.priority_id);
                return p ? (
                  <div className="mt-3 p-3 bg-steel-50 rounded-lg flex gap-6 text-xs text-steel-600">
                    <span>⏱ Response: <strong>{p.RESPONSE_HRS}h</strong></span>
                    <span>🎯 Resolution: <strong>{p.RESOLVE_HRS}h</strong></span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-heading font-bold text-steel-700">Attachments</h3>
              <span className="text-xs text-steel-400">Max 5 files, 10MB each</span>
            </div>
            <div className="card-body">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-steel-200 rounded-xl cursor-pointer bg-steel-50 hover:bg-sail-50 hover:border-sail-300 transition-colors">
                <Upload size={22} className="text-steel-400 mb-2" />
                <span className="text-sm text-steel-500">Drop files here or <span className="text-sail-500 font-semibold">browse</span></span>
                <span className="text-xs text-steel-400 mt-1">PDF, images, Word, Excel supported</span>
                <input type="file" className="hidden" multiple onChange={handleFileAdd} accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.txt" />
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-steel-50 rounded-lg border border-steel-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">📎</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-steel-700 truncate">{f.name}</p>
                          <p className="text-xs text-steel-400">{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="text-steel-400 hover:text-red-500 ml-2">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary btn-lg">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> : <><PlusCircle size={18} /> Submit Ticket</>}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
