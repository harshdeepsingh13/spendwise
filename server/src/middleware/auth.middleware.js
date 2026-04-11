import jwt from 'jsonwebtoken'
import { User } from '../models/User.model.js'
import { env } from '../config/env.js'

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const payload = jwt.verify(token, env.JWT_SECRET)
    if (payload.type === 'mfa_challenge') {
      return res.status(401).json({ error: 'MFA verification required' })
    }
    const user = await User.findById(payload.sub).select('-password')
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
