import { describe, it, expect } from 'vitest'
import { navItems } from './navItems.js'

describe('navItems', () => {
  it('exports an array with five items', () => {
    expect(Array.isArray(navItems)).toBe(true)
    expect(navItems).toHaveLength(5)
  })

  it('every item has path, label, and icon fields', () => {
    for (const item of navItems) {
      expect(item).toHaveProperty('path')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('icon')
    }
  })

  it('has correct paths in order', () => {
    expect(navItems.map((n) => n.path)).toEqual(['/dashboard', '/expenses', '/analytics', '/receipts', '/categories'])
  })

  it('has correct labels in order', () => {
    expect(navItems.map((n) => n.label)).toEqual(['Dashboard', 'Expenses', 'Analytics', 'Receipts', 'Categories'])
  })

  it('each icon is a valid React component (function or class)', () => {
    for (const item of navItems) {
      expect(typeof item.icon === 'function' || typeof item.icon === 'object').toBe(true)
      expect(item.icon).toBeTruthy()
    }
  })

  it('all paths start with /', () => {
    for (const item of navItems) {
      expect(item.path.startsWith('/')).toBe(true)
    }
  })
})
