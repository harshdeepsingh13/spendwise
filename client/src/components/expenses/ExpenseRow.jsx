import { Box, Typography } from "@mui/material";
import dayjs from "@/lib/dayjs";

export const ExpenseRow = ({ expense, onEdit }) => {
  const amount = parseFloat(expense.amount ?? 0).toFixed(2);
  const categoryColor = expense.category?.color || null;

  return (
    <Box
      onClick={() => onEdit(expense)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        transition: "background-color 0.15s",
        "&:hover": { bgcolor: "background.elevated" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            flexShrink: 0,
            bgcolor: categoryColor || "text.disabled",
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{
            fontWeight: 600
          }}>
            {expense.category?.name ?? "Uncategorized"}
          </Typography>
          {expense.notes && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",
                display: "block"
              }}>
              {expense.notes}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ textAlign: "right", flexShrink: 0, ml: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "custom.amountGold"
          }}>
          ${amount}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            display: "block"
          }}>
          {dayjs(expense.date).format("MMM D, YYYY")}
        </Typography>
      </Box>
    </Box>
  );
};

