import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, PlusCircle, Users, BarChart3,
  LogOut, Bell, Menu, X, ChevronRight, Settings, Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ── SAIL logo inline SVG (matches uploaded PNG exactly) ── */
function SailLogoMark({ size = 36, dark = false }) {
  const c = dark ? '#1B2A6B' : 'white';
  const bg = dark ? 'white' : '#1B2A6B';
  return (
    <img
      src="/sail-logo.png"
      alt="SAIL"
      style={{ width: size, height: size, objectFit: 'contain',
        filter: dark ? 'none' : 'brightness(0) invert(1)' }}
    />
  );
}

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
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col
        lg:static lg:z-auto lg:translate-x-0
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: '#1B2A6B' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
              <img src="/sail-logo.png" alt="SAIL" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">सेल SAIL</p>
              <p className="text-white/40 text-[10px] leading-tight">IT Helpdesk</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* User chip */}
        <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-lg border border-white/10"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
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

export function Topbar({ onMenuOpen, title, subtitle }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-[#DDE3F0] px-4 lg:px-6 h-14 flex items-center gap-4 sticky top-0 z-20"
      style={{ boxShadow: '0 1px 4px rgba(27,42,107,.06)' }}>
      <button onClick={onMenuOpen} className="lg:hidden p-1.5 rounded-lg border border-[#DDE3F0] text-[#4A5068]">
        <Menu size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-[#1B2A6B] font-heading truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#8890B5] truncate">{subtitle}</p>}
      </div>
      <Link to="/tickets/new"
        className="btn-sail btn-sm hidden sm:inline-flex text-xs px-3 py-1.5 rounded-lg">
        <PlusCircle size={13} /> New Ticket
      </Link>
      <div
        onClick={() => navigate('/profile')}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0"
        style={{ background: '#1B2A6B' }}>
        {user?.full_name?.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}

export function AppLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F7FF' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
