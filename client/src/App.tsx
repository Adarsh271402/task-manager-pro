import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import Tasks from './pages/Tasks'
import Team from './pages/Team'
import { Spinner } from './components/ui'

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DataProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </DataProvider>
  )
}

function Protected() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-950">
        <Spinner label="Starting Task Manager Pro…" />
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected />}>
        {/* pathless parent renders <Outlet /> by default */}
        <Route path="/">
          <Route index element={<Dashboard />} />
          <Route path="board" element={<Board />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<Team />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
