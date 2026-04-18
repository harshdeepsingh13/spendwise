import ImageIcon from '@mui/icons-material/Image'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import dayjs from '@/lib/dayjs'

export const ReceiptThumb = ({ receipt }) => {
  const navigate = useNavigate()
  const isPdf = receipt.fileType === 'pdf'
  const hasImage = !isPdf && receipt.cloudinaryUrl

  return (
    <Box
      onClick={() => navigate('/receipts')}
      sx={{ cursor: 'pointer', '&:hover .thumb-box': { borderColor: 'primary.main' } }}
    >
      <Box
        className="thumb-box"
        sx={{
          width: 80,
          height: 80,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.elevated',
          transition: 'border-color 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasImage ? (
          <Box
            component="img"
            src={receipt.cloudinaryUrl}
            alt={receipt.name || 'Receipt'}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isPdf ? (
          <PictureAsPdfIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
        ) : (
          <ImageIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
        {dayjs(receipt.createdAt).format('MMM D')}
      </Typography>
    </Box>
  )
}
