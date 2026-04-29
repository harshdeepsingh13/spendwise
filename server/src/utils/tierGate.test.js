import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { assertHistoryAccess, assertPro } from './tierGate.js'

const NOW = new Date('2026-05-03T12:00:00Z')

// Derive the boundary the same way the source does (setMonth uses local time).
function getThreeMonthsAgoBoundary() {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return d
}

describe('assertHistoryAccess', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows pro user to access any historical date', () => {
    const user = { tier: 'pro' }
    expect(() => assertHistoryAccess(user, new Date('2020-01-01'))).not.toThrow()
  })

  it('allows free user to access date within 3 months', () => {
    const user = { tier: 'free' }
    // 6 weeks ago is safely inside the window
    const withinWindow = new Date(NOW.getTime() - 6 * 7 * 24 * 60 * 60 * 1000)
    expect(() => assertHistoryAccess(user, withinWindow)).not.toThrow()
  })

  it('does not throw when requestedStart equals the 3-month boundary (exclusive boundary)', () => {
    const user = { tier: 'free' }
    // Use the same computation as the source so local-timezone differences cancel out
    const boundary = getThreeMonthsAgoBoundary()
    expect(() => assertHistoryAccess(user, boundary)).not.toThrow()
  })

  it('throws 402 when free user requests date 1ms before the 3-month boundary', () => {
    const user = { tier: 'free' }
    const justBefore = new Date(getThreeMonthsAgoBoundary().getTime() - 1)
    expect(() => assertHistoryAccess(user, justBefore)).toThrowError(
      expect.objectContaining({ status: 402 })
    )
  })

  it('throws 402 for free user accessing history well beyond 3 months', () => {
    const user = { tier: 'free' }
    const oldDate = new Date('2025-01-01')
    let thrown
    try {
      assertHistoryAccess(user, oldDate)
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeDefined()
    expect(thrown.status).toBe(402)
    expect(thrown.message).toMatch(/3 months/)
    expect(thrown.message).toMatch(/Pro/)
  })

  it('throws for user with no tier (defaults to non-pro)', () => {
    const user = {}
    expect(() => assertHistoryAccess(user, new Date('2025-01-01'))).toThrow()
  })
})

describe('assertPro', () => {
  it('allows pro user through without throwing', () => {
    const user = { tier: 'pro' }
    expect(() => assertPro(user, 'Advanced Analytics')).not.toThrow()
  })

  it('throws for free user', () => {
    const user = { tier: 'free' }
    expect(() => assertPro(user, 'Advanced Analytics')).toThrow()
  })

  it('throws error with status 402 for non-pro user', () => {
    const user = { tier: 'free' }
    let thrown
    try {
      assertPro(user, 'CSV Export')
    } catch (err) {
      thrown = err
    }
    expect(thrown.status).toBe(402)
  })

  it('includes the feature name in the thrown error message', () => {
    const user = { tier: 'free' }
    expect(() => assertPro(user, 'CSV Export')).toThrow('CSV Export')
  })

  it('includes "Pro subscription" in the error message', () => {
    const user = { tier: 'free' }
    expect(() => assertPro(user, 'CSV Export')).toThrow(/Pro subscription/)
  })

  it('throws for user with no tier (defaults to non-pro)', () => {
    const user = {}
    expect(() => assertPro(user, 'Feature')).toThrow()
  })
})
