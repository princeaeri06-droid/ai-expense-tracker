import { Router } from 'express'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    service: 'expense-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

export default router






