import * as receiptService from '../services/receipt.service.js'

const serializeReceipt = (r) => ({
  id: r._id,
  name: r.name || null,
  cloudinaryUrl: r.cloudinaryUrl,
  fileType: r.fileType ?? 'image',
  ocrStatus: r.ocrStatus,
  ocrExtractedAmount: r.ocrExtractedAmount ? r.ocrExtractedAmount.toString() : null,
  tags: r.tags ?? [],
  createdAt: r.createdAt
})

export const listReceipts = async (req, res, next) => {
  try {
    const receipts = await receiptService.listReceipts(req.user._id, req.query)
    res.json(receipts.map(serializeReceipt))
  } catch (err) {
    next(err)
  }
}

export const uploadReceipt = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }
  try {
    const result = await receiptService.uploadReceipt(req.user._id, req.file.buffer, {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export const getOcrStatus = async (req, res, next) => {
  try {
    const result = await receiptService.getOcrStatus(req.params.id, req.user._id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const deleteReceipt = async (req, res, next) => {
  try {
    await receiptService.deleteReceipt(req.params.id, req.user._id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.updateReceipt(req.params.id, req.user._id, req.body)
    res.json(serializeReceipt(receipt))
  } catch (err) {
    next(err)
  }
}
