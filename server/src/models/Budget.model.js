import mongoose from 'mongoose'

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: mongoose.Decimal128, required: true },
    period: { type: String, enum: ['monthly'], default: 'monthly' },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    currency: { type: String, default: 'USD' }
  },
  { timestamps: true }
)

budgetSchema.index({ user: 1, category: 1 })
budgetSchema.index({ user: 1, effectiveFrom: -1 })

export const Budget = mongoose.model('Budget', budgetSchema)
