import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
} from '../controllers/expenseController.js'

const router = Router()

router.use(auth)

router.post('/add-expense', addExpense)
router.get('/expenses', getExpenses)
router.delete('/expense/:id', deleteExpense)
router.patch('/expense/:id', updateExpense)

export default router






