import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    displayName: String,
    avatarUrl: String,
    password: String,
    googleId: { type: String, index: true, sparse: true },
    mfaEnabled:    { type: Boolean, default: false },
    mfaTempSecret: { type: String, select: false },
    mfaSecret:     { type: String, select: false },
    refreshToken:  { type: String, select: false },
    tier: { type: String, enum: ['free', 'pro'], default: 'free' },
    timezone: { type: String, default: 'UTC' },
    baseCurrency: { type: String, default: 'USD' },
    notificationPrefs: {
      budgetAlerts: {
        enabled: { type: Boolean, default: false },
        threshold: { type: Number, default: 80 }
      },
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false }
    },
    stripeCustomerId: { type: String, sparse: true }
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

export const User = mongoose.model('User', userSchema)
