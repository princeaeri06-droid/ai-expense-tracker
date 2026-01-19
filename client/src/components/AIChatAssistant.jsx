import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiAPI } from '../utils/api'

const AIChatAssistant = ({ expenses = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm your AI expense assistant. Ask me about your spending, categories, totals, or get budget recommendations!",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async (e, directMessage = null) => {
    e.preventDefault()
    
    // Use directMessage if provided, otherwise use input state
    const messageToSend = directMessage || input.trim()
    
    if (!messageToSend || isLoading) return

    const userMessage = messageToSend
    setInput('')
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Ensure expenses is an array and clean MongoDB objects
      let expensesArray = Array.isArray(expenses) ? expenses : []
      
      // Clean expenses - remove MongoDB-specific fields and ensure proper format
      expensesArray = expensesArray.map(exp => ({
        _id: exp._id || exp.id,
        title: exp.title || '',
        amount: exp.amount || 0,
        category: exp.category || 'Uncategorized',
        date: exp.date || new Date().toISOString(),
        description: exp.description || ''
      }))
      
      console.log('Sending chat request:', { 
        message: userMessage, 
        expensesCount: expensesArray.length,
        timestamp: new Date().toISOString(),
        sampleExpense: expensesArray[0] || null
      })
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - server is not responding')), 30000)
      )
      
      const response = await Promise.race([
        aiAPI.chat(userMessage, expensesArray),
        timeoutPromise
      ])
      console.log('✅ Chat response received:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', response ? Object.keys(response) : 'null')
      console.log('Full response object:', JSON.stringify(response, null, 2))
      
      if (!response) {
        console.error('❌ No response object received')
        throw new Error('No response received from server')
      }
      
      // Handle both response formats: { response: "..." } or direct string
      let assistantMessage = ''
      if (typeof response === 'string') {
        console.log('📝 Response is a string')
        assistantMessage = response
      } else if (response && typeof response === 'object') {
        console.log('📦 Response is an object')
        if (response.response) {
          console.log('✓ Found response.response field')
          assistantMessage = response.response
        } else if (response.message) {
          console.log('✓ Found response.message field')
          assistantMessage = response.message
        } else {
          console.error('❌ Invalid response structure:', response)
          console.error('Available keys:', Object.keys(response))
          throw new Error('Invalid response format from server. Expected { response: "..." }')
        }
      } else {
        console.error('❌ Response is neither string nor object:', typeof response)
        throw new Error('Unexpected response type from server')
      }
      
      if (!assistantMessage || assistantMessage.trim() === '') {
        console.error('❌ Empty message in response:', response)
        throw new Error('Received empty response from server')
      }
      
      console.log('✅ Adding message to chat. Length:', assistantMessage.length)
      console.log('Message preview:', assistantMessage.substring(0, 100))
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: assistantMessage.trim() },
      ])
    } catch (error) {
      console.error('AI Chat Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
      
      let errorMessage = 'Unable to process your request.'
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Please log in again to use the AI assistant.'
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage = 'Chat endpoint not found. Please make sure the backend server is running.'
      } else if (error.message.includes('500') || error.message.includes('Internal Server')) {
        errorMessage = 'Server error occurred. Please try again later.'
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Unable to connect to the server. Please check your connection and ensure the backend is running on port 5000.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred. Please try again.'
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}\n\nPlease check:\n• Backend server is running on port 5000\n• You are logged in\n• Your internet connection is working`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    'What is my total spending?',
    'Show me spending by category',
    'What is my average expense?',
    'Give me budget tips',
  ]

  // Test connection on component mount
  useEffect(() => {
    if (isOpen) {
      console.log('AI Chat Assistant opened. Expenses available:', expenses?.length || 0)
    }
  }, [isOpen, expenses])

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-sky-600 shadow-lg shadow-sky-500/50 transition hover:from-sky-400 hover:to-sky-500 hover:shadow-xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 h-[500px] w-96 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-sky-600">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-slate-400">Ask me anything</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex h-[380px] flex-col overflow-y-auto p-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-800 px-4 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.1s' }}></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="border-t border-slate-800 p-3">
                <p className="mb-2 text-xs text-slate-400">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend({ preventDefault: () => {} }, q)}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-300 transition hover:border-sky-500 hover:bg-slate-800"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-slate-800 p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your expenses..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-white transition hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIChatAssistant





