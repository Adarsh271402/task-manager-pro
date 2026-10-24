import { NavLink, useNavigate } from 'react-router-dom'
import { Kanban, LayoutDashboard, ListTodo, LogOut, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar, RoleBadge } from './ui'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/board', label: 'Board', icon: Kanban, end: false },
  { to: '/tasks', label: 'Tasks', icon: ListTodo, end: false }
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-night-900/95 lg:bg-night-900/60 border-r border-white/5
          flex flex-col backdrop-blur transition-transform duration-200 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
            <Kanban size={18} className="text-white" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Task Manager</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-400">Pro</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <n.icon size={17} />
              {n.label}
            </NavLink>
          ))}

          {user?.role === 'Admin' && (
            <NavLink to="/team" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Users size={17} />
              Team
            </NavLink>
          )}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user?.fullName ?? null} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <RoleBadge role={user?.role ?? 'Member'} />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-300 transition"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
