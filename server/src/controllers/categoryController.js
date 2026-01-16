import CategoryCorrection from '../models/CategoryCorrection.js'
import Expense from '../models/Expense.js'
import { hybridCategorize, getAvailableCategories } from '../services/categorizationService.js'

// ML Service wrapper
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000'

const mlService = {
  categorize: async (title, description) => {
    try {
      const response = await fetch(`${AI_BASE_URL}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error('ML categorization failed:', error)
      return null
    }
  },
}

/**
 * Store a category correction from user
 */
export const storeCorrection = async (req, res) => {
  try {
    const { expenseId, correctedCategory } = req.body
    const userId = req.user._id

    if (!expenseId || !correctedCategory) {
      return res.status(400).json({ message: 'Expense ID and corrected category are required' })
    }

    // Find the expense
    const expense = await Expense.findOne({ _id: expenseId, userId })
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' })
    }

    // Create correction record
    const correction = new CategoryCorrection({
      expenseId: expense._id,
      userId,
      originalTitle: expense.title,
      originalDescription: expense.description || '',
      predictedCategory: expense.predictedCategory || expense.category,
      predictedConfidence: expense.predictedConfidence || 0,
      correctedCategory,
      correctionSource: expense.categoryMethod || 'ml',
      method: expense.categoryMethod || 'ml',
    })

    await correction.save()

    // Update expense with correction
    expense.category = correctedCategory
    expense.isCorrected = true
    if (!expense.predictedCategory) {
      expense.predictedCategory = expense.category
    }
    await expense.save()

    res.json({
      message: 'Correction stored successfully',
      correction: {
        id: correction._id,
        originalCategory: correction.predictedCategory,
        correctedCategory: correction.correctedCategory,
      },
    })
  } catch (error) {
    console.error('Store correction error:', error)
    res.status(500).json({ message: error.message || 'Failed to store correction' })
  }
}

/**
 * Get training data from user corrections
 */
export const getTrainingData = async (req, res) => {
  try {
    const userId = req.user._id
    const { limit = 100 } = req.query

    const corrections = await CategoryCorrection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('expenseId', 'title description')

    const trainingData = corrections.map((correction) => ({
      title: correction.originalTitle,
      description: correction.originalDescription,
      category: correction.correctedCategory,
    }))

    res.json({
      count: trainingData.length,
      data: trainingData,
    })
  } catch (error) {
    console.error('Get training data error:', error)
    res.status(500).json({ message: error.message || 'Failed to get training data' })
  }
}

/**
 * Retrain the ML model with new corrections
 */
export const retrainModel = async (req, res) => {
  try {
    const userId = req.user._id
    const { force = false } = req.query

    // Get all corrections for this user
    const corrections = await CategoryCorrection.find({ userId })
      .sort({ createdAt: -1 })

    if (corrections.length < 5 && !force) {
      return res.status(400).json({
        message: 'Need at least 5 corrections to retrain the model',
        currentCount: corrections.length,
      })
    }

    // Prepare training data
    const trainingData = corrections.map((correction) => ({
      title: correction.originalTitle,
      description: correction.originalDescription || '',
      category: correction.correctedCategory,
    }))

    // Send to AI service for retraining
    try {
      const response = await fetch(`${AI_BASE_URL}/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_data: trainingData,
          user_id: userId.toString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Retraining service unavailable')
      }

      const result = await response.json()

      res.json({
        message: 'Model retrained successfully',
        trainingSamples: trainingData.length,
        result,
      })
    } catch (error) {
      console.error('Retrain service error:', error)
      // Return success anyway - training data is stored for future use
      res.json({
        message: 'Training data prepared. AI service will retrain when available.',
        trainingSamples: trainingData.length,
        note: 'The AI service retrain endpoint may not be available yet. Data is stored for future retraining.',
      })
    }
  } catch (error) {
    console.error('Retrain error:', error)
    res.status(500).json({ message: error.message || 'Failed to retrain model' })
  }
}

/**
 * Get available categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = getAvailableCategories()
    res.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: error.message || 'Failed to get categories' })
  }
}

/**
 * Bulk categorize expenses
 */
export const bulkCategorize = async (req, res) => {
  try {
    const { expenses } = req.body
    const userId = req.user._id

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: 'Expenses array is required' })
    }

    const results = await Promise.all(
      expenses.map(async (expense) => {
        const result = await hybridCategorize(
          expense.title || '',
          expense.description || '',
          mlService
        )
        return {
          id: expense.id || expense._id,
          title: expense.title,
          category: result.category,
          confidence: result.confidence,
          method: result.method,
        }
      })
    )

    res.json({
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('Bulk categorize error:', error)
    res.status(500).json({ message: error.message || 'Failed to categorize expenses' })
  }
}









