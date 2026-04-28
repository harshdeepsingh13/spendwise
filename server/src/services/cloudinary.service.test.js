import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}))

import cloudinary from '../config/cloudinary.js'
import { uploadToCloudinary, destroyCloudinaryAsset } from './cloudinary.service.js'

describe('uploadToCloudinary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves with the upload result on success', async () => {
    const fakeResult = { public_id: 'receipts/abc123', secure_url: 'https://res.cloudinary.com/img.jpg' }
    const fakeStream = { end: vi.fn() }

    cloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      cb(null, fakeResult)
      return fakeStream
    })

    const buffer = Buffer.from('fake image data')
    const result = await uploadToCloudinary(buffer, { folder: 'receipts', resource_type: 'image' })

    expect(result).toEqual(fakeResult)
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'receipts', resource_type: 'image' },
      expect.any(Function)
    )
    expect(fakeStream.end).toHaveBeenCalledWith(buffer)
  })

  it('defaults resource_type to "auto" when not provided', async () => {
    const fakeResult = { public_id: 'img/xyz', secure_url: 'https://res.cloudinary.com/xyz.jpg' }
    const fakeStream = { end: vi.fn() }

    cloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      cb(null, fakeResult)
      return fakeStream
    })

    await uploadToCloudinary(Buffer.from('data'), { folder: 'img' })

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'img', resource_type: 'auto' },
      expect.any(Function)
    )
  })

  it('rejects when Cloudinary returns an error', async () => {
    const fakeError = new Error('Cloudinary upload failed')
    const fakeStream = { end: vi.fn() }

    cloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      cb(fakeError, null)
      return fakeStream
    })

    await expect(uploadToCloudinary(Buffer.from('data'), {})).rejects.toThrow('Cloudinary upload failed')
  })

  it('calls stream.end with the provided buffer', async () => {
    const fakeStream = { end: vi.fn() }
    cloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      cb(null, { public_id: 'x' })
      return fakeStream
    })

    const buffer = Buffer.from('some bytes')
    await uploadToCloudinary(buffer, {})

    expect(fakeStream.end).toHaveBeenCalledWith(buffer)
  })
})

describe('destroyCloudinaryAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls cloudinary.uploader.destroy with publicId and default resourceType "image"', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' })

    const result = await destroyCloudinaryAsset('receipts/abc123')

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('receipts/abc123', { resource_type: 'image' })
    expect(result).toEqual({ result: 'ok' })
  })

  it('passes a custom resourceType to cloudinary.uploader.destroy', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' })

    await destroyCloudinaryAsset('videos/vid1', 'video')

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('videos/vid1', { resource_type: 'video' })
  })

  it('propagates errors from cloudinary.uploader.destroy', async () => {
    cloudinary.uploader.destroy.mockRejectedValue(new Error('destroy failed'))

    await expect(destroyCloudinaryAsset('bad/id')).rejects.toThrow('destroy failed')
  })
})
