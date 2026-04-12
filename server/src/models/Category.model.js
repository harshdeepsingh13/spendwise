import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
    name: { type: String, required: true },
    icon: String,
    color: String,
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
)

categorySchema.index({ user: 1, isDefault: 1 })

export const Category = mongoose.model('Category', categorySchema)
