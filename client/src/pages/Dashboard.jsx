import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import {
  monthlySeries,
  categorySplit,
  upcomingBills,
} from '../data/mockExpenses'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { convertAndFormat, usdToInr, USD_TO_INR_RATE } from '../utils/currency'
import { expenseAPI, aiAPI } from '../utils/api'
import AIChatAssistant from '../components/AIChatAssistant'

const Dashboard = () => {
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false)

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    if (expenses.length > 0) {
      fetchAIInsights()
      fetchPrediction()
    }
  }, [expenses])

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      const data = await expenseAPI.getAll()
      setExpenses(data || [])
    } catch (err) {
      console.error('Error fetching expenses:', err)
      // If error (e.g., not logged in), use empty array
      setExpenses([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAIInsights = async () => {
    try {
      setIsLoadingInsights(true)
      const result = await aiAPI.getInsights(expenses)
      setAiInsights(result.insights || [])
    } catch (err) {
      console.error('Error fetching AI insights:', err)
      setAiInsights([])
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const fetchPrediction = async () => {
    try {
      setIsLoadingPrediction(true)
      // Group expenses by month
      const monthlyTotals = {}
      expenses.forEach((expense) => {
        const date = new Date(expense.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount
      })

      // Convert to array format for prediction API
      const history = Object.entries(monthlyTotals)
        .sort()
        .slice(-6) // Last 6 months
        .map(([month, total]) => ({ month, total }))

      if (history.length >= 2) {
        const result = await aiAPI.predict(history)
        setPrediction(result)
      }
    } catch (err) {
      console.error('Error fetching prediction:', err)
    } finally {
      setIsLoadingPrediction(false)
    }
  }

  const totalSpent = expenses.reduce((acc, item) => acc + item.amount, 0)
  const avgPerExpense = expenses.length ? totalSpent / expenses.length : 0
  const totalCategories = categorySplit.length

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
}

  return (
    <div className="space-y-10">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-6 shadow-[0_35px_120px_-35px_rgba(15,23,42,0.8)]"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Live overview</p>
            <h2 className="text-3xl font-semibold">Intelligent finance dashboard</h2>
            <p className="text-slate-400">
              Snapshot generated from your latest synced expenses. Animations highlight changes in
              real time.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4 text-right">
            <p className="text-sm text-slate-400">Total spending (MTD)</p>
            <p className="text-4xl font-semibold text-sky-300">{convertAndFormat(totalSpent)}</p>
            <p className="text-sm text-emerald-400">+8.6% vs last month</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={1} className="lg:col-span-2">
          <Card className="h-full overflow-hidden">
            <CardHeader>
              <CardTitle>Spending prediction</CardTitle>
              <CardDescription>Linear trendline over monthly totals</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries.map(item => ({ ...item, total: usdToInr(item.total) }))}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      color: '#f8fafc',
                    }}
                    formatter={(value) => {
                      const usdValue = value / USD_TO_INR_RATE
                      return convertAndFormat(usdValue, false)
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={2}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Category mix</CardTitle>
              <CardDescription>{totalCategories} segments this cycle</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categorySplit.map(item => ({ ...item, value: usdToInr(item.value) }))} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={50} 
                    outerRadius={90} 
                    paddingAngle={4}
                    activeShape={{
                      fill: 'url(#activeGradient)',
                      stroke: '#38bdf8',
                      strokeWidth: 2,
                    }}
                  >
                    {categorySplit.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#38bdf8',
                      borderWidth: '2px',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      padding: '12px 16px',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    }}
                    labelStyle={{
                      color: '#38bdf8',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginBottom: '4px',
                    }}
                    itemStyle={{
                      color: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                    formatter={(value) => {
                      const usdValue = value / USD_TO_INR_RATE
                      return convertAndFormat(usdValue, false)
                    }}
                    cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={3}>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming bill alerts</CardTitle>
              <CardDescription>Keep cashflow smooth with early reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition hover:-translate-y-1 hover:border-sky-500">
                  <p className="text-sm uppercase tracking-widest text-slate-400">{bill.dueDate}</p>
                  <p className="text-lg font-semibold">{bill.title}</p>
                  <p className="text-sky-300">{convertAndFormat(bill.amount)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={4} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Last synced expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="py-4 text-center text-slate-400">Loading expenses...</div>
              ) : expenses.length === 0 ? (
                <div className="py-4 text-center text-slate-400">No expenses yet. Add your first expense!</div>
              ) : (
                expenses.slice(0, 5).map((expense) => (
                  <div key={expense._id || expense.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:-translate-y-1 hover:border-slate-700">
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-slate-400">
                        {expense.category} · {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-mono text-sky-300">{convertAndFormat(expense.amount)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={5}>
        <Card>
          <CardHeader>
            <CardTitle>AI-generated insights</CardTitle>
            <CardDescription>
              {isLoadingInsights 
                ? 'Analyzing your spending patterns...' 
                : 'Actionable insights based on your expense data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <div className="flex items-center justify-center py-8">
                <svg className="h-8 w-8 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : aiInsights.length > 0 ? (
              <div className="space-y-4">
                {/* Priority insights (High impact) */}
                {aiInsights.filter(i => i.impact === 'HIGH').length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-400">High Priority</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {aiInsights
                        .filter(i => i.impact === 'HIGH')
                        .map((insight) => (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-amber-900/10 p-5 transition hover:-translate-y-1 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-amber-500/20 p-2">
                                  <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">{insight.impact} IMPACT</span>
                              </div>
                            </div>
                            <h5 className="mb-2 text-lg font-semibold text-white">{insight.title}</h5>
                            <p className="text-sm leading-relaxed text-slate-300">{insight.detail}</p>
                            {insight.category && (
                              <div className="mt-3 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-300">
                                {insight.category}
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Medium priority insights */}
                {aiInsights.filter(i => i.impact === 'MEDIUM').length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-400">Medium Priority</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {aiInsights
                        .filter(i => i.impact === 'MEDIUM')
                        .map((insight) => (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group relative rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                              insight.type === 'warning'
                                ? 'border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-amber-900/10 hover:border-amber-500 hover:shadow-amber-500/20'
                                : insight.type === 'success'
                                ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 hover:border-emerald-500 hover:shadow-emerald-500/20'
                                : 'border-sky-500/50 bg-gradient-to-br from-sky-900/20 to-sky-900/10 hover:border-sky-500 hover:shadow-sky-500/20'
                            }`}
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`rounded-lg p-2 ${
                                  insight.type === 'warning'
                                    ? 'bg-amber-500/20'
                                    : insight.type === 'success'
                                    ? 'bg-emerald-500/20'
                                    : 'bg-sky-500/20'
                                }`}>
                                  {insight.type === 'success' ? (
                                    <svg className={`h-5 w-5 ${insight.type === 'success' ? 'text-emerald-400' : 'text-sky-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className={`h-5 w-5 ${insight.type === 'warning' ? 'text-amber-400' : 'text-sky-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`text-xs font-semibold uppercase tracking-wider ${
                                  insight.type === 'warning'
                                    ? 'text-amber-400'
                                    : insight.type === 'success'
                                    ? 'text-emerald-400'
                                    : 'text-sky-400'
                                }`}>{insight.impact} IMPACT</span>
                              </div>
                            </div>
                            <h5 className="mb-2 text-lg font-semibold text-white">{insight.title}</h5>
                            <p className="text-sm leading-relaxed text-slate-300">{insight.detail}</p>
                            {insight.category && (
                              <div className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${
                                insight.type === 'warning'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}>
                                {insight.category}
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Low priority / Positive insights */}
                {aiInsights.filter(i => i.impact === 'LOW').length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">Positive Insights</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {aiInsights
                        .filter(i => i.impact === 'LOW')
                        .map((insight) => (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 p-5 transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-emerald-500/20 p-2">
                                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{insight.type === 'success' ? 'GREAT JOB' : 'INFO'}</span>
                              </div>
                            </div>
                            <h5 className="mb-2 text-lg font-semibold text-white">{insight.title}</h5>
                            <p className="text-sm leading-relaxed text-slate-300">{insight.detail}</p>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400">
                Add more expenses to get personalized AI insights!
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {prediction && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={6}>
          <Card>
            <CardHeader>
              <CardTitle>AI Spending Forecast</CardTitle>
              <CardDescription>Predicted spending for next month based on your trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-sky-500/50 bg-gradient-to-br from-sky-900/20 to-slate-900/40 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Predicted Amount</p>
                    <p className="text-3xl font-bold text-sky-300">
                      {convertAndFormat(prediction.predictedTotal)}
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-500/20 p-4">
                    <svg className="h-8 w-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{prediction.explanation}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Chat Assistant */}
      <AIChatAssistant expenses={expenses} />
    </div>
  )
}

export default Dashboard

