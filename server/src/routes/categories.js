import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  storeCorrection,
  getTrainingData,
  retrainModel,
  getCategories,
  bulkCategorize,
} from '../controllers/categoryController.js'

const router = Router()

// All category routes require authentication
router.use(auth)

// Store category correction
router.post('/correction', storeCorrection)

// Get training data
router.get('/training-data', getTrainingData)

// Retrain model
router.post('/retrain', retrainModel)

// Get available categories
router.get('/categories', getCategories)

// Bulk categorize expenses
router.post('/bulk-categorize', bulkCategorize)

export default router









