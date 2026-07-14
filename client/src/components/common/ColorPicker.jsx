import CheckIcon from '@mui/icons-material/Check'
import { Box, Typography } from '@mui/material'

/**
 * Curated preset swatches for category colors. Kept as plain hex so the value
 * round-trips directly to the API (Category.color is a string).
 */
export const PRESET_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#EF4444', '#F59E0B', '#10B981',
  '#14B8A6', '#38BDF8', '#6366F1', '#8B5CF6', '#64748B', '#0EA5E9',
]

/**
 * Reusable color picker: a grid of preset swatches plus a native custom-color input.
 * Controlled — pass the current hex `value` and receive changes via `onChange`.
 *
 * @param {object} props
 * @param {string} props.value - Currently selected hex color.
 * @param {(color: string) => void} props.onChange - Called with the new hex color.
 * @param {string} [props.label] - Optional field label rendered above the swatches.
 */
export const ColorPicker = ({ value, onChange, label = 'Color' }) => {
  const isCustom = value && !PRESET_COLORS.includes(value.toUpperCase?.() ?? value)

  return (
    <Box>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {PRESET_COLORS.map((color) => {
          const selected = value?.toUpperCase?.() === color
          return (
            <Box
              key={color}
              role="button"
              aria-label={`color ${color}`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid',
                borderColor: selected ? 'text.primary' : 'transparent',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.1)' },
              }}
            >
              {selected && <CheckIcon sx={{ fontSize: 16, color: 'common.white' }} />}
            </Box>
          )
        })}

        {/* Custom color — native picker */}
        <Box
          component="label"
          sx={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: isCustom ? 'text.primary' : 'divider',
            background: isCustom
              ? value
              : 'conic-gradient(red, orange, yellow, lime, aqua, blue, magenta, red)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isCustom && <CheckIcon sx={{ fontSize: 16, color: 'common.white' }} />}
          <input
            type="color"
            value={value || '#2563EB'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label="custom color"
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </Box>
      </Box>
    </Box>
  )
}
