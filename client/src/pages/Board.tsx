import { useMemo, useState } from 'react'
import { Plus, Search, Inbox } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import TaskCard from '../components/TaskCard'
import TaskModal, { type ModalState } from '../components/TaskModal'
import { EmptyState, Spinner } from '../components/ui'
import { PRIORITIES, type Priority, type TaskItem } from '../types'

export default function Board() {
  const { user } = useAuth()
  const { columns, tasks, users, loading, moveTask } = useData()

  const [modal, setModal] = useState<ModalState>({ open: false, task: null })
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<Priority | 'All'>('All')
  const [assignee, setAssignee] = useState<'all' | 'me' | 'unassigned' | number>('all')
  const [dragId, setDragId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<number | null>(null)

  const canCreate = user?.role === 'Admin' || user?.role === 'Manager'
  const canDrag = (t: TaskItem) => user?.role === 'Admin' || user?.role === 'Manager' || t.assigneeId === user?.id

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false
      if (priority !== 'All' && t.priority !== priority) return false
      if (assignee === 'me' && t.assigneeId !== user?.id) return false
      if (assignee === 'unassigned' && t.assigneeId !== null) return false
      if (typeof assignee === 'number' && t.assigneeId !== assignee) return false
      return true
    })
  }, [tasks, search, priority, assignee, user?.id])

  const byColumn = (colId: number) =>
    filtered.filter((t) => t.boardColumnId === colId).sort((a, b) => a.position - b.position)

  const handleDrop = (colId: number, index?: number) => {
    if (dragId === null) return
    const task = tasks.find((t) => t.id === dragId)
    const targetIndex = index ?? byColumn(colId).length
    if (task && task.boardColumnId === colId) {
      const colTasks = byColumn(colId)
      const currentIdx = colTasks.findIndex((t) => t.id === dragId)
      const insertAt = index ?? colTasks.length
      // moving within same column: dropping after itself is a no-op
      if (currentIdx === insertAt || (index === undefined && currentIdx === colTasks.length - 1)) {
        setDragId(null)
        setOverColumn(null)
        return
      }
    }
    void moveTask(dragId, colId, targetIndex)
    setDragId(null)
    setOverColumn(null)
  }

  if (loading) return <Spinner label="Loading board…" />

  return (
    <div className="flex flex-col h-full">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4">
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

        <select className="select-input" value={String(assignee)} onChange={(e) => {
          const v = e.target.value
          setAssignee(v === 'all' || v === 'me' || v === 'unassigned' ? (v as 'all' | 'me' | 'unassigned') : Number(v))
        }}>
          <option value="all">Everyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>

        {canCreate && (
          <button onClick={() => setModal({ open: true, task: null })} className="btn-primary ml-auto !py-2">
            <Plus size={16} /> New task
          </button>
        )}
      </div>

      {/* board */}
      <div className="flex-1 overflow-x-auto px-4 sm:px-6 pb-6">
        <div className="flex gap-4 min-h-full h-full">
          {columns.map((col) => {
            const colTasks = byColumn(col.id)
            const isOver = overColumn === col.id
            return (
              <section
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverColumn(col.id)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null)
                }}
                onDrop={() => handleDrop(col.id)}
                className={`flex flex-col w-[280px] sm:w-[300px] shrink-0 rounded-2xl border bg-night-900/70 transition
                  ${isOver && dragId !== null ? 'border-brand-500/60 bg-brand-500/5' : 'border-white/5'}`}
              >
                {/* column header */}
                <div className="px-4 pt-4 pb-3 border-b border-white/5" style={{ boxShadow: `inset 0 3px 0 0 ${col.color}` }}>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <h3 className="text-sm font-bold text-white">{col.name}</h3>
                    <span className="text-[11px] font-bold text-slate-500 bg-white/5 rounded-full px-2 py-0.5">{colTasks.length}</span>
                    {canCreate && (
                      <button
                        onClick={() => setModal({ open: true, task: null, presetColumnId: col.id })}
                        className="ml-auto text-slate-500 hover:text-brand-300 transition"
                        title={`Add task to ${col.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* cards */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                  {colTasks.map((t, i) => (
                    <div
                      key={t.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation()
                        handleDrop(col.id, i)
                      }}
                    >
                      <TaskCard
                        task={t}
                        draggable={canDrag(t)}
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setOverColumn(null)
                        }}
                        onOpen={() => setModal({ open: true, task: t })}
                      />
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-slate-600">
                      {dragId !== null ? 'Drop here' : 'No tasks'}
                    </div>
                  )}
                </div>
              </section>
            )
          })}

          {columns.length === 0 && (
            <div className="w-full card">
              <EmptyState icon={<Inbox size={36} />} title="No columns on the board yet" hint="Admins and managers can add columns." />
            </div>
          )}
        </div>
      </div>

      <TaskModal state={modal} onClose={() => setModal({ open: false, task: null })} />
    </div>
  )
}
