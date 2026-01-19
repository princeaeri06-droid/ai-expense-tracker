import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { authAPI, getAuthToken } from '../utils/api'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/add', label: 'Add Expense' },
  { to: '/view', label: 'View Expenses' },
]

const AppLayout = () => {
  const navigate = useNavigate()
  const token = getAuthToken()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    console.log('AppLayout: Checking auth token...', { hasToken: !!token })
    
    if (!token) {
      console.log('AppLayout: No token, redirecting to login')
      navigate('/login', { replace: true })
    } else {
      console.log('AppLayout: Token found, proceeding')
      setIsChecking(false)
    }
  }, [token, navigate])

  const handleLogout = () => {
    authAPI.logout()
    navigate('/login', { replace: true })
  }

  // Show loading state while checking auth
  if (isChecking || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-400"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400">AI Expense Tracker</p>
            <h1 className="text-2xl font-semibold">Finance cockpit</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="rounded-full px-3 py-1 text-slate-300 transition hover:bg-red-500/20 hover:text-red-400"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout






