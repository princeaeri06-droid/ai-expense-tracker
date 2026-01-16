import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { expenseAPI, aiAPI } from '../utils/api'
import { motion } from 'framer-motion'

const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const initialState = {
  title: '',
  amount: '',
  category: '',
  date: getTodayDate(),
  description: '',
}

const AddExpense = () => {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [categorySuggestion, setCategorySuggestion] = useState(null)
  const [isUploadingOCR, setIsUploadingOCR] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const fileInputRef = useRef(null)
  const categorizeTimeoutRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (error) setError('')

    // Auto-categorize when title or description changes
    if ((name === 'title' || name === 'description') && value.trim().length > 3) {
      if (categorizeTimeoutRef.current) {
        clearTimeout(categorizeTimeoutRef.current)
      }
      
      categorizeTimeoutRef.current = setTimeout(async () => {
        const title = name === 'title' ? value : form.title
        const description = name === 'description' ? value : form.description
        
        if (title.trim().length > 3) {
          setIsCategorizing(true)
          try {
            const result = await aiAPI.categorize(title, description || '')
            setCategorySuggestion(result)
            // Auto-fill category if confidence is high
            if (result.confidence > 0.6 && !form.category) {
              setForm((prev) => ({ ...prev, category: result.category }))
            }
          } catch (err) {
            console.error('Auto-categorization failed:', err)
          } finally {
            setIsCategorizing(false)
          }
        }
      }, 800) // Debounce for 800ms
    }
  }

  const handleOCRUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingOCR(true)
    setError('')
    setMessage('')
    setOcrResult(null)

    try {
      console.log('Uploading file for OCR:', file.name, file.type, file.size)
      const result = await aiAPI.ocr(file)
      console.log('OCR Result:', result)
      setOcrResult(result)
      
      // Auto-fill form with OCR results
      if (result.amount) {
        setForm((prev) => ({ ...prev, amount: result.amount.toString() }))
      }
      
      if (result.items && result.items.length > 0) {
        const title = result.items[0].substring(0, 50) // Use first item as title
        setForm((prev) => ({ ...prev, title }))
        
        // Try to categorize
        try {
          const catResult = await aiAPI.categorize(title, result.items.join(' '))
          setCategorySuggestion(catResult)
          if (catResult.confidence > 0.5) {
            setForm((prev) => ({ ...prev, category: catResult.category }))
          }
        } catch (err) {
          console.error('Categorization failed:', err)
          // Don't show error for categorization failure
        }
      }

      if (result.amount || (result.items && result.items.length > 0)) {
        setMessage('Receipt processed successfully! Review and adjust the fields below.')
      } else {
        setMessage('Receipt processed, but no amount or items were detected. Please fill in manually.')
      }
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      console.error('OCR Error:', err)
      const errorMessage = err.message || 'Failed to process receipt image'
      setError(errorMessage)
      
      // Show error for 7 seconds so user can read it
      setTimeout(() => setError(''), 7000)
    } finally {
      setIsUploadingOCR(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  useEffect(() => {
    return () => {
      if (categorizeTimeoutRef.current) {
        clearTimeout(categorizeTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      // Convert amount to number
      const expenseData = {
        ...form,
        amount: parseFloat(form.amount),
      }

      await expenseAPI.add(expenseData)
      setMessage('Expense added successfully!')
      setForm(initialState)
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to add expense. Please try again.')
      console.error('Error adding expense:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add new expense</CardTitle>
          <CardDescription>
            Fill out the form manually or upload a receipt to auto-fill using AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OCR Upload Section */}
          <div className="mb-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-6">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">AI Receipt Scanner</h3>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Upload a receipt image and AI will extract the amount and details automatically.
            </p>
            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-6 transition hover:border-sky-500 hover:bg-slate-900/60">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleOCRUpload}
                className="hidden"
                disabled={isUploadingOCR}
              />
              {isUploadingOCR ? (
                <>
                  <svg className="h-6 w-6 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-slate-300">Processing receipt...</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-slate-300">Click to upload receipt image</span>
                </>
              )}
            </label>
            {error && error.includes('OCR') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4"
              >
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-300">OCR Error</p>
                    <p className="mt-1 text-sm text-red-200">{error}</p>
                    {error.includes('running') && (
                      <p className="mt-2 text-xs text-red-300/80">
                        Make sure the AI service is running: <code className="bg-red-900/30 px-1 rounded">cd ai && uvicorn ocr:app --reload --port 8000</code>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {ocrResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-sky-500/50 bg-sky-500/10 p-4"
              >
                <p className="text-sm font-medium text-sky-300">Extracted from receipt:</p>
                {ocrResult.amount && (
                  <p className="mt-1 text-slate-300">Amount: ${ocrResult.amount.toFixed(2)}</p>
                )}
                {ocrResult.items && ocrResult.items.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400">Items found:</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-slate-300">
                      {ocrResult.items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ocrResult.rawText && (
                  <details className="mt-3">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                      View raw extracted text
                    </summary>
                    <pre className="mt-2 text-xs text-slate-400 bg-slate-900/40 p-2 rounded overflow-auto max-h-32">
                      {ocrResult.rawText}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Title</span>
                {isCategorizing && (
                  <span className="text-xs text-sky-400">AI analyzing...</span>
                )}
                {categorySuggestion && !isCategorizing && (
                  <span className="text-xs text-emerald-400">
                    Suggested: {categorySuggestion.category} ({Math.round(categorySuggestion.confidence * 100)}%)
                  </span>
                )}
              </div>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g., Grocery run"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Amount</span>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                required
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2"
                placeholder="10000.00"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Category</span>
              <div className="relative">
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Food (AI will suggest)"
                />
                {categorySuggestion && categorySuggestion.confidence > 0.6 && form.category !== categorySuggestion.category && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: categorySuggestion.category }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-sky-500/20 px-3 py-1 text-xs text-sky-300 transition hover:bg-sky-500/30"
                  >
                    Use AI suggestion
                  </button>
                )}
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Date</span>
              <input
                name="date"
                type="date"
                value={form.date}
                required
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2"
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2"
              placeholder="Optional notes"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-sky-500 py-3 text-lg font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save expense'}
          </button>
          {error && (
            <p className="text-center text-sm text-red-400">
              {error}
            </p>
          )}
          {message && (
            <p className="text-center text-sm text-green-400">
              {message}{' '}
              <span role="img" aria-label="sparkles">
                ✨
              </span>
            </p>
          )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddExpense






