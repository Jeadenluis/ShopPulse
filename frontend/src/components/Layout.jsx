import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Bell, ClipboardList, LayoutDashboard, LogOut, Menu, RefreshCw, Search, ShoppingCart, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useApi } from '../services/useApi';
import { api } from '../services/api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/followups', label: 'Follow-ups', icon: ClipboardList },
];

export default function Layout() {
  const { user, logout, health, woo, syncing, syncNow } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { data: followups } = useApi(() => api.followups({ status: 'open' }), []);
  const openCount = followups?.length || 0;
  const demo = health?.database === 'memory';

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><Activity size={22} /><span>ShopPulse</span></div>
        <nav>{NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><n.icon size={18} />{n.label}</NavLink>)}</nav>
        <div className="sidebar-foot">
          <div className="user"><div className="avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div>
          <button className="nav-link" onClick={logout}><LogOut size={18} />Log out</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <form className="search" onSubmit={(e) => { e.preventDefault(); navigate(`/customers?q=${encodeURIComponent(q)}`); }}>
            <Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers by name or email…" aria-label="Search customers" />
          </form>
          <div className="topbar-right">
            {health && <span className={`pill ${demo ? 'pill-amber' : 'pill-green'}`} title={demo ? health.demoReason : 'Connected to MySQL'}>{health.status === 'down' ? 'Backend offline' : demo ? 'Demo mode · in-memory' : 'MySQL connected'}</span>}
            <button className="btn btn-sm" onClick={syncNow} disabled={syncing} title={woo?.configured ? `Sync from ${woo.storeHost}` : 'WooCommerce is not configured'}>
              <RefreshCw size={15} className={syncing ? 'spin' : ''} />{syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            <button className="icon-btn bell" onClick={() => navigate('/followups')} aria-label={`${openCount} follow-ups need attention`}><Bell size={19} />{openCount > 0 && <span className="dot">{openCount}</span>}</button>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
