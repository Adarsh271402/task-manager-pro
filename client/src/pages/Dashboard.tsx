import { Navigate } from 'react-router-dom'
import { AlarmClock, CheckCircle2, Kanban, ListTodo, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, PriorityBadge, Spinner, StatCard } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const { stats, tasks, loading, conn } = useData()

  if (loading) return <Spinner label="Loading workspace…" />
  if (!user) return <Navigate to="/login" replace />

  const myOpen = tasks.filter((t) => t.assigneeId === user.id).length
  const s = stats

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* greeting */}
      <div className="card p-6 bg-gradient-to-r from-brand-600/20 via-night-850 to-night-850 border-brand-500/20">
        <p className="text-sm text-brand-300 font-medium">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="text-2xl font-bold text-white mt-1">Hey {user.fullName.split(' ')[0]} 👋</h2>
        <p className="text-sm text-slate-400 mt-1">
          {myOpen > 0
            ? `You have ${myOpen} open task${myOpen === 1 ? '' : 's'} assigned. The board is ${conn === 'live' ? 'syncing live' : 'connecting'}.`
            : 'No open tasks assigned to you — great time to plan ahead.'}
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<ListTodo size={20} className="text-brand-300" />}
          label="Total tasks"
          value={s?.totalTasks ?? '—'}
          tone="bg-brand-500/15 border-brand-500/30"
          sub={`${s?.openTasks ?? 0} open`}
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-300" />}
          label="Completed"
          value={s?.completedTasks ?? '—'}
          tone="bg-emerald-500/15 border-emerald-500/30"
          sub={`${s?.completionRate ?? 0}% completion rate`}
        />
        <StatCard
          icon={<AlarmClock size={20} className="text-red-300" />}
          label="Overdue"
          value={s?.overdueTasks ?? '—'}
          tone="bg-red-500/15 border-red-500/30"
          sub="past due date, still open"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-amber-300" />}
          label="Columns"
          value={s?.perColumn.length ?? '—'}
          tone="bg-amber-500/15 border-amber-500/30"
          sub="on the active board"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* column distribution */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Kanban size={15} className="text-brand-400" /> Work distribution by column
          </h3>
          <div className="space-y-4">
            {(s?.perColumn ?? []).map((c) => {
              const max = Math.max(1, ...(s?.perColumn ?? []).map((x) => x.count))
              const pct = Math.round((c.count / max) * 100)
              return (
                <div key={c.columnId}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">{c.name}</span>
                    <span className="text-slate-500">{c.count} task{c.count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
              )
            })}
            {!s?.perColumn.length && <p className="text-sm text-slate-500">No columns yet.</p>}
          </div>

          {/* priority mix */}
          <h3 className="text-sm font-bold text-white mt-7 mb-3">Priority mix</h3>
          <div className="flex flex-wrap gap-2">
            {(s?.perPriority ?? []).map((p) => (
              <span key={p.priority} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <PriorityBadge priority={p.priority as never} />
                {p.count}
              </span>
            ))}
          </div>
        </div>

        {/* workload + upcoming */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white mb-3">Team workload</h3>
            <div className="space-y-3">
              {(s?.perUser ?? []).slice(0, 5).map((u) => (
                <div key={u.userId} className="flex items-center gap-3">
                  <Avatar name={u.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{u.fullName}</p>
                    <p className="text-[11px] text-slate-500">{u.role}</p>
                  </div>
                  <span className="text-xs font-bold text-brand-300">{u.openTasks}</span>
                  {u.overdueTasks > 0 && (
                    <span className="text-[10px] font-bold text-red-300 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5">
                      {u.overdueTasks} late
                    </span>
                  )}
                </div>
              ))}
              {!s?.perUser.length && <p className="text-sm text-slate-500">Nothing assigned yet.</p>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white mb-3">Due soon</h3>
            <div className="space-y-2.5">
              {(s?.upcoming ?? []).map((t) => (
                <div key={t.id} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {t.dueDate ?? 'no date'} · {t.columnName}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority as never} />
                </div>
              ))}
              {!s?.upcoming.length && <p className="text-sm text-slate-500">Nothing due in the next 7 days.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
