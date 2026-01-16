import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    predictedCategory: {
      type: String,
      trim: true,
    },
    predictedConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    categoryMethod: {
      type: String,
      enum: ['ml', 'rule', 'hybrid', 'manual'],
      default: 'manual',
    },
    isCorrected: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const Expense = mongoose.model('Expense', expenseSchema)

export default Expense






