import mongoose from 'mongoose'

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-expense-tracker'
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('📦 MongoDB connected')
  } catch (error) {
    console.error('Mongo connection error:', error.message)
    process.exit(1)
  }
}

export default connectDB




