import { Autocomplete, Box, Chip, TextField, Typography } from "@mui/material";
import { useState } from "react";

export const ReceiptDetailsForm = ({
  amount,
  name,
  onAmountChange,
  onNameChange,
  tags,
  onTagsChange,
  existingTags = [],
}) => {
  const [tagInput, setTagInput] = useState("");

  const handleTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/, "");
      if (newTag && !tags.includes(newTag)) onTagsChange([...tags, newTag]);
      setTagInput("");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        name="fileName"
        id="fileName"
        label="Receipt/File Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />

      <TextField
        label="Total Amount"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        type="number"
        inputProps={{ step: "0.01", min: "0" }}
        InputProps={{
          startAdornment: <Typography sx={{ color: "custom.amountGold", mr: 0.5, fontWeight: 700 }}>$</Typography>,
        }}
        sx={{ "& .MuiInputBase-input": { color: "custom.amountGold", fontWeight: 700 } }}
      />

      <Autocomplete
        multiple
        freeSolo
        options={existingTags}
        value={tags}
        onChange={(_, newValue) => {
          const cleaned = [...new Set(newValue.map((t) => (typeof t === "string" ? t.trim() : t)).filter(Boolean))];
          onTagsChange(cleaned);
        }}
        inputValue={tagInput}
        onInputChange={(_, v) => setTagInput(v)}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => <Chip key={option} label={option} size="small" />)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tags"
            placeholder="e.g. Business Expense"
            onKeyDown={handleTagKey}
            helperText="Press Enter or comma to add a tag"
          />
        )}
      />
    </Box>
  );
};
