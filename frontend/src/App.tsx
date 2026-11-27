import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth';
import { Loading } from './components/UI';
import Shell from './components/Shell';
import { Login, Register } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { TasksPage, SubjectsPage, CalendarPage } from './pages/Manage';
import { SubmissionsPage, NotificationsPage, ReportsPage, SettingsPage } from './pages/More';
function Guard({ children }: { children: ReactNode }) { const { user, loading } = useAuth(); const loc = useLocation(); if (loading) return <div className="full-loading"><Loading/></div>; if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace/>; return children; }
function Guest({ children }: { children: ReactNode }) { const { user, loading } = useAuth(); if (loading) return <div className="full-loading"><Loading/></div>; return user ? <Navigate to="/dashboard" replace/> : children; }
export default function App() { return <Routes>
  <Route path="/login" element={<Guest><Login/></Guest>}/><Route path="/register" element={<Guest><Register/></Guest>}/>
  <Route element={<Guard><Shell/></Guard>}>
    <Route path="/dashboard" element={<DashboardPage/>}/><Route path="/tasks" element={<TasksPage/>}/><Route path="/subjects" element={<SubjectsPage/>}/><Route path="/calendar" element={<CalendarPage/>}/><Route path="/submissions" element={<SubmissionsPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/><Route path="/reports" element={<ReportsPage/>}/><Route path="/settings" element={<SettingsPage/>}/>
  </Route>
  <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
</Routes>; }
