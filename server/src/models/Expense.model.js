import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: mongoose.Decimal128, required: true },
    currency: { type: String, default: 'USD' },
    date: { type: Date, required: true },
    notes: String,
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
    isRecurring: { type: Boolean, default: false },
    recurringGroupId: { type: mongoose.Schema.Types.ObjectId, sparse: true }
  },
  { timestamps: true }
)

expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1, date: -1 })

export const Expense = mongoose.model('Expense', expenseSchema)

