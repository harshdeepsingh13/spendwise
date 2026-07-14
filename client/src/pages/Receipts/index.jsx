import AddIcon from "@mui/icons-material/Add";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fab,
  Grid,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import dayjs from "@/lib/dayjs";
import { useMemo, useState } from "react";
import { CustomDateModal } from "../../components/common/CustomDateModal";
import { PageContainer } from "../../components/common/PageContainer";
import { ReceiptCard } from "../../components/receipts/ReceiptCard";
import { ScannerDialog } from "../../components/receipts/ScannerDialog";
import { useReceipts } from "../../hooks/useReceipt";

const getDateRange = (filter) => {
  if (filter === "week") {
    return {
      startDate: dayjs().startOf("week").toISOString(),
      endDate: dayjs().endOf("week").toISOString(),
    };
  }
  if (filter === "l_week") {
    return {
      startDate: dayjs().subtract(1, "week").startOf("week").toISOString(),
      endDate: dayjs().subtract(1, "week").endOf("week").toISOString(),
    };
  }
  if (filter === "month") {
    return {
      startDate: dayjs().startOf("month").toISOString(),
      endDate: dayjs().endOf("month").toISOString(),
    };
  }
  if (filter === "year") {
    return {
      startDate: dayjs().startOf("year").toISOString(),
      endDate: dayjs().endOf("year").toISOString(),
    };
  }
  if (filter === "l_year") {
    return {
      startDate: dayjs().subtract(1, "year").startOf("year").toISOString(),
      endDate: dayjs().subtract(1, "year").endOf("year").toISOString(),
    };
  }
  return {};
};

const getDownloadUrl = (cloudinaryUrl, filename) => {
  const basename = (filename || "receipt").replace(/\.[^/.]+$/, "");
  const safe = basename.replace(/[^A-Za-z0-9._-]/g, "_");
  return cloudinaryUrl.replace("/upload/", `/upload/fl_attachment:${safe}/`);
};

const EmptyState = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 8,
      gap: 2,
    }}
  >
    <ReceiptLongIcon sx={{ fontSize: 64, opacity: 0.3 }} />
    <Typography variant="body1" sx={{
      color: "text.secondary"
    }}>
      No receipts found
    </Typography>
    <Typography variant="caption" sx={{
      color: "text.secondary"
    }}>
      Tap the + button to scan your first receipt
    </Typography>
  </Box>
);

export default function Receipts() {
  const [dateFilter, setDateFilter] = useState("week");
  const [activeTag, setActiveTag] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const getEffectiveDateRange = () => {
    if (customDateRange) return customDateRange;
    return getDateRange(dateFilter);
  };

  const dateRange = getEffectiveDateRange();
  const queryParams = { ...dateRange, ...(activeTag ? { tag: activeTag } : {}) };

  const { data: receipts = [], isLoading, error, refetch: refetchReceipts } = useReceipts(queryParams);
  const { data: allReceipts = [] } = useReceipts(dateRange);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    allReceipts.forEach((r) => r.tags?.forEach((t) => tagSet.add(t)));
    return [...tagSet];
  }, [allReceipts]);

  const handleTagClick = (tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  const handleCustomDateApply = (range) => {
    setCustomDateRange(range);
    setDateFilter(null);
  };

  const handleDateFilterChange = (_, v) => {
    if (v) {
      setDateFilter(v);
      setCustomDateRange(null);
      setActiveTag(null);
    }
  };

  const onCloseAddModal = () => {
    refetchReceipts?.();
    setScannerOpen(false);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDownload = () => {
    const selected = receipts.filter((r) => selectedIds.has(r.id));
    selected.forEach((receipt, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = getDownloadUrl(receipt.cloudinaryUrl, receipt.name);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      }, i * 300);
    });
  };

  return (
    <PageContainer>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" sx={{
          fontWeight: 700
        }}>
          Receipts
        </Typography>
        <IconButton onClick={toggleSelectionMode} color={selectionMode ? "primary" : "default"} size="small">
          {selectionMode ? <CloseIcon /> : <ChecklistIcon />}
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <ToggleButtonGroup value={dateFilter} exclusive onChange={handleDateFilterChange} size="small">
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="l_week">Last Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
          <ToggleButton value="year">This Year</ToggleButton>
          <ToggleButton value="l_year">Last Year</ToggleButton>
          <ToggleButton value="all">All Time</ToggleButton>
        </ToggleButtonGroup>
        <Chip
          label={customDateRange ? "Custom Range" : "Custom"}
          onClick={() => setCustomDateModalOpen(true)}
          color={customDateRange ? "primary" : "default"}
          variant={customDateRange ? "filled" : "outlined"}
        />
      </Box>
      {allTags.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 2, flexWrap: "nowrap" }}>
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={() => handleTagClick(tag)}
              color={activeTag === tag ? "primary" : "default"}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>
      )}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load receipts
        </Alert>
      )}
      {!isLoading && !error && receipts.length === 0 && <EmptyState />}
      {!isLoading && receipts.length > 0 && (
        <Grid container spacing={2}>
          {receipts.map((receipt) => (
            <Grid key={receipt.id} size={12}>
              <ReceiptCard
                receipt={receipt}
                onTagClick={handleTagClick}
                existingTags={allTags}
                selectionMode={selectionMode}
                selected={selectedIds.has(receipt.id)}
                onSelect={handleSelect}
              />
            </Grid>
          ))}
        </Grid>
      )}
      {selectionMode && selectedIds.size > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
          }}
        >
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleBulkDownload}
            sx={{ borderRadius: 8, px: 3, py: 1.5, boxShadow: 4 }}
          >
            Download {selectedIds.size} Receipt{selectedIds.size > 1 ? "s" : ""}
          </Button>
        </Box>
      )}
      {!selectionMode && (
        <Fab color="primary" onClick={() => setScannerOpen(true)} sx={{ position: "fixed", bottom: 20, right: 20 }}>
          <AddIcon />
        </Fab>
      )}
      <ScannerDialog open={scannerOpen} onClose={onCloseAddModal} existingTags={allTags} />
      <CustomDateModal
        open={customDateModalOpen}
        onClose={() => setCustomDateModalOpen(false)}
        onApply={handleCustomDateApply}
        currentRange={customDateRange}
      />
    </PageContainer>
  );
}

