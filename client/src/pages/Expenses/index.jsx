import dayjs from "@/lib/dayjs";
import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Fab,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { CustomDateModal } from "../../components/common/CustomDateModal";
import { PageContainer } from "../../components/common/PageContainer";
import { ExpenseForm } from "../../components/expenses/ExpenseForm";
import { ExpenseRow } from "../../components/expenses/ExpenseRow";
import { useExpenses } from "../../hooks/useExpenses";

const getDateRange = (filter) => {
  if (filter === "week") return { startDate: dayjs().startOf("week").toISOString(), endDate: dayjs().endOf("week").toISOString() };
  if (filter === "month") return { startDate: dayjs().startOf("month").toISOString(), endDate: dayjs().endOf("month").toISOString() };
  if (filter === "year") return { startDate: dayjs().startOf("year").toISOString(), endDate: dayjs().endOf("year").toISOString() };
  return {};
};

const EmptyState = () => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
    <AttachMoneyIcon sx={{ fontSize: 64, opacity: 0.3 }} />
    <Typography variant="body1" sx={{
      color: "text.secondary"
    }}>
      No expenses found
    </Typography>
    <Typography variant="caption" sx={{
      color: "text.secondary"
    }}>
      Tap the + button to log your first expense
    </Typography>
  </Box>
);

export default function ExpensesPage() {
  const [dateFilter, setDateFilter] = useState("month");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false);

  const { startDate, endDate } = customDateRange ?? getDateRange(dateFilter);
  const params = {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(activeCategoryId ? { categoryId: activeCategoryId } : {}),
  };

  const { data: expenses = [], isLoading, error } = useExpenses(params);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + parseFloat(e.amount ?? 0), 0),
    [expenses]
  );

  const uniqueCategories = useMemo(() => {
    const seen = new Map();
    expenses.forEach((e) => {
      if (e.category && !seen.has(e.category.id)) seen.set(e.category.id, e.category);
    });
    return [...seen.values()];
  }, [expenses]);

  const handleDateFilterChange = (_, v) => {
    if (v) {
      setDateFilter(v);
      setCustomDateRange(null);
      setActiveCategoryId(null);
    }
  };

  const handleCustomDateApply = (range) => {
    setCustomDateRange(range);
    setDateFilter(null);
  };

  const handleCategoryClick = (id) => setActiveCategoryId((prev) => (prev === id ? null : id));

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingExpense(null);
  };

  return (
    <PageContainer>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" sx={{
          fontWeight: 700
        }}>
          Expenses
        </Typography>
        {!isLoading && expenses.length > 0 && (
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "custom.amountGold"
              }}>
              ${total.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <ToggleButtonGroup value={dateFilter} exclusive onChange={handleDateFilterChange} size="small">
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
          <ToggleButton value="year">This Year</ToggleButton>
          <ToggleButton value="all">All Time</ToggleButton>
        </ToggleButtonGroup>
        <Chip
          label={customDateRange ? "Custom Range" : "Custom"}
          onClick={() => setCustomDateModalOpen(true)}
          color={customDateRange ? "primary" : "default"}
          variant={customDateRange ? "filled" : "outlined"}
        />
      </Box>
      {uniqueCategories.length > 1 && (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 2, flexWrap: "nowrap" }}>
          {uniqueCategories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              size="small"
              onClick={() => handleCategoryClick(cat.id)}
              color={activeCategoryId === cat.id ? "primary" : "default"}
              sx={{ flexShrink: 0 }}
              icon={
                cat.color ? (
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cat.color, ml: "8px !important" }} />
                ) : undefined
              }
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
          Failed to load expenses
        </Alert>
      )}
      {!isLoading && !error && expenses.length === 0 && <EmptyState />}
      {!isLoading && !error && expenses.length > 0 && (
        <Stack spacing={1}>
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} onEdit={handleOpenEdit} />
          ))}
        </Stack>
      )}
      <Fab color="primary" onClick={handleOpenCreate} sx={{ position: "fixed", bottom: 20, right: 20 }}>
        <AddIcon />
      </Fab>
      <ExpenseForm open={formOpen} onClose={handleFormClose} expense={editingExpense} />
      <CustomDateModal
        open={customDateModalOpen}
        onClose={() => setCustomDateModalOpen(false)}
        onApply={handleCustomDateApply}
        currentRange={customDateRange}
      />
    </PageContainer>
  );
}
