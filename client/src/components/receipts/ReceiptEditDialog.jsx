import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import ImageIcon from '@mui/icons-material/Image'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDeleteReceipt, useUpdateReceipt } from '../../hooks/useReceipt'
import { AppModal } from '../common/AppModal'
import { ReceiptDetailsForm } from './ReceiptDetailsForm'

const STATUS_COLOR = {
  pending: 'warning',
  processing: 'info',
  done: 'success',
  failed: 'error',
}

const getThumbnailUrl = (receipt) => {
  if (receipt.fileType !== 'pdf') return receipt.cloudinaryUrl
  return receipt.cloudinaryUrl.replace(/\.pdf$/i, '.jpg')
}

const getDownloadUrl = (cloudinaryUrl, filename) => {
  const basename = (filename || 'receipt').replace(/\.[^/.]+$/, '')
  const safe = basename.replace(/[^A-Za-z0-9._-]/g, '_')
  return cloudinaryUrl.replace('/upload/', `/upload/fl_attachment:${safe}/`)
}

const FileBar = ({ receipt, name }) => {
  const isPdf = receipt.fileType === 'pdf'
  const displayName = name || receipt.name || (isPdf ? 'receipt.pdf' : 'receipt')

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {isPdf
        ? <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: 28, flexShrink: 0 }} />
        : <ImageIcon sx={{ color: 'text.secondary', fontSize: 28, flexShrink: 0 }} />
      }
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isPdf ? 'PDF Receipt' : 'Image Receipt'}
        </Typography>
      </Box>
      <Tooltip title="Download">
        <IconButton
          size="small"
          component="a"
          href={getDownloadUrl(receipt.cloudinaryUrl, displayName)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export const ReceiptEditDialog = ({ open, receipt, existingTags = [], onClose }) => {
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [tags, setTags] = useState([])

  const { mutateAsync: updateReceipt, isPending: isSaving } = useUpdateReceipt()
  const { mutate: deleteReceipt, isPending: isDeleting } = useDeleteReceipt()

  useEffect(() => {
    if (open && receipt) {
      setAmount(receipt.ocrExtractedAmount ? parseFloat(receipt.ocrExtractedAmount).toFixed(2) : '')
      setName(receipt.name || '')
      setTags(receipt.tags ?? [])
    }
  }, [open, receipt])

  if (!receipt) return null

  const handleSave = async () => {
    await updateReceipt({ id: receipt.id, amount: amount || undefined, name: name || undefined, tags })
    onClose()
  }

  const handleDelete = () => {
    deleteReceipt(receipt.id, { onSuccess: onClose })
  }

  const busy = isSaving || isDeleting

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Receipt"
      actions={
        <>
          <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDelete} disabled={busy}>
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={busy}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </>
      }
    >
      {receipt.fileType !== 'pdf' && (
        <Box
          component="img"
          src={getThumbnailUrl(receipt)}
          alt="Receipt preview"
          sx={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 1 }}
        />
      )}

      <FileBar receipt={receipt} name={name} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {dayjs(receipt.createdAt).format('MMM D, YYYY')}
        </Typography>
        <Chip
          label={receipt.ocrStatus}
          color={STATUS_COLOR[receipt.ocrStatus] ?? 'default'}
          size="small"
          sx={{ height: 18, fontSize: '0.65rem' }}
        />
      </Box>

      <ReceiptDetailsForm
        name={name}
        onNameChange={setName}
        amount={amount}
        onAmountChange={setAmount}
        tags={tags}
        onTagsChange={setTags}
        existingTags={existingTags}
      />
    </AppModal>
  )
}
