import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { api, errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { Avatar, EmptyState, RoleBadge, Spinner } from '../components/ui'
import { ROLES, type Role } from '../types'

export default function Team() {
  const { user, refreshUser } = useAuth()
  const { usersWithStats, loading, refreshUsers } = useData()
  const { push } = useToast()
  const [busyId, setBusyId] = useState<number | null>(null)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'Admin')
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="card">
          <EmptyState
            icon={<Users size={36} />}
            title="Admins only"
            hint="Team management is restricted to users with the Admin role."
          />
        </div>
      </div>
    )

  const setRole = async (id: number, role: Role) => {
    setBusyId(id)
    try {
      await api.put(`/users/${id}/role`, { role })
      push(`Role changed to ${role}`, 'success')
      if (id === user.id) await refreshUser()
      await refreshUsers()
    } catch (e) {
      push(errorMessage(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const setStatus = async (id: number, isActive: boolean) => {
    setBusyId(id)
    try {
      await api.put(`/users/${id}/status`, { isActive })
      push(isActive ? 'Account activated' : 'Account deactivated', 'success')
      await refreshUsers()
    } catch (e) {
      push(errorMessage(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const removeUser = async (id: number, name: string) => {
    if (!window.confirm(`Delete ${name}? Their assigned tasks will become unassigned.`)) return
    setBusyId(id)
    try {
      await api.delete(`/users/${id}`)
      push('User deleted', 'success')
      await refreshUsers()
    } catch (e) {
      push(errorMessage(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading team…" />

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <p className="text-sm text-slate-500">
        Manage roles and account status. Members can only move and edit tasks assigned to them; Managers create and
        organize tasks; Admins additionally manage the team.
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5 bg-white/[0.02]">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Workload</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersWithStats.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 flex items-center gap-2">
                          {u.fullName}
                          {u.id === user.id && (
                            <span className="text-[10px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/30 rounded-full px-1.5 py-0.5">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      className="select-input"
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => void setRole(u.id, e.target.value as Role)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    <span className="font-bold text-slate-200">{u.openTasks}</span> open · {u.totalTasks} total
                  </td>
                  <td className="px-4 py-3.5">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {u.id !== user.id && (
                        <>
                          <button
                            onClick={() => void setStatus(u.id, !u.isActive)}
                            disabled={busyId === u.id}
                            className="btn-ghost !px-3 !py-1.5 !text-xs"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => void removeUser(u.id, u.fullName)}
                            disabled={busyId === u.id}
                            className="btn-danger !px-3 !py-1.5 !text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usersWithStats.length === 0 && <EmptyState icon={<Users size={36} />} title="No users found" />}
      </div>

      <p className="text-xs text-slate-600 flex items-center gap-2">
        <RoleBadge role="Member" /> default role for self-registration.
      </p>
    </div>
  )
}
