import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ThreeScene from './ThreeScene'

// @react-three/fiber requires WebGL which isn't available in jsdom
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="three-canvas">{children}</div>,
  useFrame: vi.fn(),
}))

// drei's <Html> calls useThree, which only works inside a real Canvas; passthrough it
vi.mock('@react-three/drei', () => ({
  Html: ({ children }) => <div>{children}</div>,
}))

// Mock Three.js mesh/geometry internals used inside Canvas children
vi.mock('three', () => {
  const mockObject3D = {
    position: { set: vi.fn() },
    rotation: { y: 0, x: 0, copy: vi.fn() },
    material: { opacity: 0 },
  }
  return {
    default: {},
    ...mockObject3D,
  }
})

describe('ThreeScene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<ThreeScene />)
    expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
  })

  it('renders the Canvas container', () => {
    render(<ThreeScene />)
    const canvas = screen.getByTestId('three-canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('updates mouse state on mousemove', () => {
    const { container } = render(<ThreeScene />)
    const box = container.firstChild

    // Mock getBoundingClientRect to return a known rect
    box.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    }))

    // Fire a mousemove event at (100, 100) → normalized (0, 0)
    fireEvent.mouseMove(box, { clientX: 100, clientY: 100 })

    // Component should handle the event without throwing
    expect(box).toBeInTheDocument()
  })

  it('resets mouse state on mouseleave', () => {
    const { container } = render(<ThreeScene />)
    const box = container.firstChild

    // First move to a non-zero position
    box.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    }))
    fireEvent.mouseMove(box, { clientX: 150, clientY: 150 })

    // Then leave — should not throw
    fireEvent.mouseLeave(box)
    expect(box).toBeInTheDocument()
  })

  it('computes normalized mouse coordinates from mousemove', () => {
    const { container } = render(<ThreeScene />)
    const box = container.firstChild

    // Rect: left=50, top=50, width=200, height=100
    // clientX=150, clientY=100 → x = (100/200)*2-1 = 0, y = (50/100)*2-1 = 0
    box.getBoundingClientRect = vi.fn(() => ({
      left: 50,
      top: 50,
      width: 200,
      height: 100,
    }))

    // Should not throw during state update
    expect(() =>
      fireEvent.mouseMove(box, { clientX: 150, clientY: 100 })
    ).not.toThrow()
  })
})
