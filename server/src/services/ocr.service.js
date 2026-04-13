import Tesseract from 'tesseract.js'
import { Receipt } from '../models/Receipt.model.js'

export const ocrService = {
  processReceipt: async (receiptId, imageUrl, pageCount = 1) => {
    try {
      await Receipt.findByIdAndUpdate(receiptId, { ocrStatus: 'processing' })

      let text = ''
      if (pageCount > 1) {
        const pageTexts = []
        for (let page = 1; page <= pageCount; page++) {
          const pageUrl = imageUrl.replace('/upload/', `/upload/pg_${page}/`)
          const result = await Tesseract.recognize(pageUrl, 'eng')
          pageTexts.push(result.data.text)
        }
        text = pageTexts.join('\n')
      } else {
        const result = await Tesseract.recognize(imageUrl, 'eng')
        text = result.data.text
      }

      const amount = extractAmount(text)

      await Receipt.findByIdAndUpdate(receiptId, {
        ocrStatus: 'done',
        ocrExtractedAmount: amount !== null ? amount.toFixed(2) : null,
        ocrRawText: text
      })
    } catch (error) {
      console.error('OCR error:', error)
      await Receipt.findByIdAndUpdate(receiptId, {
        ocrStatus: 'failed'
      })
    }
  }
}

// Keyword tiers for identifying the final total line
const HIGH_PRIORITY = /\b(grand\s+total|total\s+amount|amount\s+due|balance\s+due|total\s+due|amount\s+payable|order\s+total)\b/i
const MEDIUM_PRIORITY = /\btotal\b/i
// Lines matching these are skipped even if they contain "total"
const SKIP_KEYWORDS = /\b(subtotal|sub-total|tax|tip|gratuity|change|cash\s+tendered|tendered|discount|savings|coupon|points)\b/i
const AMOUNT_PATTERN = /\$?\s*(\d{1,6}(?:,\d{3})*\.\d{2})/

// OCR commonly misreads 0↔O and 1↔l — test both original and normalized text
function matchesKeyword(line, pattern) {
  return pattern.test(line) || pattern.test(line.replace(/0/g, 'O').replace(/1/g, 'l'))
}

export function extractAmount(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const highLines = lines.filter(
    (l) => matchesKeyword(l, HIGH_PRIORITY) && !matchesKeyword(l, SKIP_KEYWORDS)
  )
  const mediumLines = lines.filter(
    (l) => matchesKeyword(l, MEDIUM_PRIORITY) && !matchesKeyword(l, SKIP_KEYWORDS)
  )

  const candidates = highLines.length > 0 ? highLines : mediumLines

  // Scan from bottom — grand total always follows subtotal/tax on a receipt
  for (let i = candidates.length - 1; i >= 0; i--) {
    const match = candidates[i].match(AMOUNT_PATTERN)
    if (match) return parseFloat(match[1].replace(/,/g, ''))
  }

  // Fallback: last decimal amount in the text (totals print near the bottom)
  const allMatches = [...text.matchAll(/\$?\s*(\d{1,6}(?:,\d{3})*\.\d{2})/g)]
  if (allMatches.length > 0) {
    return parseFloat(allMatches[allMatches.length - 1][1].replace(/,/g, ''))
  }

  return null
}
