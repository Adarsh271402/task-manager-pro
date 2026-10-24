import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { initials, priorityClasses, type Priority } from '../types'

const avatarPalette = [
  'bg-violet-500/25 text-violet-200 border-violet-400/30',
  'bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400/30',
  'bg-sky-500/25 text-sky-200 border-sky-400/30',
  'bg-emerald-500/25 text-emerald-200 border-emerald-400/30',
  'bg-amber-500/25 text-amber-200 border-amber-400/30',
  'bg-rose-500/25 text-rose-200 border-rose-400/30'
]

export function Avatar({ name, size = 'md' }: { name: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls =
    size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs'
  if (!name)
    return (
      <span
        className={`${cls} inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500 font-bold`}
        title="Unassigned"
      >
        ?
      </span>
    )
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length
  return (
    <span
      title={name}
      className={`${cls} ${avatarPalette[idx]} inline-flex items-center justify-center rounded-full border font-bold select-none`}
    >
      {initials(name)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityClasses(priority)}`}>
      {priority}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'Admin'
      ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
      : role === 'Manager'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{role}</span>
}

export function StatCard({
  icon,
  label,
  value,
  tone,
  sub
}: {
  icon: ReactNode
  label: string
  value: string | number
  tone: string
  sub?: string
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="animate-spin" size={20} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span className="text-slate-600">{icon}</span>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {hint && <p className="text-xs text-slate-600 max-w-xs">{hint}</p>}
    </div>
  )
}
