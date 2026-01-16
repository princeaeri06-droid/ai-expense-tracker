import { Router } from 'express'
import multer from 'multer'
import auth from '../middleware/auth.js'
import {
  ocrExpense,
  categorizeExpense,
  predictSpending,
  getInsights,
  chatWithAI,
} from '../controllers/aiController.js'

const router = Router()

// Configure multer for file uploads (in-memory storage)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

// All AI routes require authentication
router.use(auth)

// OCR endpoint - upload receipt image
router.post('/ocr', upload.single('file'), ocrExpense)

// Auto-categorize expense
router.post('/categorize', categorizeExpense)

// Get spending prediction
router.post('/predict', predictSpending)

// Get AI insights
router.post('/insights', getInsights)

// Chat with AI assistant
router.post('/chat', chatWithAI)

export default router













