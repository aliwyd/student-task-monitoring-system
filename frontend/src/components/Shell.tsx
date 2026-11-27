import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CalendarDays, ChartNoAxesCombined, ChevronLeft, ClipboardCheck, LayoutDashboard, ListTodo, LogOut, Menu, Moon, Settings2, Sparkles, Sun, X } from 'lucide-react';
import { useAuth } from '../auth';
import { api } from '../api';
import { initials } from '../utils';
const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/tasks', label: 'My tasks', icon: ListTodo },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/submissions', label: 'Submissions', icon: ClipboardCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];
export default function Shell() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false); const [unread, setUnread] = useState(0);
  const [dark, setDark] = useState(() => localStorage.getItem('stms-theme') === 'dark');
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('stms-theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { setMobileOpen(false); api<{ unreadCount: number }>('/notifications').then(r => setUnread(r.unreadCount)).catch(() => {}); }, [location.pathname]);
  const exit = async () => { try { await logout(); } finally { nav('/login', { replace: true }); } };
  return <div className="app-shell">
    {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark"><Sparkles size={22}/></div><div className="brand-type"><strong>taskwell<span>.</span></strong><small>STUDENT WORKSPACE</small></div><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X/></button></div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav aria-label="Main navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.9}/><span>{label}</span>{to === '/notifications' && unread > 0 && <span className="nav-count">{unread}</span>}</NavLink>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-footer"><div className="focus-note"><div className="focus-icon"><Sparkles size={17}/></div><strong>Small steps, big wins.</strong><p>Every completed task is progress worth celebrating.</p></div><button className="nav-item nav-action" onClick={() => setDark(d => !d)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}<span>{dark ? 'Light appearance' : 'Dark appearance'}</span></button><button className="nav-item nav-action" onClick={exit}><LogOut size={19}/><span>Sign out</span></button><div className="sidebar-profile"><div className="avatar">{initials(user?.name ?? 'Student')}</div><div className="profile-text"><strong>{user?.name}</strong><small>{user?.email}</small></div><ChevronLeft size={16}/></div></div>
    </aside>
    <div className="main-area"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{links.find(l => location.pathname.startsWith(l.to))?.label ?? 'Overview'}</strong></div><div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="icon-button theme-top" aria-label="Toggle dark mode" onClick={() => setDark(d => !d)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="bell-button" aria-label="Open notifications" onClick={() => nav('/notifications')}><Bell size={19}/>{unread > 0 && <span className="bell-dot"/>}</button><div className="avatar avatar-small">{initials(user?.name ?? 'Student')}</div></div></header><main className="content"><Outlet/></main><footer className="main-footer">Made for progress · Taskwell Student Workspace</footer></div>
  </div>;
}
