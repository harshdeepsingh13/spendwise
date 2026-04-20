import { useEffect, useState } from 'react'

const OPENCV_URL = 'https://docs.opencv.org/4.9.0/opencv.js'

let scriptPromise = null

function loadOpenCv() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    if (window.cv && window.cv.Mat) { resolve(); return }
    const script = document.createElement('script')
    script.src = OPENCV_URL
    script.async = true
    script.onload = () => {
      if (window.cv && window.cv.Mat) { resolve(); return }
      if (window.cv) { window.cv.onRuntimeInitialized = resolve; return }
      const interval = setInterval(() => {
        if (window.cv && window.cv.Mat) { clearInterval(interval); resolve() }
        else if (window.cv) { clearInterval(interval); window.cv.onRuntimeInitialized = resolve }
      }, 200)
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export const useCvReady = () => {
  const [cvReady, setCvReady] = useState(() => !!(window.cv && window.cv.Mat))

  useEffect(() => {
    if (cvReady) return
    loadOpenCv().then(() => setCvReady(true))
  }, [cvReady])

  return cvReady
}
