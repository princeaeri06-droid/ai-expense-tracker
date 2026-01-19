
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import connectDB from './config/db.js'
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import expenseRoutes from './routes/expenses.js'
import aiRoutes from './routes/ai.js'
import categoryRoutes from './routes/categories.js'
import auth from './middleware/auth.js'
import { authLimiter, apiLimiter, aiLimiter } from './middleware/rateLimiter.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'

// Security: CORS configuration
const corsOptions = {
  origin: isProduction 
    ? (process.env.FRONTEND_URL || 'https://ai-expense-tracker-three.vercel.app').trim()
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Security: Request size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
app.use(morgan(isProduction ? 'combined' : 'dev'))

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false
}))

// Prevent NoSQL injection
app.use(mongoSanitize())

// Prevent XSS attacks
app.use(xss())

// Routes with rate limiting
app.use('/api', apiLimiter, healthRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api', apiLimiter, expenseRoutes)
app.use('/api/ai', aiLimiter, aiRoutes)
app.use('/api/categories', apiLimiter, categoryRoutes)

app.get('/api/secure/ping', auth, (req, res) => {
  res.json({
    message: 'Secure data retrieved successfully.',
    user: req.user,
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the AI Expense Tracker API',
    docs: '/api/health',
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔴 Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  })
})

const startServer = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Server failed to start:', error.message)
})

