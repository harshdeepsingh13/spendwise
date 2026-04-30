// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useCvReady', () => {
  let useCvReady
  let mockScript

  beforeEach(async () => {
    delete window.cv
    vi.useFakeTimers()

    // Intercept script element creation so we can fire onload manually
    mockScript = { src: '', async: false, onload: null }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'script') return mockScript
      return originalCreateElement(tag)
    })
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => {})

    // Reset module cache to clear the scriptPromise singleton between tests
    vi.resetModules()
    const mod = await import('./useCvReady')
    useCvReady = mod.useCvReady
  })

  afterEach(() => {
    delete window.cv
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns false initially when cv is not loaded', () => {
    const { result } = renderHook(() => useCvReady())
    expect(result.current).toBe(false)
  })

  it('returns true immediately when window.cv.Mat is already present', () => {
    window.cv = { Mat: {} }
    const { result } = renderHook(() => useCvReady())
    expect(result.current).toBe(true)
  })

  it('resolves when cv.Mat is present at script load time', async () => {
    const { result } = renderHook(() => useCvReady())
    expect(result.current).toBe(false)

    await act(async () => {
      window.cv = { Mat: {} }
      mockScript.onload()
    })

    expect(result.current).toBe(true)
  })

  it('registers onRuntimeInitialized when cv exists without Mat at script load', async () => {
    window.cv = {}
    const { result } = renderHook(() => useCvReady())
    expect(result.current).toBe(false)

    act(() => {
      mockScript.onload()
    })

    expect(typeof window.cv.onRuntimeInitialized).toBe('function')

    await act(async () => {
      window.cv.onRuntimeInitialized()
    })

    expect(result.current).toBe(true)
  })

  it('sets ready via polling when cv.Mat appears after script loads', async () => {
    const { result } = renderHook(() => useCvReady())
    expect(result.current).toBe(false)

    act(() => {
      mockScript.onload()
    })

    await act(async () => {
      window.cv = { Mat: {} }
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe(true)
  })

  it('registers onRuntimeInitialized via polling when cv appears without Mat after script load', async () => {
    const { result } = renderHook(() => useCvReady())
    expect(result.current).toBe(false)

    act(() => {
      mockScript.onload()
    })

    act(() => {
      window.cv = {}
      vi.advanceTimersByTime(200)
    })

    expect(typeof window.cv.onRuntimeInitialized).toBe('function')

    await act(async () => {
      window.cv.onRuntimeInitialized()
    })

    expect(result.current).toBe(true)
  })

  it('clears the polling interval once cv.Mat is found', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { result } = renderHook(() => useCvReady())

    act(() => {
      mockScript.onload()
    })

    await act(async () => {
      window.cv = { Mat: {} }
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe(true)
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('does not keep polling after cv.Mat is found', async () => {
    const { result } = renderHook(() => useCvReady())

    act(() => {
      mockScript.onload()
    })

    await act(async () => {
      window.cv = { Mat: {} }
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(true)
  })
})
