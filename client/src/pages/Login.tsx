import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Kanban, ShieldCheck, Users2, Zap } from 'lucide-react'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const demoAccounts = [
  { label: 'Admin', email: 'admin@taskmanager.pro', password: 'Admin@123' },
  { label: 'Manager', email: 'manager@taskmanager.pro', password: 'Manager@123' },
  { label: 'Member', email: 'member@taskmanager.pro', password: 'Member@123' }
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const fill = (acc: (typeof demoAccounts)[number]) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-night-950 via-night-900 to-night-800">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* brand panel */}
        <div className="hidden lg:block">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow mb-6">
            <Kanban size={26} className="text-white" />
          </span>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Task Manager <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-fuchsia-400">Pro</span>
          </h1>
          <p className="mt-4 text-slate-400 leading-relaxed max-w-md">
            Full-stack task management with secure authentication, role-based permissions and real-time board updates —
            built with ASP.NET Core, React, SQL Server and SignalR.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-brand-400" /> JWT authentication & hashed passwords
            </li>
            <li className="flex items-center gap-3">
              <Users2 size={16} className="text-brand-400" /> Admin / Manager / Member roles
            </li>
            <li className="flex items-center gap-3">
              <Zap size={16} className="text-brand-400" /> Live drag &amp; drop across devices via SignalR
            </li>
          </ul>
        </div>

        {/* form card */}
        <div className="card bg-night-850/90 border-white/10 p-7 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to your workspace.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Demo accounts — click to fill</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  onClick={() => fill(acc)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-brand-500/15 hover:border-brand-500/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500 text-center">
            No account yet?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
