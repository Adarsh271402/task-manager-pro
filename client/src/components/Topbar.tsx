import { Menu, Radio, RadioTower } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { ConnState } from '../context/DataContext'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/board': 'Task Board',
  '/tasks': 'All Tasks',
  '/team': 'Team Management'
}

function connBadge(conn: ConnState) {
  switch (conn) {
    case 'live':
      return { cls: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10', label: 'Live', dot: 'bg-emerald-400' }
    case 'reconnecting':
      return { cls: 'text-amber-300 border-amber-500/30 bg-amber-500/10', label: 'Reconnecting…', dot: 'bg-amber-400 animate-pulse' }
    case 'connecting':
      return { cls: 'text-slate-300 border-white/10 bg-white/5', label: 'Connecting…', dot: 'bg-slate-400 animate-pulse' }
    default:
      return { cls: 'text-red-300 border-red-500/30 bg-red-500/10', label: 'Offline', dot: 'bg-red-400' }
  }
}

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { conn } = useData()
  const badge = connBadge(conn)
  const title = titles[window.location.pathname] ?? 'Task Manager Pro'

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-white/5 bg-night-950/80 backdrop-blur flex items-center gap-4 px-4 sm:px-6">
      <button onClick={onMenu} className="lg:hidden text-slate-400 hover:text-white">
        <Menu size={20} />
      </button>
      <h1 className="text-base sm:text-lg font-bold text-white truncate">{title}</h1>
      <span
        className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}
        title="Real-time connection status (SignalR)"
      >
        {conn === 'live' ? <RadioTower size={12} /> : <Radio size={12} />}
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        {badge.label}
      </span>
    </header>
  )
}
