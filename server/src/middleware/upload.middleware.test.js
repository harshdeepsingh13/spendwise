import { describe, it, expect, vi, beforeEach } from 'vitest'

let capturedConfig = null

vi.mock('multer', () => {
  const memoryStorageResult = { _storage: 'memory' }
  const memoryStorage = vi.fn(() => memoryStorageResult)
  const multerMock = vi.fn((config) => {
    capturedConfig = config
    return {
      single: vi.fn(),
      array: vi.fn(),
      fields: vi.fn(),
      none: vi.fn()
    }
  })
  multerMock.memoryStorage = memoryStorage
  return { default: multerMock }
})

const { upload } = await import('./upload.middleware.js')
import multer from 'multer'

describe('upload middleware', () => {
  it('exports a multer instance with expected methods', () => {
    expect(upload).toBeDefined()
    expect(typeof upload.single).toBe('function')
    expect(typeof upload.array).toBe('function')
    expect(typeof upload.fields).toBe('function')
  })

  it('uses memory storage', () => {
    expect(multer.memoryStorage).toHaveBeenCalled()
    expect(multer).toHaveBeenCalledWith(
      expect.objectContaining({ storage: { _storage: 'memory' } })
    )
  })

  it('sets a 10 MB file size limit', () => {
    expect(capturedConfig.limits).toEqual({ fileSize: 10 * 1024 * 1024 })
  })

  describe('fileFilter', () => {
    let cb

    beforeEach(() => {
      cb = vi.fn()
    })

    const ALLOWED = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ]

    it.each(ALLOWED)('accepts %s', (mimetype) => {
      capturedConfig.fileFilter({}, { mimetype }, cb)
      expect(cb).toHaveBeenCalledWith(null, true)
    })

    it('rejects an unsupported mimetype with an Error', () => {
      capturedConfig.fileFilter({}, { mimetype: 'text/plain' }, cb)
      const [err, accepted] = cb.mock.calls[0]
      expect(err).toBeInstanceOf(Error)
      expect(accepted).toBe(false)
    })

    it('includes the rejected mimetype in the error message', () => {
      capturedConfig.fileFilter({}, { mimetype: 'video/mp4' }, cb)
      const [err] = cb.mock.calls[0]
      expect(err.message).toContain('video/mp4')
    })

    it('rejects application/octet-stream', () => {
      capturedConfig.fileFilter({}, { mimetype: 'application/octet-stream' }, cb)
      const [err, accepted] = cb.mock.calls[0]
      expect(err).toBeInstanceOf(Error)
      expect(accepted).toBe(false)
    })
  })
})
