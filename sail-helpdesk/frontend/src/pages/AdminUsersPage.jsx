// frontend/src/pages/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, RefreshCw, X, Users, Mail, Phone } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { RoleBadge, PageLoader, Pagination, Modal } from '../components/shared/UI';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLES = ['EMPLOYEE','ADMIN','AGENT','SUPERADMIN'];

function UserForm({ onSave, onClose, departments }) {
  const [form, setForm] = useState({ employee_id:'', full_name:'', email:'', password:'', role:'EMPLOYEE', dept_id:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.employee_id) e.employee_id = 'Required';
    if (!form.full_name || form.full_name.length < 2) e.full_name = 'Required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/admin/users', form);
      toast.success(`User ${form.employee_id} created successfully`);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="sail-label">Employee ID *</label>
          <input className={`sail-input ${errors.employee_id ? 'ring-2 ring-red-300 border-red-400' : ''}`}
            value={form.employee_id}
            onChange={e => setForm(f => ({ ...f, employee_id: e.target.value.toUpperCase() }))}
            placeholder="EMP001" />
          {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id}</p>}
        </div>
        <div>
          <label className="sail-label">Full Name *</label>
          <input className={`sail-input ${errors.full_name ? 'ring-2 ring-red-300 border-red-400' : ''}`}
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Rajesh Kumar" />
          {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
        </div>
      </div>
      <div>
        <label className="sail-label">Email *</label>
        <input type="email" className={`sail-input ${errors.email ? 'ring-2 ring-red-300 border-red-400' : ''}`}
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="employee@sail.in" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="sail-label">Password *</label>
        <input type="password" className={`sail-input ${errors.password ? 'ring-2 ring-red-300 border-red-400' : ''}`}
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="Min 8 characters" />
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="sail-label">Role *</label>
          <select className="sail-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="sail-label">Department</label>
          <select className="sail-input" value={form.dept_id} onChange={e => setForm(f => ({ ...f, dept_id: e.target.value }))}>
            <option value="">Select…</option>
            {departments.map(d => <option key={d.DEPT_ID} value={d.DEPT_ID}>{d.DEPT_NAME}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="sail-label">Phone</label>
        <input className="sail-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" disabled={loading} className="btn-sail px-4 py-2 rounded-lg">
          {loading ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', dept_id: '', page: 1 });
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/lookup/departments').then(r => setDepartments(r.data.data || []));
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data || []);
      setPagination(p => ({ ...p, ...res.data.pagination }));
    } catch { } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { is_active: isActive ? 0 : 1 });
      toast.success(isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const saveEditUser = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editUser.USER_ID}`, {
        full_name: editUser.FULL_NAME,
        email: editUser.EMAIL,
        role: editUser.ROLE,
        dept_id: editUser.DEPT_ID,
        phone: editUser.PHONE,
      });
      toast.success('User updated');
      setEditUser(null);
      fetchUsers();
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  return (
    <AppLayout title="User Management" subtitle={`${pagination.total} users registered`}>

      {/* Toolbar */}
      <div className="glass-panel mb-4">
        <div className="p-3.5 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }} />
            <input
              type="text" placeholder="Search by name, ID, or email…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="sail-input pl-9"
              style={{ background: 'rgba(255,255,255,0.7)' }}
            />
            {filters.search && (
              <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-red-500" style={{ color: 'var(--text-light)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}
            className="sail-input py-2 text-sm w-36" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.dept_id} onChange={e => setFilters(f => ({ ...f, dept_id: e.target.value, page: 1 }))}
            className="sail-input py-2 text-sm w-44" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.DEPT_ID} value={d.DEPT_ID}>{d.DEPT_NAME}</option>)}
          </select>
          <button onClick={fetchUsers} className="btn-outline p-2.5 rounded-lg" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-sail px-4 py-2 rounded-lg text-sm">
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel">
        {loading ? <PageLoader /> : users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-mid)' }}>No users found</p>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Try adjusting your search filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="sail-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Contact</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Tickets</th>
                    <th>Last Login</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.USER_ID}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--sail)', boxShadow: '0 4px 10px -2px rgba(27,42,107,0.5)' }}>
                            {u.FULL_NAME?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{u.FULL_NAME}</p>
                            <p className="text-xs font-mono" style={{ color: 'var(--text-light)' }}>{u.EMP_ID}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs">
                        <p className="flex items-center gap-1.5 mb-0.5" style={{ color: 'var(--text-mid)' }}>
                          <Mail size={11} style={{ color: 'var(--text-light)' }} /> {u.EMAIL}
                        </p>
                        {u.PHONE && (
                          <p className="flex items-center gap-1.5" style={{ color: 'var(--text-light)' }}>
                            <Phone size={11} /> {u.PHONE}
                          </p>
                        )}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-mid)' }}>{u.DEPT_NAME || '—'}</td>
                      <td><RoleBadge role={u.ROLE} /></td>
                      <td>
                        <span className="badge" style={u.IS_ACTIVE
                          ? { background: 'rgba(21,128,61,0.1)', color: '#15803D' }
                          : { background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                          {u.IS_ACTIVE ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-xs text-center font-bold" style={{ color: 'var(--sail)' }}>{u.TICKET_COUNT}</td>
                      <td className="text-xs" style={{ color: 'var(--text-light)' }}>
                        {u.LAST_LOGIN ? format(new Date(u.LAST_LOGIN), 'MMM d, yyyy') : 'Never'}
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <button onClick={() => setEditUser({ ...u })}
                            className="btn-outline text-xs px-2.5 py-1 rounded-lg">Edit</button>
                          <button
                            onClick={() => toggleActive(u.USER_ID, u.IS_ACTIVE)}
                            className="text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all"
                            style={u.IS_ACTIVE
                              ? { borderColor: 'rgba(192,57,43,0.3)', color: '#C0392B' }
                              : { borderColor: 'rgba(21,128,61,0.3)', color: '#15803D' }}>
                            {u.IS_ACTIVE ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
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

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New User" size="lg">
        <UserForm departments={departments} onSave={() => { setShowCreate(false); fetchUsers(); }} onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="md">
        {editUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="sail-label">Full Name</label>
                <input className="sail-input" value={editUser.FULL_NAME || ''} onChange={e => setEditUser(u => ({ ...u, FULL_NAME: e.target.value }))} />
              </div>
              <div>
                <label className="sail-label">Email</label>
                <input type="email" className="sail-input" value={editUser.EMAIL || ''} onChange={e => setEditUser(u => ({ ...u, EMAIL: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="sail-label">Role</label>
                <select className="sail-input" value={editUser.ROLE} onChange={e => setEditUser(u => ({ ...u, ROLE: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="sail-label">Department</label>
                <select className="sail-input" value={editUser.DEPT_ID || ''} onChange={e => setEditUser(u => ({ ...u, DEPT_ID: e.target.value }))}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.DEPT_ID} value={d.DEPT_ID}>{d.DEPT_NAME}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="sail-label">Phone</label>
              <input className="sail-input" value={editUser.PHONE || ''} onChange={e => setEditUser(u => ({ ...u, PHONE: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditUser(null)} className="btn-outline px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={saveEditUser} disabled={saving} className="btn-sail px-4 py-2 rounded-lg">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}