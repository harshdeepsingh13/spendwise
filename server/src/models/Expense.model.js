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
    // Recurrence: a template has isRecurring=true + a frequency + nextRunAt (the next
    // occurrence to materialize). Generated occurrences have isRecurring=false and
    // recurringGroupId set to the template's _id.
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    interval: { type: Number, default: 1 },
    nextRunAt: { type: Date },
    recurrenceEndDate: { type: Date },
    recurringGroupId: { type: mongoose.Schema.Types.ObjectId, sparse: true }
  },
  { timestamps: true }
)

expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1, date: -1 })
// Efficiently find recurring templates that are due to generate occurrences
expenseSchema.index({ user: 1, isRecurring: 1, nextRunAt: 1 })
// Prevent duplicate generated occurrences (same series, same date) under concurrent
// generation. Partial (not sparse) so it only constrains generated occurrences and never
// blocks ordinary expenses that happen to share a date.
expenseSchema.index(
  { recurringGroupId: 1, date: 1 },
  { unique: true, partialFilterExpression: { recurringGroupId: { $exists: true } } }
)

export const Expense = mongoose.model('Expense', expenseSchema)

