import { useEffect, useState, type FormEvent } from 'react'
import { Trash2, X } from 'lucide-react'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { PRIORITIES, type Priority, type TaskItem } from '../types'

export interface ModalState {
  open: boolean
  task: TaskItem | null // null = create mode
  presetColumnId?: number
}

export default function TaskModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  const { user } = useAuth()
  const { columns, users, createTask, updateTask, deleteTask } = useData()
  const { push } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [columnId, setColumnId] = useState<number>(columns[0]?.id ?? 0)
  const [assigneeId, setAssigneeId] = useState<number | 'none'>('none')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = state.task !== null
  const canManage = user?.role === 'Admin' || user?.role === 'Manager'
  // Members may only edit tasks assigned to them
  const canEdit = !isEdit ? canManage : canManage || state.task!.assigneeId === user?.id
  const canDelete = canManage

  useEffect(() => {
    if (!state.open) return
    setError('')
    if (state.task) {
      setTitle(state.task.title)
      setDescription(state.task.description ?? '')
      setPriority(state.task.priority)
      setColumnId(state.task.boardColumnId)
      setAssigneeId(state.task.assigneeId ?? 'none')
      setDueDate(state.task.dueDate ?? '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('Medium')
      setColumnId(state.presetColumnId ?? columns[0]?.id ?? 0)
      setAssigneeId('none')
      setDueDate('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        boardColumnId: columnId,
        assigneeId: assigneeId === 'none' ? null : Number(assigneeId),
        dueDate: dueDate || null
      } as Partial<TaskItem> & { title: string }

      if (isEdit && state.task) await updateTask(state.task.id, payload)
      else await createTask(payload)
      push(isEdit ? 'Task updated' : 'Task created', 'success')
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!state.task) return
    if (!window.confirm(`Delete "${state.task.title}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      await deleteTask(state.task.id)
      push('Task deleted', 'success')
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!state.open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg bg-night-850 border-white/10 p-6 animate-[toast-in_.2s_ease-out] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {!canEdit ? (
          <p className="text-sm text-slate-400">
            You can only edit tasks that are assigned to you. Ask a manager for changes to other tasks.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Implement login flow" autoFocus />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[90px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details, acceptance criteria, links…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Column</label>
                <select className="input" value={columnId} onChange={(e) => setColumnId(Number(e.target.value))}>
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Assignee</label>
                <select
                  className="input"
                  value={assigneeId === 'none' ? 'none' : String(assigneeId)}
                  onChange={(e) => setAssigneeId(e.target.value === 'none' ? 'none' : Number(e.target.value))}
                >
                  <option value="none">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Due date</label>
                <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">{error}</p>}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
              </button>
              {isEdit && canDelete && (
                <button type="button" onClick={remove} disabled={saving} className="btn-danger">
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
