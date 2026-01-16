import Expense from '../models/Expense.js'
import { hybridCategorize } from '../services/categorizationService.js'
import CategoryCorrection from '../models/CategoryCorrection.js'

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

export const addExpense = async (req, res) => {
  const { title, amount, category, date, description } = req.body

  if (!title || amount === undefined || !date) {
    return res.status(400).json({
      message: 'Title, amount, and date are required.',
    })
  }

  // Auto-categorize if category not provided
  let finalCategory = category
  let predictedCategory = null
  let predictedConfidence = null
  let categoryMethod = 'manual'

  if (!category || category === 'general' || category === '') {
    try {
      const categorization = await hybridCategorize(title, description || '', mlService)
      finalCategory = categorization.category
      predictedCategory = categorization.category
      predictedConfidence = categorization.confidence
      categoryMethod = categorization.method
    } catch (error) {
      console.error('Auto-categorization error:', error)
      finalCategory = category || 'general'
    }
  }

  const expense = await Expense.create({
    title,
    amount,
    category: finalCategory,
    date,
    description,
    userId: req.user.id,
    predictedCategory,
    predictedConfidence,
    categoryMethod,
  })

  return res.status(201).json(expense)
}

export const getExpenses = async (req, res) => {
  const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 })
  return res.json(expenses)
}

export const deleteExpense = async (req, res) => {
  const { id } = req.params
  const expense = await Expense.findOneAndDelete({ _id: id, userId: req.user.id })
  if (!expense) {
    return res.status(404).json({ message: 'Expense not found.' })
  }

  return res.json({ message: 'Expense deleted.' })
}

export const updateExpense = async (req, res) => {
  const { id } = req.params
  const updates = req.body

  if (updates.amount !== undefined && updates.amount < 0) {
    return res.status(400).json({ message: 'Amount must be positive.' })
  }

  // Check if category is being corrected
  const expense = await Expense.findOne({ _id: id, userId: req.user.id })
  if (!expense) {
    return res.status(404).json({ message: 'Expense not found.' })
  }

  // If category is being changed and it's different from predicted, store correction
  if (updates.category && updates.category !== expense.category) {
    const oldCategory = expense.predictedCategory || expense.category
    if (oldCategory !== updates.category) {
      try {
        // Check if correction already exists
        const existingCorrection = await CategoryCorrection.findOne({ expenseId: expense._id })
        
        if (!existingCorrection) {
          // Store the correction
          await CategoryCorrection.create({
            expenseId: expense._id,
            userId: req.user.id,
            originalTitle: expense.title,
            originalDescription: expense.description || '',
            predictedCategory: expense.predictedCategory || expense.category,
            predictedConfidence: expense.predictedConfidence || 0,
            correctedCategory: updates.category,
            correctionSource: expense.categoryMethod || 'ml',
            method: expense.categoryMethod || 'ml',
          })
        } else {
          // Update existing correction
          existingCorrection.correctedCategory = updates.category
          await existingCorrection.save()
        }

        // Mark expense as corrected
        updates.isCorrected = true
      } catch (error) {
        console.error('Error storing correction:', error)
        // Continue with update even if correction storage fails
      }
    }
  }

  const updatedExpense = await Expense.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    updates,
    { new: true },
  )

  return res.json(updatedExpense)
}






