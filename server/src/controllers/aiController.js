// AI Controller - Proxies requests to Python AI services
import { hybridCategorize, getAvailableCategories } from '../services/categorizationService.js'

const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000'

// Helper function to make requests to AI services
const aiRequest = async (endpoint, options = {}) => {
  const url = `${AI_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'AI service error' }))
    throw new Error(error.detail || error.message || 'AI service request failed')
  }

  return response.json()
}

// OCR endpoint - handles file upload and forwards to AI service
export const ocrExpense = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select an image file.' })
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid file type. Please upload an image file (jpg, png, etc.).' })
    }

    // Use form-data library for Node.js
    const FormData = (await import('form-data')).default
    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'receipt.jpg',
      contentType: req.file.mimetype,
    })

    const aiUrl = `${AI_BASE_URL}/ocr`
    console.log(`Forwarding OCR request to ${aiUrl}`)
    
    const aiResponse = await fetch(aiUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    })

    if (!aiResponse.ok) {
      let errorMessage = 'OCR service failed'
      try {
        const errorData = await aiResponse.json()
        errorMessage = errorData.detail || errorData.message || `OCR service returned ${aiResponse.status}`
      } catch (e) {
        errorMessage = `OCR service returned ${aiResponse.status}: ${aiResponse.statusText}`
      }
      
      // Provide helpful error messages
      if (aiResponse.status === 503 || aiResponse.status === 502 || aiResponse.status === 404) {
        errorMessage = 'OCR service is not available. Please make sure the AI service is running on port 8000.'
      }
      
      console.error('OCR Service Error:', errorMessage)
      return res.status(aiResponse.status).json({ message: errorMessage })
    }

    const data = await aiResponse.json()
    console.log('OCR Success:', { amount: data.amount, itemsCount: data.items?.length })
    res.json(data)
  } catch (error) {
    console.error('OCR Error:', error)
    
    // Provide more specific error messages
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return res.status(503).json({ 
        message: 'Cannot connect to OCR service. Please make sure the AI service is running on port 8000.' 
      })
    }
    
    res.status(500).json({ 
      message: error.message || 'OCR processing failed. Please try again or contact support.' 
    })
  }
}

// ML Service wrapper
const mlService = {
  categorize: async (title, description) => {
    try {
      const data = await aiRequest('/categorize', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      })
      return data
    } catch (error) {
      console.error('ML categorization failed:', error)
      return null
    }
  },
}

// Auto-categorize expense with hybrid approach
export const categorizeExpense = async (req, res) => {
  try {
    const { title, description = '' } = req.body
    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    // Use hybrid categorization
    const result = await hybridCategorize(title, description, mlService)

    res.json({
      category: result.category,
      confidence: result.confidence,
      method: result.method,
    })
  } catch (error) {
    console.error('Categorization Error:', error)
    res.status(500).json({ message: error.message || 'Categorization failed' })
  }
}

// Get spending prediction
export const predictSpending = async (req, res) => {
  try {
    const { history } = req.body
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ message: 'History array is required' })
    }

    const data = await aiRequest('/predict', {
      method: 'POST',
      body: JSON.stringify({ history }),
    })

    res.json(data)
  } catch (error) {
    console.error('Prediction Error:', error)
    res.status(500).json({ message: error.message || 'Prediction failed' })
  }
}

// Get AI insights based on expenses
export const getInsights = async (req, res) => {
  try {
    const { expenses } = req.body
    if (!expenses || !Array.isArray(expenses)) {
      return res.status(400).json({ message: 'Expenses array is required' })
    }

    if (expenses.length === 0) {
      return res.json({
        insights: [{
          id: 1,
          title: 'Start tracking your expenses',
          detail: 'Add your first expense to get personalized insights and recommendations.',
          impact: 'LOW',
          type: 'info',
          action: 'Add Expense',
        }],
        summary: {
          total: 0,
          average: 0,
          categoryCount: 0,
          topCategory: 'None',
        },
      })
    }

    // Parse dates and ensure expenses are valid
    const validExpenses = expenses
      .filter(e => e && e.date && e.amount !== undefined)
      .map(e => ({
        ...e,
        date: new Date(e.date),
        amount: parseFloat(e.amount) || 0,
        category: e.category || 'Uncategorized',
      }))
      .sort((a, b) => a.date - b.date)

    if (validExpenses.length === 0) {
      return res.status(400).json({ message: 'No valid expenses found' })
    }

    // Calculate basic metrics
    const total = validExpenses.reduce((sum, e) => sum + e.amount, 0)
    const avg = total / validExpenses.length
    const median = calculateMedian(validExpenses.map(e => e.amount))
    
    // Group by category
    const categoryTotals = {}
    const categoryCounts = {}
    const categoryAverages = {}
    validExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1
    })
    Object.keys(categoryTotals).forEach(cat => {
      categoryAverages[cat] = categoryTotals[cat] / categoryCounts[cat]
    })

    // Find top and bottom categories
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
    const topCategory = sortedCategories[0]?.[0] || 'None'
    const topCategoryAmount = sortedCategories[0]?.[1] || 0
    const bottomCategory = sortedCategories[sortedCategories.length - 1]?.[0] || 'None'

    // Monthly analysis
    const monthlyData = groupByMonth(validExpenses)
    const monthlyTotals = Object.values(monthlyData).map(month => 
      month.reduce((sum, e) => sum + e.amount, 0)
    )
    const monthlyTrend = calculateTrend(monthlyTotals)

    // Weekly analysis
    const weeklyData = groupByWeek(validExpenses)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const lastWeekExpenses = validExpenses.filter(e => e.date >= weekAgo)
    const lastWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0)
    const previousWeekTotal = validExpenses
      .filter(e => {
        const twoWeeksAgo = new Date(weekAgo)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7)
        return e.date >= twoWeeksAgo && e.date < weekAgo
      })
      .reduce((sum, e) => sum + e.amount, 0)

    // Day of week analysis
    const dayOfWeekData = groupByDayOfWeek(validExpenses)
    const mostSpendingDay = Object.entries(dayOfWeekData)
      .sort((a, b) => b[1] - a[1])[0]?.[0]

    // Find anomalies (expenses significantly higher than average)
    const standardDeviation = calculateStandardDeviation(validExpenses.map(e => e.amount))
    const anomalies = validExpenses.filter(e => e.amount > avg + (2 * standardDeviation))

    // Generate comprehensive insights
    const insights = []

    // Insight 1: Category concentration
    const topCategoryPercentage = (topCategoryAmount / total) * 100
    if (topCategoryPercentage > 40) {
      insights.push({
        id: 1,
        title: `High concentration in ${topCategory}`,
        detail: `${topCategoryPercentage.toFixed(1)}% of spending goes to ${topCategory} ($${topCategoryAmount.toFixed(2)}). Consider diversifying or reviewing if this aligns with your budget goals.`,
        impact: 'HIGH',
        type: 'warning',
        priority: 1,
        category: topCategory,
      })
    }

    // Insight 2: Monthly trend
    if (monthlyTotals.length >= 2) {
      const trendPercentage = Math.abs(monthlyTrend) * 100
      if (monthlyTrend > 0.15) {
        insights.push({
          id: 2,
          title: 'Rapid spending increase detected',
          detail: `Your monthly spending is increasing by ${trendPercentage.toFixed(1)}% per month. Consider reviewing your budget and identifying areas to cut back.`,
          impact: 'HIGH',
          type: 'warning',
          priority: 2,
        })
      } else if (monthlyTrend < -0.15) {
        insights.push({
          id: 2,
          title: 'Great spending reduction!',
          detail: `Your monthly spending has decreased by ${trendPercentage.toFixed(1)}% per month. Keep up the excellent financial discipline!`,
          impact: 'MEDIUM',
          type: 'success',
          priority: 5,
        })
      }
    }

    // Insight 3: Weekly comparison
    if (previousWeekTotal > 0) {
      const weekChange = ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
      if (Math.abs(weekChange) > 30) {
        insights.push({
          id: 3,
          title: weekChange > 0 ? 'Significant week-over-week increase' : 'Notable week-over-week decrease',
          detail: `Last week's spending was ${Math.abs(weekChange).toFixed(1)}% ${weekChange > 0 ? 'higher' : 'lower'} than the previous week ($${lastWeekTotal.toFixed(2)} vs $${previousWeekTotal.toFixed(2)}). ${weekChange > 0 ? 'Review recent expenses to identify the cause.' : 'Excellent progress!'}`,
          impact: weekChange > 0 ? 'HIGH' : 'MEDIUM',
          type: weekChange > 0 ? 'warning' : 'success',
          priority: weekChange > 0 ? 3 : 6,
        })
      }
    }

    // Insight 4: Spending patterns - day of week
    if (mostSpendingDay && dayOfWeekData[mostSpendingDay] > avg * 1.5) {
      insights.push({
        id: 4,
        title: `Higher spending on ${mostSpendingDay}s`,
        detail: `You tend to spend more on ${mostSpendingDay}s (avg $${dayOfWeekData[mostSpendingDay].toFixed(2)}). Plan ahead or set a daily limit for these days.`,
        impact: 'MEDIUM',
        type: 'info',
        priority: 7,
      })
    }

    // Insight 5: Average expense size
    if (avg > 100 && validExpenses.length > 10) {
      insights.push({
        id: 5,
        title: 'Above-average transaction size',
        detail: `Your average expense is $${avg.toFixed(2)} (median: $${median.toFixed(2)}). Consider breaking down larger purchases or reviewing if smaller frequent expenses are adding up.`,
        impact: 'MEDIUM',
        type: 'info',
        priority: 8,
      })
    }

    // Insight 6: Anomalies
    if (anomalies.length > 0) {
      const largestAnomaly = anomalies.sort((a, b) => b.amount - a.amount)[0]
      insights.push({
        id: 6,
        title: 'Unusual expense detected',
        detail: `${anomalies.length} expense${anomalies.length > 1 ? 's' : ''} significantly higher than average. Largest: "${largestAnomaly.title}" for $${largestAnomaly.amount.toFixed(2)}. Review if this was necessary or a one-time occurrence.`,
        impact: 'MEDIUM',
        type: 'warning',
        priority: 4,
      })
    }

    // Insight 7: Category balance
    if (Object.keys(categoryTotals).length >= 4) {
      const categoryBalance = calculateCategoryBalance(categoryTotals, total)
      if (categoryBalance > 0.7) {
        insights.push({
          id: 7,
          title: 'Well-balanced spending across categories',
          detail: `Great distribution across ${Object.keys(categoryTotals).length} categories. Your spending is well-diversified, which is a sign of good financial planning.`,
          impact: 'LOW',
          type: 'success',
          priority: 9,
        })
      }
    }

    // Insight 8: Savings opportunity
    if (topCategoryPercentage > 30 && categoryAverages[topCategory] > avg * 1.2) {
      const potentialSavings = categoryTotals[topCategory] * 0.1 // 10% reduction
      insights.push({
        id: 8,
        title: `Potential savings in ${topCategory}`,
        detail: `By reducing ${topCategory} spending by just 10%, you could save approximately $${potentialSavings.toFixed(2)}. Consider finding alternatives or better deals in this category.`,
        impact: 'MEDIUM',
        type: 'info',
        priority: 6,
        category: topCategory,
      })
    }

    // Insight 9: Frequency vs amount analysis
    const frequentExpenses = validExpenses.filter(e => e.amount < avg * 0.5)
    const frequentTotal = frequentExpenses.reduce((sum, e) => sum + e.amount, 0)
    if (frequentExpenses.length > validExpenses.length * 0.4 && frequentTotal > total * 0.3) {
      insights.push({
        id: 9,
        title: 'Small expenses adding up',
        detail: `${frequentExpenses.length} small expenses (under $${(avg * 0.5).toFixed(2)}) total $${frequentTotal.toFixed(2)}. These small purchases can accumulate quickly - track them closely.`,
        impact: 'MEDIUM',
        type: 'info',
        priority: 7,
      })
    }

    // Insight 10: Positive reinforcement
    if (monthlyTrend < 0 && topCategoryPercentage < 35 && validExpenses.length > 5) {
      insights.push({
        id: 10,
        title: 'Excellent financial management!',
        detail: `Your spending is trending downward with balanced category distribution. You're on track for great financial health!`,
        impact: 'LOW',
        type: 'success',
        priority: 10,
      })
    }

    // Sort insights by priority (lower number = higher priority)
    insights.sort((a, b) => (a.priority || 999) - (b.priority || 999))

    // Limit to top 6-8 most relevant insights
    const topInsights = insights.slice(0, 8)

    // Calculate summary statistics
    const summary = {
      total: parseFloat(total.toFixed(2)),
      average: parseFloat(avg.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      categoryCount: Object.keys(categoryTotals).length,
      topCategory,
      topCategoryAmount: parseFloat(topCategoryAmount.toFixed(2)),
      monthlyTrend: parseFloat((monthlyTrend * 100).toFixed(2)),
      expenseCount: validExpenses.length,
      lastWeekTotal: parseFloat(lastWeekTotal.toFixed(2)),
      mostSpendingDay,
    }

    res.json({
      insights: topInsights.length > 0 ? topInsights : [{
        id: 1,
        title: 'Keep tracking your expenses',
        detail: 'Continue adding expenses to get more personalized insights and recommendations.',
        impact: 'LOW',
        type: 'info',
        priority: 999,
      }],
      summary,
    })
  } catch (error) {
    console.error('Insights Error:', error)
    res.status(500).json({ message: error.message || 'Failed to generate insights' })
  }
}

// Helper functions
function calculateMedian(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function calculateStandardDeviation(numbers) {
  const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  const squareDiffs = numbers.map(n => Math.pow(n - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, n) => sum + n, 0) / numbers.length
  return Math.sqrt(avgSquareDiff)
}

function groupByMonth(expenses) {
  const grouped = {}
  expenses.forEach(expense => {
    const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[monthKey]) grouped[monthKey] = []
    grouped[monthKey].push(expense)
  })
  return grouped
}

function groupByWeek(expenses) {
  const grouped = {}
  expenses.forEach(expense => {
    const weekStart = new Date(expense.date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    if (!grouped[weekKey]) grouped[weekKey] = []
    grouped[weekKey].push(expense)
  })
  return grouped
}

function groupByDayOfWeek(expenses) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const totals = {}
  expenses.forEach(expense => {
    const dayName = dayNames[expense.date.getDay()]
    totals[dayName] = (totals[dayName] || 0) + expense.amount
  })
  return totals
}

function calculateTrend(values) {
  if (values.length < 2) return 0
  // Simple linear trend calculation
  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, idx) => sum + (idx * val), 0)
  const sumXX = values.reduce((sum, val, idx) => sum + (idx * idx), 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const avgY = sumY / n
  return avgY > 0 ? slope / avgY : 0 // Normalized trend
}

function calculateCategoryBalance(categoryTotals, total) {
  const categories = Object.values(categoryTotals)
  if (categories.length === 0) return 0
  
  // Calculate how evenly distributed categories are (1 = perfectly balanced, 0 = completely unbalanced)
  const avgCategorySize = total / categories.length
  const variance = categories.reduce((sum, val) => {
    const diff = val - avgCategorySize
    return sum + (diff * diff)
  }, 0) / categories.length
  const maxVariance = total * total // theoretical maximum
  
  return 1 - (variance / maxVariance)
}

// AI Chat assistant
export const chatWithAI = async (req, res) => {
  try {
    console.log('📨 Chat request received:', { 
      message: req.body?.message?.substring(0, 50) || 'NO MESSAGE', 
      expensesCount: req.body?.expenses?.length || 0,
      expensesType: Array.isArray(req.body?.expenses) ? 'array' : typeof req.body?.expenses,
      user: req.user?.email || 'unknown',
      bodyKeys: req.body ? Object.keys(req.body) : 'NO BODY',
      hasBody: !!req.body,
      bodyType: typeof req.body
    })

    const { message, expenses = [] } = req.body || {}
    
    // Validate request
    if (!req.body) {
      console.error('❌ No request body received')
      return res.status(400).json({ 
        message: 'Request body is required', 
        response: 'Please provide a message in your request.' 
      })
    }
    if (!message || !message.trim()) {
      console.error('❌ No message provided')
      return res.status(400).json({ 
        message: 'Message is required',
        response: 'Please provide a message to chat with me.'
      })
    }

    console.log('✅ Request validation passed')

    // Ensure expenses is an array
    const expensesArray = Array.isArray(expenses) ? expenses : []

    // Simple rule-based AI chat (can be replaced with actual LLM)
    const lowerMessage = message.toLowerCase().trim()
    let response = ''

    // Total spending queries
    if (lowerMessage.includes('total') || lowerMessage.includes('spent') || lowerMessage.includes('spending')) {
      const total = expensesArray.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
      if (expensesArray.length === 0) {
        response = "You haven't recorded any expenses yet. Start tracking your expenses to see your total spending!"
      } else {
        response = `You have spent a total of $${total.toFixed(2)} across ${expensesArray.length} expense${expensesArray.length === 1 ? '' : 's'}.`
      }
    } 
    // Category queries
    else if (lowerMessage.includes('category') || lowerMessage.includes('categories') || lowerMessage.includes('breakdown')) {
      if (expensesArray.length === 0) {
        response = "You don't have any expenses yet to analyze by category."
      } else {
        const categoryTotals = {}
        expensesArray.forEach((e) => {
          const cat = e.category || 'Uncategorized'
          categoryTotals[cat] = (categoryTotals[cat] || 0) + (parseFloat(e.amount) || 0)
        })
        const categories = Object.keys(categoryTotals)
        const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
        
        if (categories.length === 0) {
          response = "I couldn't find any categorized expenses."
        } else {
          response = `You have expenses in ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}: ${categories.join(', ')}.`
          if (topCategory) {
            response += ` Your top spending category is ${topCategory[0]} with $${topCategory[1].toFixed(2)}.`
          }
        }
      }
    } 
    // Average queries
    else if (lowerMessage.includes('average') || lowerMessage.includes('avg') || lowerMessage.includes('mean')) {
      if (expensesArray.length === 0) {
        response = "You don't have any expenses yet to calculate an average."
      } else {
        const total = expensesArray.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        const avg = total / expensesArray.length
        response = `Your average expense is $${avg.toFixed(2)} based on ${expensesArray.length} expense${expensesArray.length === 1 ? '' : 's'}.`
      }
    }
    // Budget tips
    else if (lowerMessage.includes('budget') || lowerMessage.includes('tip') || lowerMessage.includes('recommendation') || lowerMessage.includes('advice')) {
      if (expensesArray.length === 0) {
        response = "Start tracking your expenses first, then I can provide personalized budget tips!"
      } else {
        const total = expensesArray.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        const avg = total / expensesArray.length
        response = `Here are some budget tips based on your spending:\n\n`
        response += `1. Your average expense is $${avg.toFixed(2)}. Try to keep individual expenses under this amount when possible.\n`
        response += `2. Track your expenses regularly to spot trends early.\n`
        response += `3. Review your expenses weekly to identify unnecessary spending.\n`
        response += `4. Set a monthly budget goal and track your progress.`
      }
    }
    // Help queries
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('what do you do')) {
      response = `I'm your AI expense assistant! I can help you with:\n\n`
      response += `• Total spending - Ask "What is my total spending?"\n`
      response += `• Category breakdown - Ask "Show me spending by category"\n`
      response += `• Average expenses - Ask "What is my average expense?"\n`
      response += `• Budget tips - Ask "Give me budget tips"\n`
      response += `• Spending trends and insights\n\n`
      response += `Just ask me anything about your expenses!`
    }
    // Trend queries
    else if (lowerMessage.includes('trend') || lowerMessage.includes('pattern') || lowerMessage.includes('recent')) {
      if (expensesArray.length === 0) {
        response = "You don't have enough expenses yet to identify trends."
      } else {
        const recentExpenses = expensesArray
          .filter((e) => {
            const expenseDate = new Date(e.date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return expenseDate >= weekAgo
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        const total = expensesArray.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        
        if (recentExpenses > 0) {
          const percentage = (recentExpenses / total) * 100
          response = `In the last 7 days, you've spent $${recentExpenses.toFixed(2)}, which is ${percentage.toFixed(1)}% of your total spending.`
        } else {
          response = "You haven't had any expenses in the last week. Great job staying within budget!"
        }
      }
    }
    // Default response
    else {
      if (expensesArray.length === 0) {
        response = `I understand you're asking about "${message}". However, you haven't recorded any expenses yet. Start by adding some expenses, and then I can help you analyze your spending patterns!`
      } else {
        response = `I understand you're asking about "${message}". Based on your ${expensesArray.length} expense${expensesArray.length === 1 ? '' : 's'}, I can help you with:\n\n`
        response += `• Your total spending\n`
        response += `• Spending by category\n`
        response += `• Average expenses\n`
        response += `• Budget recommendations\n`
        response += `• Spending trends\n\n`
        response += `Try asking something specific about your expenses!`
      }
    }

    // Ensure response is set
    if (!response || response.trim() === '') {
      response = `I'm here to help with your expense questions! Try asking about your total spending, categories, or budget tips.`
    }

    console.log('📊 Chat Response Generated:', { 
      message: message.substring(0, 50), 
      responseLength: response.length, 
      expensesCount: expensesArray.length,
      responsePreview: response.substring(0, 100)
    })
    
    const responseData = { response: response.trim() }
    console.log('📤 Sending response data:', {
      hasResponseField: !!responseData.response,
      responseLength: responseData.response.length,
      responseType: typeof responseData.response,
      fullData: JSON.stringify(responseData).substring(0, 200)
    })
    res.json(responseData)
    console.log('✅ Response sent successfully')
  } catch (error) {
    console.error('❌ Chat Error:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      message: error.message || 'Chat failed',
      response: 'I apologize, but I encountered an error processing your request. Please try again.'
    })
  }
}

