// frontend/src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { User, Lock, Bell, Save, Loader2, Eye, EyeOff, Mail, Phone, Briefcase, Building2, Contact } from 'lucide-react';
import { AppLayout } from '../components/shared/Layout';
import { RoleBadge } from '../components/shared/UI';
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
  const [notifPrefs, setNotifPrefs] = useState([
    { key: 'created',  label: 'Ticket Created',  sub: 'Email me when a new ticket is submitted',   enabled: true },
    { key: 'status',   label: 'Status Updates',  sub: 'Email me when ticket status changes',        enabled: true },
    { key: 'replies',  label: 'New Replies',     sub: 'Email me when someone replies to my ticket', enabled: true },
    { key: 'resolved', label: 'Ticket Resolved', sub: 'Email me when my ticket is resolved',         enabled: true },
    { key: 'sla',      label: 'SLA Warnings',    sub: 'Email me when ticket is approaching SLA',     enabled: false },
  ]);

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
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const pwStrength = (() => {
    const p = pwForm.new_password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthMeta = [
    { label: '', color: 'var(--border)' },
    { label: 'Weak', color: '#C0392B' },
    { label: 'Fair', color: '#D97706' },
    { label: 'Good', color: '#B7950B' },
    { label: 'Strong', color: '#15803D' },
  ][pwStrength];

  return (
    <AppLayout title="Profile & Settings" subtitle="Manage your account preferences">
      <div className="max-w-3xl mx-auto">

        {/* Profile header — glass banner */}
        <div className="mb-5 rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden steel-mesh"
          style={{ background: 'linear-gradient(120deg, #1B2A6B 0%, #233a8a 60%, #16215A 100%)', boxShadow: 'var(--shadow-3)' }}>
          <div className="relative z-[1] w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)' }}>
            {user?.full_name?.charAt(0)}
          </div>
          <div className="relative z-[1] flex-1 min-w-0">
            <h2 className="font-bold text-xl text-white mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>{user?.full_name}</h2>
            <p className="text-white/55 text-sm mb-2.5">{user?.designation || 'Employee'} · {user?.dept_name || 'SAIL'}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <RoleBadge role={user?.role} />
              <span className="chip-float">ID: {user?.employee_id}</span>
              <span className="chip-float">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border-soft)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
              style={tab === t.id
                ? { background: 'var(--sail)', color: '#fff', boxShadow: '0 4px 10px -2px rgba(27,42,107,0.4)' }
                : { color: 'var(--text-mid)' }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="glass-panel fade-up">
            <div className="glass-panel-header"><h3 className="glass-panel-title">Personal Information</h3></div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Employee ID', value: user?.employee_id, icon: Contact },
                  { label: 'Full Name',   value: user?.full_name,   icon: User },
                  { label: 'Email',       value: user?.email,       icon: Mail },
                  { label: 'Phone',       value: user?.phone || 'Not set', icon: Phone },
                  { label: 'Designation', value: user?.designation || 'Not set', icon: Briefcase },
                  { label: 'Department',  value: user?.dept_name || 'Not assigned', icon: Building2 },
                ].map(field => (
                  <div key={field.label} className="glass-card p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--off)' }}>
                      <field.icon size={15} style={{ color: 'var(--sail)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-light)' }}>{field.label}</p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: 'var(--text-light)' }}>
                To update your profile information, please contact your IT Administrator.
              </p>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="glass-panel fade-up">
            <div className="glass-panel-header"><h3 className="glass-panel-title">Change Password</h3></div>
            <div className="p-5">
              {pwError && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}>
                  {pwError}
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                {[
                  { id: 'current', label: 'Current Password', key: 'current_password' },
                  { id: 'new',     label: 'New Password',     key: 'new_password' },
                  { id: 'confirm', label: 'Confirm New Password', key: 'confirm_password' },
                ].map(f => (
                  <div key={f.id}>
                    <label className="sail-label">{f.label}</label>
                    <div className="relative">
                      <input
                        type={showPw[f.id] ? 'text' : 'password'}
                        className="sail-input pr-10"
                        value={pwForm[f.key]}
                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder="••••••••"
                      />
                      <button type="button"
                        onClick={() => setShowPw(s => ({ ...s, [f.id]: !s[f.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-[--sail]" style={{ color: 'var(--text-light)' }}>
                        {showPw[f.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {f.id === 'new' && pwForm.new_password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="flex-1 h-1.5 rounded-full transition-colors duration-300"
                              style={{ background: i <= pwStrength ? strengthMeta.color : 'var(--border-soft)' }} />
                          ))}
                        </div>
                        <p className="text-xs font-medium" style={{ color: strengthMeta.color }}>{strengthMeta.label}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="p-3.5 rounded-lg" style={{ background: 'var(--off)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-mid)' }}>Password requirements:</p>
                  {['At least 8 characters', 'Mix of letters and numbers recommended', 'Avoid common passwords'].map(r => (
                    <p key={r} className="text-xs flex items-center gap-1.5 mb-0.5" style={{ color: 'var(--text-light)' }}>
                      <span style={{ color: '#15803D' }}>✓</span> {r}
                    </p>
                  ))}
                </div>

                <button type="submit" disabled={saving} className="btn-sail w-full justify-center py-2.5 rounded-lg">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : <><Save size={15} /> Update Password</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="glass-panel fade-up">
            <div className="glass-panel-header"><h3 className="glass-panel-title">Notification Preferences</h3></div>
            <div className="p-5">
              <div className="space-y-1">
                {notifPrefs.map((n, i) => (
                  <div key={n.key} className="flex items-center justify-between py-3"
                    style={i < notifPrefs.length - 1 ? { borderBottom: '1px solid var(--border-soft)' } : {}}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{n.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{n.sub}</p>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(prefs => prefs.map(p => p.key === n.key ? { ...p, enabled: !p.enabled } : p))}
                      className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                      style={{ background: n.enabled ? 'var(--sail)' : 'var(--border)' }}>
                      <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform duration-200"
                        style={{ transform: n.enabled ? 'translateX(22px)' : 'translateX(2px)', boxShadow: 'var(--shadow-1)' }} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: 'var(--text-light)' }}>
                Email notifications are sent to: <strong style={{ color: 'var(--text-mid)' }}>{user?.email}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}