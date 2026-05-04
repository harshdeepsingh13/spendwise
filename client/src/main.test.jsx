import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'

describe('main.jsx bootstrap', () => {
  let rootEl
  let mockRender
  let mockCreateRoot

  beforeEach(() => {
    vi.resetModules()

    rootEl = document.createElement('div')
    rootEl.id = 'root'
    document.body.appendChild(rootEl)

    mockRender = vi.fn()
    mockCreateRoot = vi.fn(() => ({ render: mockRender }))

    vi.doMock('react-dom/client', () => ({
      default: { createRoot: mockCreateRoot },
      createRoot: mockCreateRoot,
    }))

    vi.doMock('./App', () => ({
      default: () => React.createElement('div', null, 'App'),
    }))

    vi.doMock('./context/AuthContext', () => ({
      AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    }))

    vi.doMock('./lib/queryClient', () => ({ queryClient: {} }))

    vi.doMock('./theme/theme', () => ({ theme: {} }))
  })

  afterEach(() => {
    document.body.removeChild(rootEl)
    vi.clearAllMocks()
  })

  it('calls ReactDOM.createRoot with the #root DOM element', async () => {
    await import('./main.jsx')
    expect(mockCreateRoot).toHaveBeenCalledOnce()
    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'))
  })

  it('calls render exactly once after createRoot', async () => {
    await import('./main.jsx')
    expect(mockRender).toHaveBeenCalledOnce()
  })

  it('wraps the app in React.StrictMode', async () => {
    let renderedTree = null
    mockRender.mockImplementation((element) => {
      renderedTree = element
    })
    await import('./main.jsx')
    expect(renderedTree).not.toBeNull()
    expect(renderedTree.type).toBe(React.StrictMode)
  })
})
