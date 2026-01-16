import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authAPI } from '../utils/api'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let data
      if (isLogin) {
        data = await authAPI.login(form.email, form.password)
      } else {
        if (!form.name) {
          setError('Name is required for signup')
          setIsLoading(false)
          return
        }
        data = await authAPI.signup(form.name, form.email, form.password)
      }

      // Success - redirect to dashboard
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-8 shadow-[0_35px_120px_-35px_rgba(15,23,42,0.8)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-2 inline-block rounded-full bg-sky-500/20 px-4 py-1">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">AI Expense Tracker</p>
            </div>
            <h1 className="mb-2 text-3xl font-semibold text-white">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-sm text-slate-400">
              {isLogin
                ? 'Sign in to manage your expenses'
                : 'Create your account to start tracking'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Enter your name"
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 py-3 text-lg font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-sky-500 hover:shadow-xl hover:shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Please wait...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 text-slate-500">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setForm({ name: '', email: '', password: '' })
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900/60 hover:text-white"
            >
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-sky-400 hover:text-sky-300">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-sky-400 hover:text-sky-300">Sign in</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Login

