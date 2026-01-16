import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { expenseAPI } from '../utils/api'
import { convertAndFormat } from '../utils/currency'

const ViewExpenses = () => {
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await expenseAPI.getAll()
      // Convert USD amounts to display (they're stored as USD in DB)
      setExpenses(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load expenses. Please make sure you are logged in.')
      console.error('Error fetching expenses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent expenses</CardTitle>
        <CardDescription>
          {isLoading ? 'Loading expenses...' : `${expenses.length} expense(s) found`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-400">
            {error}
            <button
              onClick={fetchExpenses}
              className="ml-2 text-sm underline hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="py-8 text-center text-slate-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            No expenses found. Add your first expense to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/40 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-normal">Title</th>
                  <th className="px-4 py-3 font-normal">Category</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                  <th className="px-4 py-3 font-normal">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map((expense) => (
                  <tr key={expense._id || expense.id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-medium text-white">{expense.title}</td>
                    <td className="px-4 py-3 text-slate-300">{expense.category}</td>
                    <td className="px-4 py-3 font-mono text-sky-300">
                      {convertAndFormat(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{expense.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ViewExpenses






