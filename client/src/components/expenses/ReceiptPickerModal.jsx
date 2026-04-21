import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { AppModal } from "../common/AppModal";
import { useReceipts } from "../../hooks/useReceipt";

const getThumbnailUrl = (receipt) =>
  receipt.fileType === "pdf"
    ? receipt.cloudinaryUrl.replace(/\.pdf$/i, ".jpg")
    : receipt.cloudinaryUrl;

export const ReceiptPickerModal = ({ open, onClose, onSelect, currentReceiptId }) => {
  const { data: receipts = [], isLoading } = useReceipts({});

  return (
    <AppModal open={open} onClose={onClose} title="Attach Receipt">
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress />
        </Box>
      ) : receipts.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No receipts found. Scan a receipt first.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {receipts.map((receipt) => {
            const isSelected = receipt.id === currentReceiptId;
            return (
              <Box
                key={receipt.id}
                onClick={() => { onSelect(receipt); onClose(); }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  bgcolor: isSelected ? "action.selected" : "background.paper",
                  "&:hover": { bgcolor: "background.elevated" },
                  transition: "background-color 0.15s",
                }}
              >
                <Box
                  component="img"
                  src={getThumbnailUrl(receipt)}
                  alt="Receipt thumbnail"
                  sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {receipt.name || dayjs(receipt.createdAt).format("MMM D, YYYY")}
                  </Typography>
                  {receipt.ocrExtractedAmount && (
                    <Typography variant="caption" sx={{ color: "custom.amountGold" }}>
                      ${parseFloat(receipt.ocrExtractedAmount).toFixed(2)}
                    </Typography>
                  )}
                </Box>
                {isSelected && <CheckCircleIcon fontSize="small" color="primary" />}
              </Box>
            );
          })}
        </Stack>
      )}
    </AppModal>
  );
};
