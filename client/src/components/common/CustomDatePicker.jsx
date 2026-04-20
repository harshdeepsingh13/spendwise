import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

export const CustomDatePicker = ({ label, value, onChange, minDate, maxDate, slotProps, margin, ...props }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      slotProps={{ textField: { fullWidth: true, ...slotProps?.textField, margin } }}
      {...props}
    />
  </LocalizationProvider>
);
