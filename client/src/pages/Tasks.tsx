import { useMemo, useState } from 'react'
import { ListTodo, Pencil, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import TaskModal, { type ModalState } from '../components/TaskModal'
import { Avatar, EmptyState, PriorityBadge, Spinner } from '../components/ui'
import { PRIORITIES, isOverdue, type Priority } from '../types'

export default function Tasks() {
  const { user } = useAuth()
  const { tasks, columns, users, loading, deleteTask } = useData()
  const [modal, setModal] = useState<ModalState>({ open: false, task: null })
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<Priority | 'All'>('All')
  const [assignee, setAssignee] = useState<'all' | 'me' | 'unassigned' | number>('all')

  const canManage = user?.role === 'Admin' || user?.role === 'Manager'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks
      .filter((t) => {
        if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false
        if (priority !== 'All' && t.priority !== priority) return false
        if (assignee === 'me' && t.assigneeId !== user?.id) return false
        if (assignee === 'unassigned' && t.assigneeId !== null) return false
        if (typeof assignee === 'number' && t.assigneeId !== assignee) return false
        return true
      })
      .sort((a, b) => a.boardColumnId - b.boardColumnId || a.position - b.position)
  }, [tasks, search, priority, assignee, user?.id])

  const remove = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteTask(id)
  }

  if (loading) return <Spinner label="Loading tasks…" />

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input !pl-9 !py-2 w-56"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select-input" value={priority} onChange={(e) => setPriority(e.target.value as Priority | 'All')}>
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="select-input"
          value={String(assignee)}
          onChange={(e) => {
            const v = e.target.value
            setAssignee(v === 'all' || v === 'me' || v === 'unassigned' ? (v as 'all' | 'me' | 'unassigned') : Number(v))
          }}
        >
          <option value="all">Everyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
        {canManage && (
          <button onClick={() => setModal({ open: true, task: null })} className="btn-primary ml-auto !py-2">
            New task
          </button>
        )}
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5 bg-white/[0.02]">
                <th className="px-5 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Column</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Assignee</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const canEdit = canManage || t.assigneeId === user?.id
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-100">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: columns.find((c) => c.id === t.boardColumnId)?.color ?? '#8b5cf6' }}
                        />
                        {t.boardColumnName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                        <Avatar name={t.assigneeName} size="sm" />
                        {t.assigneeName ?? 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {t.dueDate ? (
                        <span className={`text-xs font-medium ${isOverdue(t.dueDate) ? 'text-red-300' : 'text-slate-400'}`}>
                          {t.dueDate}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => setModal({ open: true, task: t })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-300 hover:bg-white/5 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => void remove(t.id, t.title)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-white/5 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState icon={<ListTodo size={36} />} title="No tasks match your filters" hint="Try clearing the search or filters." />
        )}
      </div>

      <TaskModal state={modal} onClose={() => setModal({ open: false, task: null })} />
    </div>
  )
}
