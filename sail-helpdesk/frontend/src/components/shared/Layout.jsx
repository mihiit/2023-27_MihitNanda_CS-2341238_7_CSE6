import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, PlusCircle, Users, BarChart3,
  LogOut, Bell, Menu, X, ChevronRight, Settings, Home, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ── Nav groups by role ── */
const ADMIN_NAV = [
  { group: 'Admin Panel', items: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/admin/dashboard' },
    { icon: Ticket,          label: 'All Tickets',  path: '/admin/tickets'   },
    { icon: Users,           label: 'Users',        path: '/admin/users'     },
    { icon: BarChart3,       label: 'Reports',      path: '/admin/reports'   },
  ]},
  { group: 'My Portal', items: [
    { icon: Home,       label: 'My Dashboard', path: '/dashboard'   },
    { icon: Ticket,     label: 'My Tickets',   path: '/tickets'     },
    { icon: PlusCircle, label: 'New Ticket',   path: '/tickets/new' },
    { icon: Bell,       label: 'Notifications',path: '/notifications'},
  ]},
];

const EMPLOYEE_NAV = [
  { group: 'My Portal', items: [
    { icon: Home,       label: 'Dashboard',    path: '/dashboard'    },
    { icon: Ticket,     label: 'My Tickets',   path: '/tickets'      },
    { icon: PlusCircle, label: 'New Ticket',   path: '/tickets/new'  },
    { icon: Bell,       label: 'Notifications',path: '/notifications' },
  ]},
];

function NavGroup({ group, items, location, onClose }) {
  return (
    <div className="mb-2">
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
        {group}
      </p>
      {items.map(item => {
        const active = location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));
        return (
          <Link key={item.path} to={item.path} onClick={onClose}
            className={`nav-link mx-2 mb-0.5 ${active ? 'active' : ''}`}>
            <item.icon size={16} className="flex-shrink-0" />
            <span>{item.label}</span>
            {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navGroups = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col steel-mesh
        lg:static lg:z-auto lg:translate-x-0
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'linear-gradient(180deg, #1B2A6B 0%, #16215A 100%)' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0 shadow-sm">
              <img src="/sail-logo.png" alt="SAIL" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>सेल SAIL</p>
              <p className="text-white/40 text-[10px] leading-tight tracking-wide">IT HELPDESK</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* User chip */}
        <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-lg border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="text-white text-sm font-semibold leading-tight truncate">{user?.full_name}</p>
          <p className="text-white/40 text-xs truncate">{user?.employee_id} · {user?.role}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navGroups.map(g => (
            <NavGroup key={g.group} group={g.group} items={g.items} location={location} onClose={onClose} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 py-2 px-2">
          <Link to="/profile" onClick={onClose} className="nav-link">
            <Settings size={16} /> <span>Profile & Settings</span>
          </Link>
          <button onClick={handleLogout}
            className="nav-link w-full text-left text-red-300 hover:text-red-200 hover:bg-red-900/20">
            <LogOut size={16} /> <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function AvatarMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 group flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer ring-2 ring-transparent group-hover:ring-[--sail-gold] transition-all"
          style={{ background: 'var(--sail)' }}>
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <ChevronDown size={14} className="text-[--text-light] group-hover:text-[--sail] transition-colors hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white rounded-xl border z-50 overflow-hidden fade-up"
          style={{ borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-3)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.full_name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-light)' }}>{user?.email}</p>
          </div>
          <button onClick={() => { setOpen(false); navigate('/profile'); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[--off] text-left transition-colors"
            style={{ color: 'var(--text-mid)' }}>
            <Settings size={15} /> Profile & Settings
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 text-left transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenuOpen, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="bg-white steel-mesh px-4 lg:px-6 h-14 flex items-center gap-4 sticky top-0 z-20"
      style={{ borderBottom: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-1)' }}>
      <button onClick={onMenuOpen} className="lg:hidden p-1.5 rounded-lg border flex-shrink-0"
        style={{ borderColor: 'var(--border)', color: 'var(--text-mid)' }}>
        <Menu size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold truncate leading-tight" style={{ color: 'var(--sail)', fontFamily: "'Playfair Display', serif" }}>{title}</h1>
        {subtitle && <p className="text-xs truncate" style={{ color: 'var(--text-light)' }}>{subtitle}</p>}
      </div>
      <Link to="/tickets/new"
        className="btn-sail btn-sm hidden sm:inline-flex text-xs px-3 py-1.5 rounded-lg">
        <PlusCircle size={13} /> New Ticket
      </Link>
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg hover:bg-[--off] transition-colors flex-shrink-0"
        style={{ color: 'var(--text-mid)' }}
        aria-label="Notifications">
        <Bell size={18} />
      </button>
      <AvatarMenu user={user} onLogout={handleLogout} />
    </header>
  );
}

export function AppLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--off)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 fade-up glass-backdrop">
          {children}
        </main>
      </div>
    </div>
  );
}