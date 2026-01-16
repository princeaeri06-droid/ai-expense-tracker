// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// Set auth token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token)
}

// Remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem('authToken')
}

// Make API request with authentication
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    // Check if response has content
    const contentType = response.headers.get('content-type')
    let data
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `API request failed: ${response.status} ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    // Re-throw with a more helpful message if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please make sure the backend is running.')
    }
    throw error
  }
}

// Auth API calls
export const authAPI = {
  signup: async (name, email, password) => {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    if (data.token) {
      setAuthToken(data.token)
    }
    return data
  },

  login: async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data.token) {
      setAuthToken(data.token)
    }
    return data
  },

  logout: () => {
    removeAuthToken()
  },

  getCurrentUser: async () => {
    return apiRequest('/api/auth/me')
  },
}

// Expense API calls
export const expenseAPI = {
  getAll: async () => {
    return apiRequest('/api/expenses')
  },

  add: async (expenseData) => {
    return apiRequest('/api/add-expense', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    })
  },

  update: async (id, expenseData) => {
    return apiRequest(`/api/expense/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expenseData),
    })
  },

  delete: async (id) => {
    return apiRequest(`/api/expense/${id}`, {
      method: 'DELETE',
    })
  },
}

// Health check
export const healthCheck = async () => {
  return apiRequest('/api/health')
}

// AI API calls - these will be proxied through the Express backend
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000'

// Direct AI service calls (if CORS is enabled)
const aiRequest = async (endpoint, options = {}) => {
  const url = `${AI_BASE_URL}${endpoint}`
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'AI service request failed')
    }
    return data
  } catch (error) {
    console.error('AI Service Error:', error)
    throw error
  }
}

// AI API calls (proxied through Express backend)
export const aiAPI = {
  // OCR - upload receipt image
  ocr: async (file) => {
    if (!file) {
      throw new Error('No file selected')
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file (jpg, png, etc.)')
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size too large. Please select an image smaller than 10MB.')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    const token = getAuthToken()
    const url = `${API_BASE_URL}/api/ai/ocr`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      })
      
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || `Server returned ${response.status}: ${response.statusText}`)
      }
      
      if (!response.ok) {
        throw new Error(data.message || `OCR failed: ${response.status} ${response.statusText}`)
      }
      
      return data
    } catch (error) {
      // Provide more helpful error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please make sure the backend is running.')
      }
      throw error
    }
  },

  // Auto-categorize expense
  categorize: async (title, description = '') => {
    return apiRequest('/api/ai/categorize', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    })
  },

  // Get spending prediction
  predict: async (history) => {
    return apiRequest('/api/ai/predict', {
      method: 'POST',
      body: JSON.stringify({ history }),
    })
  },

  // Get AI insights and recommendations
  getInsights: async (expenses) => {
    return apiRequest('/api/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ expenses }),
    })
  },

  // Chat with AI assistant
  chat: async (message, expenses = []) => {
    return apiRequest('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, expenses }),
    })
  },
}

// Category API calls
export const categoryAPI = {
  // Store category correction
  storeCorrection: async (expenseId, correctedCategory) => {
    return apiRequest('/api/categories/correction', {
      method: 'POST',
      body: JSON.stringify({ expenseId, correctedCategory }),
    })
  },

  // Get training data
  getTrainingData: async (limit = 100) => {
    return apiRequest(`/api/categories/training-data?limit=${limit}`)
  },

  // Retrain model
  retrainModel: async (force = false) => {
    return apiRequest(`/api/categories/retrain?force=${force}`, {
      method: 'POST',
    })
  },  // Get available categories
  getCategories: async () => {
    return apiRequest('/api/categories/categories')
  },  // Bulk categorize expenses
  bulkCategorize: async (expenses) => {
    return apiRequest('/api/categories/bulk-categorize', {
      method: 'POST',
      body: JSON.stringify({ expenses }),
    })
  },
}
