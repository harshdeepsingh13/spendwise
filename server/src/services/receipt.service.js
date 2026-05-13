import { Receipt } from '../models/Receipt.model.js'
import * as cloudinaryService from './cloudinary.service.js'
import { ocrService } from './ocr.service.js'

function notFound() {
  const err = new Error('Receipt not found')
  err.status = 404
  return err
}

export async function listReceipts(userId, { startDate, endDate, tag } = {}) {
  const filter = { user: userId, submitted: true }
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) filter.createdAt.$lte = new Date(endDate)
  }
  if (tag) filter.tags = tag
  return Receipt.find(filter).sort({ createdAt: -1 })
}

export async function uploadReceipt(userId, fileBuffer, { originalname, mimetype }) {
  const isPdf = mimetype === 'application/pdf'
  const uploadResult = await cloudinaryService.uploadToCloudinary(fileBuffer, {
    folder: 'spendwise/receipts',
    resource_type: 'auto'
  })
  const ocrImageUrl = isPdf
    ? uploadResult.secure_url.replace(/\.pdf$/i, '.jpg')
    : uploadResult.secure_url

  const receipt = new Receipt({
    user: userId,
    name: originalname,
    cloudinaryPublicId: uploadResult.public_id,
    cloudinaryUrl: uploadResult.secure_url,
    cloudinaryResourceType: uploadResult.resource_type,
    fileType: isPdf ? 'pdf' : 'image',
    ocrStatus: 'pending'
  })
  await receipt.save()

  const pageCount = isPdf ? (uploadResult.pages || 1) : 1
  ocrService.processReceipt(receipt._id, ocrImageUrl, pageCount).catch((err) => {
    console.error('OCR processing failed:', err)
  })

  return { id: receipt._id, ocrStatus: receipt.ocrStatus, cloudinaryUrl: receipt.cloudinaryUrl, fileType: receipt.fileType }
}

export async function getOcrStatus(receiptId, userId) {
  const receipt = await Receipt.findById(receiptId)
  if (!receipt || receipt.user.toString() !== userId.toString()) throw notFound()
  return {
    id: receipt._id,
    ocrStatus: receipt.ocrStatus,
    ocrExtractedAmount: receipt.ocrExtractedAmount ? receipt.ocrExtractedAmount.toString() : null,
    cloudinaryUrl: receipt.cloudinaryUrl
  }
}

export async function deleteReceipt(receiptId, userId) {
  const receipt = await Receipt.findById(receiptId)
  if (!receipt || receipt.user.toString() !== userId.toString()) throw notFound()
  if (receipt.cloudinaryPublicId) {
    await cloudinaryService.destroyCloudinaryAsset(receipt.cloudinaryPublicId, receipt.cloudinaryResourceType ?? 'image')
  }
  await receipt.deleteOne()
}

export async function updateReceipt(receiptId, userId, { amount, name, tags, submitted }) {
  const receipt = await Receipt.findById(receiptId)
  if (!receipt || receipt.user.toString() !== userId.toString()) throw notFound()
  if (amount !== undefined) receipt.ocrExtractedAmount = amount
  if (name !== undefined) receipt.name = name
  if (tags !== undefined) receipt.tags = tags
  if (submitted !== undefined) receipt.submitted = submitted
  await receipt.save()
  return receipt
}

