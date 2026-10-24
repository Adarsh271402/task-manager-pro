import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { api, errorMessage } from '../api/client'
import { createBoardConnection } from '../api/realtime'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import type { BoardColumn, BoardSync, DashboardStats, TaskEvent, TaskItem, User, UserWithStats } from '../types'

export type ConnState = 'connecting' | 'live' | 'reconnecting' | 'offline'

interface DataContextValue {
  columns: BoardColumn[]
  tasks: TaskItem[]
  users: User[]
  usersWithStats: UserWithStats[]
  stats: DashboardStats | null
  conn: ConnState
  loading: boolean
  createTask: (payload: Partial<TaskItem> & { title: string }) => Promise<void>
  updateTask: (id: number, payload: Partial<TaskItem> & { title: string }) => Promise<void>
  moveTask: (id: number, columnId: number, position: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  refreshStats: () => Promise<void>
  refreshUsers: () => Promise<void>
  refreshColumns: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

const verbs: Record<string, string> = {
  created: 'added',
  updated: 'updated',
  deleted: 'removed',
  moved: 'moved'
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { push } = useToast()

  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [usersWithStats, setUsersWithStats] = useState<UserWithStats[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [conn, setConn] = useState<ConnState>('connecting')
  const [loading, setLoading] = useState(true)

  const connRef = useRef<HubConnection | null>(null)
  const meRef = useRef<string>(user?.fullName ?? '')
  meRef.current = user?.fullName ?? ''
  const userKey = user?.id ?? 0

  const refreshStats = useCallback(async () => {
    try {
      const res = await api.get<DashboardStats>('/stats/dashboard')
      setStats(res.data)
    } catch {
      /* non-critical */
    }
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const res = await api.get<UserWithStats[]>('/users')
      setUsersWithStats(res.data)
      setUsers(res.data.map(({ openTasks, totalTasks, ...u }) => u as User))
    } catch {
      // non-admins cannot list users; derive a minimal list from tasks
      try {
        const res = await api.get<TaskItem[]>('/tasks')
        const map = new Map<number, User>()
        res.data.forEach((t) => {
          if (t.assigneeId && t.assigneeName && !map.has(t.assigneeId))
            map.set(t.assigneeId, {
              id: t.assigneeId,
              fullName: t.assigneeName,
              email: '',
              role: 'Member',
              isActive: true,
              createdAt: ''
            })
        })
        setUsers([...map.values()])
        setUsersWithStats([])
      } catch {
        /* ignore */
      }
    }
  }, [])

  const refreshColumns = useCallback(async () => {
    try {
      const res = await api.get<BoardColumn[]>('/columns')
      setColumns(res.data)
    } catch {
      /* ignore */
    }
  }, [])

  // ---- initial load -----------------------------------------------------
  useEffect(() => {
    if (!userKey) return
    let cancelled = false

    Promise.all([api.get<TaskItem[]>('/tasks'), refreshColumns(), refreshUsers(), refreshStats()])
      .then(([t]) => {
        if (!cancelled) setTasks(t.data)
      })
      .catch((e) => push(errorMessage(e), 'error'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey])

  // ---- SignalR real-time --------------------------------------------------
  useEffect(() => {
    if (!userKey) return
    const connection = createBoardConnection()
    connRef.current = connection

    const notify = (actor: string, action: string, title: string) => {
      if (actor && actor !== meRef.current) push(`${actor} ${verbs[action] ?? action} "${title}"`, 'info')
    }

    connection.on('task:created', (e: TaskEvent) => {
      setTasks((prev) => (prev.some((t) => t.id === e.task.id) ? prev : [...prev, e.task]))
      notify(e.actor, 'created', e.task.title)
      void refreshStats()
    })

    connection.on('task:updated', (e: TaskEvent) => {
      setTasks((prev) => prev.map((t) => (t.id === e.task.id ? e.task : t)))
      notify(e.actor, 'updated', e.task.title)
      void refreshStats()
    })

    connection.on('task:deleted', (e: { id: number; actor: string }) => {
      setTasks((prev) => {
        const t = prev.find((x) => x.id === e.id)
        if (t) notify(e.actor, 'deleted', t.title)
        return prev.filter((x) => x.id !== e.id)
      })
      void refreshStats()
    })

    connection.on('board:sync', (e: BoardSync) => {
      setTasks(e.tasks)
      notify(e.actor, e.action, 'the board')
      void refreshStats()
    })

    connection.on('column:changed', () => void refreshColumns())
    connection.on('user:changed', () => void refreshUsers())

    connection
      .start()
      .then(() => setConn('live'))
      .catch(() => setConn('offline'))

    connection.onreconnecting(() => setConn('reconnecting'))
    connection.onreconnected(() => {
      setConn('live')
      // resync after reconnect
      api
        .get<TaskItem[]>('/tasks')
        .then((res) => setTasks(res.data))
        .catch(() => undefined)
      void refreshColumns()
      void refreshStats()
    })
    connection.onclose(() => setConn('offline'))

    return () => {
      void connection.stop()
      connRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey])

  // ---- actions -------------------------------------------------------------
  const createTask = useCallback(
    async (payload: Partial<TaskItem> & { title: string }) => {
      await api.post('/tasks', {
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority ?? 'Medium',
        boardColumnId: payload.boardColumnId,
        assigneeId: payload.assigneeId ?? null,
        dueDate: payload.dueDate ?? null
      })
    },
    []
  )

  const updateTask = useCallback(
    async (id: number, payload: Partial<TaskItem> & { title: string }) => {
      await api.put(`/tasks/${id}`, {
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority ?? 'Medium',
        boardColumnId: payload.boardColumnId,
        assigneeId: payload.assigneeId ?? null,
        dueDate: payload.dueDate ?? null
      })
    },
    []
  )

  const moveTask = useCallback(
    async (id: number, columnId: number, position: number) => {
      // optimistic: reorder locally, server broadcasts authoritative state
      setTasks((prev) => {
        const task = prev.find((t) => t.id === id)
        if (!task) return prev
        const others = prev.filter((t) => t.id !== id)
        const col = columns.find((c) => c.id === columnId)
        const moved: TaskItem = { ...task, boardColumnId: columnId, boardColumnName: col?.name ?? task.boardColumnName, position }
        const sameColumn = others.filter((t) => t.boardColumnId === columnId)
        const rest = others.filter((t) => t.boardColumnId !== columnId)
        sameColumn.splice(Math.min(position, sameColumn.length), 0, moved)
        return [...rest, ...sameColumn]
          .sort((a, b) =>
            a.boardColumnId === b.boardColumnId
              ? a.position - b.position
              : (columns.find((c) => c.id === a.boardColumnId)?.position ?? 0) -
                (columns.find((c) => c.id === b.boardColumnId)?.position ?? 0)
          )
          .map((t, i) => ({ ...t }))
      })
      try {
        await api.put(`/tasks/${id}/move`, { columnId, position })
      } catch (e) {
        push(errorMessage(e), 'error')
        const res = await api.get<TaskItem[]>('/tasks')
        setTasks(res.data)
      }
    },
    [columns, push]
  )

  const deleteTask = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/tasks/${id}`)
        setTasks((prev) => prev.filter((t) => t.id !== id))
      } catch (e) {
        push(errorMessage(e), 'error')
      }
    },
    [push]
  )

  return (
    <DataContext.Provider
      value={{
        columns,
        tasks,
        users,
        usersWithStats,
        stats,
        conn,
        loading,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        refreshStats,
        refreshUsers,
        refreshColumns
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
