import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { AppModal } from "../common/AppModal";
import { ReceiptPickerModal } from "./ReceiptPickerModal";
import { useCategories } from "../../hooks/useCategories";
import { useExpenseMutations } from "../../hooks/useExpenseMutations";

const EMPTY_FORM = { amount: "", categoryId: "", date: dayjs(), notes: "", linkedReceiptId: null, linkedReceipt: null };

const toFormValues = (expense) => ({
  amount: expense.amount ?? "",
  categoryId: expense.category?.id ?? "",
  date: dayjs(expense.date),
  notes: expense.notes ?? "",
  linkedReceiptId: expense.receiptId ?? null,
  linkedReceipt: null,
});

export const ExpenseForm = ({ open, onClose, expense, initialReceiptId, initialAmount }) => {
  const isEdit = !!expense;
  const [values, setValues] = useState(EMPTY_FORM);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { create, update, delete: deleteMutation } = useExpenseMutations();

  const isBusy = create.isPending || update.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setValues(toFormValues(expense));
      } else {
        setValues({
          ...EMPTY_FORM,
          date: dayjs(),
          amount: initialAmount ?? "",
          linkedReceiptId: initialReceiptId ?? null,
          linkedReceipt: null,
        });
      }
      setDeleteConfirming(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleReceiptSelect = (receipt) => {
    setValues((prev) => ({ ...prev, linkedReceiptId: receipt.id, linkedReceipt: receipt }));
  };

  const handleReceiptDetach = () => {
    setValues((prev) => ({ ...prev, linkedReceiptId: null, linkedReceipt: null }));
  };

  const handleSubmit = async () => {
    if (!values.amount || !values.categoryId || !values.date) return;
    const payload = {
      amount: values.amount,
      category: values.categoryId,
      date: values.date.toISOString(),
      notes: values.notes || undefined,
      receipt: values.linkedReceiptId || undefined,
    };
    if (isEdit) {
      await update.mutateAsync({ id: expense.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!deleteConfirming) {
      setDeleteConfirming(true);
      return;
    }
    await deleteMutation.mutateAsync(expense.id);
    onClose();
  };

  const receiptLabel = values.linkedReceipt?.name
    ?? (values.linkedReceiptId ? "Receipt attached" : null);

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit Expense" : "Add Expense"}
        actions={
          <Stack direction="row" justifyContent="space-between" width="100%">
            <Box>
              {isEdit && (
                <Button
                  onClick={handleDelete}
                  disabled={isBusy}
                  color={deleteConfirming ? "error" : "inherit"}
                  variant={deleteConfirming ? "contained" : "text"}
                  size="small"
                >
                  {deleteMutation.isPending ? <CircularProgress size={16} /> : deleteConfirming ? "Confirm Delete" : "Delete"}
                </Button>
              )}
            </Box>
            <Stack direction="row" gap={1}>
              <Button onClick={onClose} disabled={isBusy} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isBusy || !values.amount || !values.categoryId || !values.date}
              >
                {create.isPending || update.isPending ? <CircularProgress size={16} /> : isEdit ? "Save" : "Add"}
              </Button>
            </Stack>
          </Stack>
        }
      >
        <TextField
          label="Amount"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          value={values.amount}
          onChange={set("amount")}
          fullWidth
          required
          autoFocus={!isEdit}
        />

        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select value={values.categoryId} onChange={set("categoryId")} label="Category">
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                <Stack direction="row" alignItems="center" gap={1}>
                  {cat.color && (
                    <Box
                      component="span"
                      sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: cat.color, display: "inline-block", flexShrink: 0 }}
                    />
                  )}
                  {cat.name}
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <CustomDatePicker
          label="Date"
          value={values.date}
          onChange={(date) => setValues((prev) => ({ ...prev, date }))}
          margin="dense"
        />

        <TextField
          label="Notes"
          value={values.notes}
          onChange={set("notes")}
          fullWidth
          multiline
          minRows={2}
          placeholder="Optional"
        />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            Receipt
          </Typography>
          {receiptLabel ? (
            <Chip
              icon={<ReceiptLongIcon fontSize="small" />}
              label={receiptLabel}
              onDelete={handleReceiptDetach}
              deleteIcon={<CloseIcon fontSize="small" />}
              onClick={() => setPickerOpen(true)}
              variant="outlined"
              size="small"
            />
          ) : (
            <Button
              size="small"
              startIcon={<AttachFileIcon fontSize="small" />}
              onClick={() => setPickerOpen(true)}
              color="inherit"
              sx={{ textTransform: "none" }}
            >
              Attach receipt
            </Button>
          )}
        </Box>
      </AppModal>

      <ReceiptPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleReceiptSelect}
        currentReceiptId={values.linkedReceiptId}
      />
    </>
  );
};
