import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Lock, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────
   Logo Splash Animation
───────────────────────────────────────── */
function LogoSplash({ onDone }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 900);
    const t2 = setTimeout(() => setPhase('exit'), 2000);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={`sail-splash ${phase}`}>
      <div className="sail-splash-bg" />
      <div className={`splash-ring ${phase}`} />
      <div className={`splash-content ${phase}`}>
        <img src="/sail-logo.png" alt="SAIL" className="splash-logo" />
        <div className="splash-divider" />
        <p className="splash-title">सेल SAIL</p>
        <p className="splash-sub">Steel Authority of India Limited</p>
        <p className="splash-portal">IT Helpdesk Portal</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Login Page
───────────────────────────────────────── */
export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ employee_id: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [splashDone, setSplashDone] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);

  const [showSplash] = useState(() => !sessionStorage.getItem('sail_splash_seen'));

  useEffect(() => {
    if (!showSplash) setSplashDone(true);
  }, [showSplash]);

  useEffect(() => {
    if (splashDone) setTimeout(() => setLoginVisible(true), 80);
  }, [splashDone]);

  useEffect(() => {
    if (user) {
      if (user.role === 'EMPLOYEE') navigate('/dashboard', { replace: true });
      else navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSplashDone = () => {
    sessionStorage.setItem('sail_splash_seen', '1');
    setSplashDone(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.employee_id.trim() || !form.password) {
      setError('Please enter your Employee ID and password.');
      return;
    }
    const result = await login(form.employee_id.trim(), form.password);
    if (result.success) {
      if (result.user.role === 'EMPLOYEE') navigate('/dashboard', { replace: true });
      else navigate('/admin/dashboard', { replace: true });
    } else {
      setError(result.message || 'Login failed. Please try again.');
    }
  };

  const fillDemo = (id, pw) => setForm({ employee_id: id, password: pw });

  return (
    <>
      {!splashDone && showSplash && <LogoSplash onDone={handleSplashDone} />}

      <div className={`login-root ${loginVisible ? 'login-visible' : ''}`}>

        {/* Full-screen building background */}
        <div className="login-bg">
          <img src="/sail-building.jpg" alt="" className="login-bg-img" aria-hidden="true" />
          <div className="login-bg-overlay" />
          <div className="login-bg-grid" />
        </div>

        {/* Centered card */}
        <div className="login-center">
          <div className="login-card">

            {/* Card top: logo + title */}
            <div className="login-card-header">
              <div className="login-card-logo-wrap">
                <img src="/sail-logo.png" alt="SAIL" className="login-card-logo" />
              </div>
              <h1 className="login-card-title">IT Helpdesk Portal</h1>
              <p className="login-card-desc">Sign in with your SAIL employee credentials</p>
            </div>

            {/* Gold accent bar */}
            <div className="login-accent-line" />

            <div className="login-card-body">

              {error && (
                <div className="login-error">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label className="login-label">Employee ID</label>
                  <div className="login-input-wrap">
                    <User size={14} className="login-input-icon" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="e.g. EMP001"
                      value={form.employee_id}
                      onChange={e => setForm(f => ({ ...f, employee_id: e.target.value.toUpperCase() }))}
                      className="login-input"
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <div className="login-label-row">
                    <label className="login-label">Password</label>
                    <button type="button" className="login-forgot">Forgot password?</button>
                  </div>
                  <div className="login-input-wrap">
                    <Lock size={14} className="login-input-icon" aria-hidden="true" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="login-input login-input-pr"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="login-eye"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="login-submit">
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                    : <><Shield size={15} /> Sign In to Portal</>
                  }
                </button>
              </form>

              <div className="login-demo">
                <p className="login-demo-title">Demo Credentials</p>
                <div className="login-demo-list">
                  {[
                    { role: 'Employee',    id: 'EMP004', pw: 'SAIL@2024' },
                    { role: 'Admin',       id: 'EMP002', pw: 'SAIL@2024' },
                    { role: 'Super Admin', id: 'EMP001', pw: 'SAIL@2024' },
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => fillDemo(d.id, d.pw)}
                      className="login-demo-row"
                    >
                      <span className="login-demo-role">{d.role}</span>
                      <span className="login-demo-cred">{d.id} / {d.pw}</span>
                    </button>
                  ))}
                </div>
                <p className="login-demo-hint">↑ Click any row to auto-fill</p>
              </div>
            </div>

            <div className="login-card-footer">
              <Shield size={11} />
              <span>Secure · helpdesk@sail.in · © {new Date().getFullYear()} SAIL</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
