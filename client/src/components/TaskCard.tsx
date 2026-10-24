import { CalendarDays, GripVertical, Clock } from 'lucide-react'
import { isOverdue, type TaskItem } from '../types'
import { Avatar, PriorityBadge } from './ui'

export default function TaskCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
  draggable
}: {
  task: TaskItem
  onOpen: () => void
  onDragStart: () => void
  onDragEnd: () => void
  draggable: boolean
}) {
  const overdue = isOverdue(task.dueDate)

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(task.id))
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`group card p-3.5 cursor-pointer transition hover:border-brand-500/40 hover:shadow-glow
        ${draggable ? 'active:cursor-grabbing cursor-grab' : ''}`}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical size={14} className="mt-0.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
        )}
        <p className="flex-1 text-sm font-semibold text-slate-100 leading-snug">{task.title}</p>
      </div>

      {task.description && (
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2 pl-6">{task.description}</p>
      )}

      <div className="mt-3 flex items-center gap-2 pl-6 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? 'text-red-300' : 'text-slate-500'}`}
            title={overdue ? 'Overdue' : 'Due date'}
          >
            {overdue ? <Clock size={11} /> : <CalendarDays size={11} />}
            {task.dueDate}
          </span>
        )}
        <span className="ml-auto">
          <Avatar name={task.assigneeName} size="sm" />
        </span>
      </div>
    </div>
  )
}
