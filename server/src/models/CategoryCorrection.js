import mongoose from 'mongoose'

const categoryCorrectionSchema = new mongoose.Schema(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalTitle: {
      type: String,
      required: true,
    },
    originalDescription: {
      type: String,
      default: '',
    },
    predictedCategory: {
      type: String,
      required: true,
    },
    predictedConfidence: {
      type: Number,
      default: 0,
    },
    correctedCategory: {
      type: String,
      required: true,
    },
    correctionSource: {
      type: String,
      enum: ['ml', 'rule', 'manual'],
      default: 'ml',
    },
    method: {
      type: String,
      enum: ['ml', 'rule', 'hybrid'],
      default: 'ml',
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient querying
categoryCorrectionSchema.index({ userId: 1, createdAt: -1 })
categoryCorrectionSchema.index({ expenseId: 1 })

const CategoryCorrection = mongoose.model('CategoryCorrection', categoryCorrectionSchema)

export default CategoryCorrection









