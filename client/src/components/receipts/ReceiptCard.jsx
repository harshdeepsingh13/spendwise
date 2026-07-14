import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Card, CardMedia, Chip, IconButton, Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useDeleteReceipt } from '../../hooks/useReceipt'
import { ReceiptEditDialog } from './ReceiptEditDialog'

const getThumbnailUrl = (receipt) => {
  if (receipt.fileType !== 'pdf') return receipt.cloudinaryUrl
  return receipt.cloudinaryUrl.replace(/\.pdf$/i, '.jpg');
}

const STATUS_COLOR = {
  pending: 'warning',
  processing: 'info',
  done: 'success',
  failed: 'error',
}

export const ReceiptCard = ({ receipt, onTagClick, existingTags = [], selectionMode = false, selected = false, onSelect }) => {
  const theme = useTheme()
  const [editOpen, setEditOpen] = useState(false)
  const { mutate: deleteReceipt, isPending: isDeleting } = useDeleteReceipt()

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteReceipt(receipt.id)
  }

  const handleCardClick = () => {
    if (selectionMode) {
      onSelect?.(receipt.id)
    } else {
      setEditOpen(true)
    }
  }

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          bgcolor: selected ? 'action.selected' : 'custom.receiptSurf',
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
          cursor: 'pointer',
          '&:hover': { boxShadow: 3 },
        }}
      >
        <Box sx={{ position: 'relative', width: 80, flexShrink: 0 }}>
          <CardMedia
            component="img"
            image={getThumbnailUrl(receipt)}
            alt="Receipt"
            sx={{ width: 80, height: '100%', objectFit: 'cover' }}
          />
          {receipt.fileType === 'pdf' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                bgcolor: 'error.main',
                borderRadius: 0.5,
                px: 0.5,
                lineHeight: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: 'common.white', fontSize: '0.6rem', fontWeight: 700 }}>
                PDF
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {dayjs(receipt.createdAt).format('MMM D, YYYY')}
            </Typography>
            <Chip
              label={receipt.ocrStatus}
              color={STATUS_COLOR[receipt.ocrStatus] ?? 'default'}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          </Box>

          {receipt.name && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",
                display: 'block',
                mb: 0.25
              }}>
              {receipt.name}
            </Typography>
          )}

          {receipt.ocrExtractedAmount && (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: 'custom.amountGold',
                lineHeight: 1.2
              }}>
              ${parseFloat(receipt.ocrExtractedAmount).toFixed(2)}
            </Typography>
          )}

          {receipt.tags?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
              {receipt.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTagClick?.(tag)
                  }}
                  sx={{ height: 20, fontSize: '0.65rem', cursor: 'pointer' }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          {selectionMode ? (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onSelect?.(receipt.id) }}>
              {selected
                ? <CheckBoxIcon fontSize="small" color="primary" />
                : <CheckBoxOutlineBlankIcon fontSize="small" />}
            </IconButton>
          ) : (
            <IconButton size="small" onClick={handleDelete} disabled={isDeleting} color="error">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Card>
      {!selectionMode && (
        <ReceiptEditDialog
          open={editOpen}
          receipt={receipt}
          existingTags={existingTags}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
