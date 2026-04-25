import { useEffect } from 'react'

export function useParallax(slowRef, midRef) {
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      if (slowRef.current) slowRef.current.style.transform = `translateY(${y * 0.15}px)`
      if (midRef.current) midRef.current.style.transform = `translateY(${y * 0.3}px)`
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [slowRef, midRef])
}
