import { Category } from '../models/Category.model.js'

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining',    icon: '🍽️',  color: '#F97316' },
  { name: 'Transportation',   icon: '🚗',   color: '#3B82F6' },
  { name: 'Housing',          icon: '🏠',   color: '#8B5CF6' },
  { name: 'Shopping',         icon: '🛍️',  color: '#EC4899' },
  { name: 'Entertainment',    icon: '🎬',   color: '#F59E0B' },
  { name: 'Health & Medical', icon: '💊',   color: '#10B981' },
  { name: 'Travel',           icon: '✈️',   color: '#06B6D4' },
  { name: 'Education',        icon: '📚',   color: '#6366F1' },
  { name: 'Utilities',        icon: '⚡',   color: '#84CC16' },
  { name: 'Other',            icon: '📦',   color: '#94A3B8' },
]

export async function seedDefaultCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { name: cat.name, isDefault: true },
      { $setOnInsert: { ...cat, isDefault: true } },
      { upsert: true }
    )
  }
}
