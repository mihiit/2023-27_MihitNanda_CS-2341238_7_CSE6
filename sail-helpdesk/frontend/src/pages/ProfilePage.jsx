// frontend/src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { User, Lock, Bell, Shield, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { Alert, RoleBadge } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('New passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile',   label: 'Profile',   icon: User },
    { id: 'security',  label: 'Security',  icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <AppLayout title="Profile & Settings" subtitle="Manage your account preferences">
      <div className="max-w-3xl mx-auto">

        {/* Profile header */}
        <div className="card mb-5">
          <div className="card-body flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-sail-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-panel">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold text-steel-800">{user?.full_name}</h2>
              <p className="text-steel-500 text-sm mb-2">{user?.designation} · {user?.dept_name}</p>
              <div className="flex items-center gap-3">
                <RoleBadge role={user?.role} />
                <span className="text-xs text-steel-400">ID: {user?.employee_id}</span>
                <span className="text-xs text-steel-400">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-steel-200 mb-5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-sail-500 text-sail-600'
                  : 'border-transparent text-steel-500 hover:text-steel-700'
              }`}>
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card">
            <div className="card-header"><h3 className="font-heading font-bold text-steel-700">Personal Information</h3></div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Employee ID',  value: user?.employee_id },
                  { label: 'Full Name',    value: user?.full_name },
                  { label: 'Email',        value: user?.email },
                  { label: 'Phone',        value: user?.phone || 'Not set' },
                  { label: 'Designation',  value: user?.designation || 'Not set' },
                  { label: 'Department',   value: user?.dept_name || 'Not assigned' },
                  { label: 'Role',         value: user?.role },
                ].map(field => (
                  <div key={field.label} className="p-3 bg-steel-50 rounded-lg">
                    <p className="text-xs text-steel-400 font-medium mb-0.5">{field.label}</p>
                    <p className="text-sm font-semibold text-steel-700">{field.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-steel-400 mt-4">
                To update your profile information, please contact your IT Administrator.
              </p>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-heading font-bold text-steel-700">Change Password</h3>
            </div>
            <div className="card-body">
              {pwError && <Alert type="error" className="mb-4">{pwError}</Alert>}
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                {[
                  { id: 'current', label: 'Current Password', key: 'current_password' },
                  { id: 'new',     label: 'New Password',     key: 'new_password' },
                  { id: 'confirm', label: 'Confirm New Password', key: 'confirm_password' },
                ].map(f => (
                  <div key={f.id} className="form-group mb-0">
                    <label className="form-label">{f.label}</label>
                    <div className="relative">
                      <input
                        type={showPw[f.id] ? 'text' : 'password'}
                        className="form-input pr-10"
                        value={pwForm[f.key]}
                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder="••••••••"
                      />
                      <button type="button"
                        onClick={() => setShowPw(s => ({ ...s, [f.id]: !s[f.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-600">
                        {showPw[f.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Password requirements */}
                <div className="p-3 bg-steel-50 rounded-lg">
                  <p className="text-xs font-semibold text-steel-600 mb-2">Password requirements:</p>
                  {['At least 8 characters', 'Mix of letters and numbers recommended', 'Avoid common passwords'].map(r => (
                    <p key={r} className="text-xs text-steel-500 flex items-center gap-1.5 mb-0.5">
                      <span className="text-green-500">✓</span> {r}
                    </p>
                  ))}
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : <><Save size={15} /> Update Password</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="card">
            <div className="card-header"><h3 className="font-heading font-bold text-steel-700">Notification Preferences</h3></div>
            <div className="card-body space-y-4">
              {[
                { label: 'Ticket Created',   sub: 'Email me when a new ticket is submitted',  enabled: true },
                { label: 'Status Updates',   sub: 'Email me when ticket status changes',       enabled: true },
                { label: 'New Replies',      sub: 'Email me when someone replies to my ticket',enabled: true },
                { label: 'Ticket Resolved',  sub: 'Email me when my ticket is resolved',       enabled: true },
                { label: 'SLA Warnings',     sub: 'Email me when ticket is approaching SLA',   enabled: false },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-steel-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-steel-700">{n.label}</p>
                    <p className="text-xs text-steel-400">{n.sub}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${n.enabled ? 'bg-sail-500' : 'bg-steel-200'} relative`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-steel-400">
                Email notifications are sent to: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
