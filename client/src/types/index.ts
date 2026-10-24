export type Role = 'Admin' | 'Manager' | 'Member'
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'
export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent']
export const ROLES: Role[] = ['Admin', 'Manager', 'Member']

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

export interface UserWithStats extends User {
  openTasks: number
  totalTasks: number
}

export interface BoardColumn {
  id: number
  name: string
  color: string
  position: number
  taskCount: number
}

export interface TaskItem {
  id: number
  title: string
  description: string | null
  priority: Priority
  boardColumnId: number
  boardColumnName: string
  position: number
  assigneeId: number | null
  assigneeName: string | null
  creatorId: number
  dueDate: string | null
  createdAt: string
  updatedAt: string | null
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  openTasks: number
  overdueTasks: number
  completionRate: number
  perColumn: { columnId: number; name: string; color: string; count: number }[]
  perPriority: { priority: string; count: number }[]
  perUser: { userId: number; fullName: string; role: string; openTasks: number; overdueTasks: number }[]
  upcoming: { id: number; title: string; priority: string; assigneeName: string | null; dueDate: string | null; columnName: string }[]
}

export interface TaskEvent {
  action: string
  actor: string
  task: TaskItem
}

export interface BoardSync {
  action: string
  actor: string
  tasks: TaskItem[]
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

export function priorityClasses(p: Priority): string {
  switch (p) {
    case 'Urgent':
      return 'bg-red-500/15 text-red-300 border-red-500/30'
    case 'High':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'Medium':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  }
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate + 'T00:00:00') < today
}
