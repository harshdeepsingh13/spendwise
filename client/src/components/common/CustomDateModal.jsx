import { Button, Stack } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { AppModal } from "./AppModal";
import { CustomDatePicker } from "./CustomDatePicker";

const DEFAULT_START = () => dayjs().subtract(30, "days");
const DEFAULT_END = () => dayjs();

export const CustomDateModal = ({ open, onClose, onApply, currentRange }) => {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);

  useEffect(() => {
    if (open) {
      setStartDate(currentRange?.startDate ? dayjs(currentRange.startDate) : DEFAULT_START());
      setEndDate(currentRange?.endDate ? dayjs(currentRange.endDate) : DEFAULT_END());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => {
    onApply({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    onClose();
  };

  const handleReset = () => {
    setStartDate(DEFAULT_START());
    setEndDate(DEFAULT_END());
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Select Custom Date Range"
      actions={
        <>
          <Button onClick={handleReset} color="inherit">
            Reset
          </Button>
          <Stack direction="row" sx={{
            gap: 1
          }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleApply} variant="contained">
              Apply
            </Button>
          </Stack>
        </>
      }
    >
      <CustomDatePicker
          label="Start Date"
          value={startDate}
          onChange={(date) => setStartDate(date)}
          margin="dense"
        />
      <CustomDatePicker
        label="End Date"
        value={endDate}
        onChange={(date) => setEndDate(date)}
        minDate={startDate}
        margin="dense"
      />
    </AppModal>
  );
};
