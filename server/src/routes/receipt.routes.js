import { Router } from 'express'
import {
  uploadReceipt,
  getOcrStatus,
  listReceipts,
  deleteReceipt,
  updateReceipt
} from '../controllers/receipt.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listReceipts)
router.post('/upload', upload.single('receipt'), uploadReceipt)
router.get('/:id/ocr-status', getOcrStatus)
router.delete('/:id', deleteReceipt)
router.patch('/:id', updateReceipt)

export default router
