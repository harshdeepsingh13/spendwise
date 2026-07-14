import AddIcon from '@mui/icons-material/Add'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useState } from 'react'
import dayjs from '@/lib/dayjs'
import { PageContainer } from '../../components/common/PageContainer'
import { ProGate } from '../../components/common/ProGate'
import { AppModal } from '../../components/common/AppModal'
import { BudgetProgressBar } from '../../components/charts/BudgetProgressBar'
import { CategoryDonutChart } from '../../components/charts/CategoryDonutChart'
import { SpendingTrendChart } from '../../components/charts/SpendingTrendChart'
import { BudgetForm } from '../../components/budgets/BudgetForm'
import { BudgetList } from '../../components/budgets/BudgetList'
import { useAuth } from '../../hooks/useAuth'
import { useBudgetVsActual, useKpi, useSummary } from '../../hooks/useAnalytics'

const TREND_PERIODS = [
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Mo' },
  { value: '6months', label: '6 Mo' },
  { value: 'year', label: 'Year' }
]

const getPeriodDates = (period) => {
  const now = dayjs()
  switch (period) {
    case '3months':
      return {
        startDate: now.subtract(2, 'month').startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        groupBy: 'month'
      }
    case '6months':
      return {
        startDate: now.subtract(5, 'month').startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        groupBy: 'month'
      }
    case 'year':
      return {
        startDate: now.startOf('year').toISOString(),
        endDate: now.endOf('year').toISOString(),
        groupBy: 'month'
      }
    default:
      return {
        startDate: now.startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        groupBy: 'day'
      }
  }
}

const MomIcon = ({ pct }) => {
  if (Math.abs(pct) < 1) return <TrendingFlatIcon fontSize="small" />
  return pct > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
}

const KpiCard = ({ label, value, subValue, isLoading, valueColor, accentColor = 'primary.main' }) => (
  <Card sx={{ height: '100%', borderTop: '3px solid', borderColor: accentColor }}>
    <CardContent>
      <Typography
        variant="overline"
        sx={{
          color: "text.secondary",
          display: 'block',
          mb: 0.5
        }}>
        {label}
      </Typography>
      {isLoading ? (
        <Skeleton width={80} height={32} />
      ) : (
        <Typography variant="h5" sx={{ color: valueColor ?? 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
          {value ?? '—'}
        </Typography>
      )}
      {subValue && (
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>{subValue}</Typography>
      )}
    </CardContent>
  </Card>
)

export default function AnalyticsPage() {
  const now = dayjs()
  const currentYear = now.year()
  const currentMonth = now.month() + 1

  const [trendPeriod, setTrendPeriod] = useState('month')
  const [manageBudgetsOpen, setManageBudgetsOpen] = useState(false)
  const [budgetFormOpen, setBudgetFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)

  const { user } = useAuth()
  const isFree = user?.tier === 'free'

  const trendDates = getPeriodDates(trendPeriod)
  const threeMonthsAgo = now.subtract(3, 'month').startOf('month')
  const isTrendGated = isFree && dayjs(trendDates.startDate).isBefore(threeMonthsAgo)

  const currentMonthStart = now.startOf('month').toISOString()
  const currentMonthEnd = now.endOf('month').toISOString()

  const { data: kpi, isLoading: kpiLoading } = useKpi(currentYear, currentMonth)
  const { data: donutSummary } = useSummary(currentMonthStart, currentMonthEnd, 'category')
  const { data: trendSummary, isLoading: trendLoading, error: trendError } = useSummary(
    isTrendGated ? null : trendDates.startDate,
    isTrendGated ? null : trendDates.endDate,
    trendDates.groupBy
  )
  const { data: budgetVsActual = [], isLoading: budgetLoading } = useBudgetVsActual(currentYear, currentMonth)

  const momPct = kpi?.momPctChange ?? 0
  const momColor = Math.abs(momPct) < 1 ? 'text.secondary' : momPct > 0 ? 'custom.spendRed' : 'custom.incomeGreen'

  const budgetHealthAccent = kpi?.budgetHealthScore != null
    ? kpi.budgetHealthScore >= 80 ? 'success.main'
    : kpi.budgetHealthScore >= 50 ? 'warning.main'
    : 'error.main'
    : 'primary.main'

  const handleEditBudget = (budget) => {
    setManageBudgetsOpen(false)
    setEditingBudget(budget)
    setBudgetFormOpen(true)
  }

  const handleAddBudget = () => {
    setManageBudgetsOpen(false)
    setEditingBudget(null)
    setBudgetFormOpen(true)
  }

  return (
    <PageContainer maxWidth="lg">
      {/* Page Header */}
      <Box sx={{
        mb: 3,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1.5,
      }}>
        <Box>
          <Typography variant="h5" sx={{
            fontWeight: 700
          }}>Analytics</Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {now.format('MMMM YYYY')}
          </Typography>
        </Box>
        {kpi && !kpiLoading && (
          <Box sx={{
            px: 2, py: 0.75,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>Month total</Typography>
            <Typography
              variant="h6"
              sx={{ color: 'custom.amountGold', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
            >
              ${kpi.currentMonthTotal.toFixed(0)}
            </Typography>
          </Box>
        )}
      </Box>
      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <KpiCard
            label="This Month"
            value={kpi ? `$${kpi.currentMonthTotal.toFixed(0)}` : null}
            isLoading={kpiLoading}
            valueColor="custom.amountGold"
            accentColor="custom.amountGold"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <KpiCard
            label="vs Last Month"
            isLoading={kpiLoading}
            accentColor={momColor}
            value={
              kpi ? (
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: momColor }}>
                  <MomIcon pct={momPct} />
                  {Math.abs(momPct).toFixed(1)}%
                </Box>
              ) : null
            }
            subValue={kpi
              ? momPct > 0 ? 'more than last month'
              : momPct < 0 ? 'less than last month'
              : 'same as last month'
              : null
            }
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <KpiCard
            label="Top Category"
            isLoading={kpiLoading}
            value={kpi?.topCategory?.name ?? (kpiLoading ? null : 'None')}
            subValue={kpi?.topCategory ? `$${kpi.topCategory.total.toFixed(0)} this month` : null}
            accentColor="primary.main"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <KpiCard
            label="Budget Health"
            isLoading={kpiLoading}
            value={kpi?.budgetHealthScore != null ? `${kpi.budgetHealthScore}%` : (kpiLoading ? null : 'No budgets')}
            subValue={kpi?.budgetHealthScore != null ? 'categories on track' : null}
            accentColor={budgetHealthAccent}
            valueColor={
              kpi?.budgetHealthScore != null
                ? kpi.budgetHealthScore >= 80 ? 'custom.incomeGreen'
                : kpi.budgetHealthScore >= 50 ? 'custom.amountGold'
                : 'custom.spendRed'
                : undefined
            }
          />
        </Grid>
      </Grid>
      {/* Charts: Spending Trend + Category Breakdown side by side on desktop */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Spending Trend */}
        <Grid
          size={{
            xs: 12,
            md: 7
          }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  Spending Trend
                </Box>
              }
              action={
                <ToggleButtonGroup
                  value={trendPeriod}
                  exclusive
                  onChange={(_, v) => { if (v) setTrendPeriod(v) }}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { py: 0.5, px: 1.5, fontSize: '0.75rem' } }}
                >
                  {TREND_PERIODS.map(p => (
                    <ToggleButton key={p.value} value={p.value}>{p.label}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              }
            />
            <CardContent sx={{ pt: 1 }}>
              <ProGate locked={isTrendGated}>
                {trendLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : trendError ? (
                  <Alert severity="error">Failed to load trend data</Alert>
                ) : (
                  <SpendingTrendChart data={trendSummary?.totals ?? []} height={220} />
                )}
              </ProGate>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid
          size={{
            xs: 12,
            md: 5
          }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PieChartOutlinedIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                  By Category
                </Box>
              }
              subheader={now.format('MMMM YYYY')}
            />
            <CardContent sx={{ pt: 1 }}>
              <CategoryDonutChart
                data={donutSummary?.totals ?? []}
                grandTotal={donutSummary?.grandTotal ?? 0}
                height={260}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Budget Tracker */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Budget Tracker"
          subheader={now.format('MMMM YYYY')}
          action={
            <Button
              size="small"
              variant="outlined"
              onClick={() => setManageBudgetsOpen(true)}
            >
              Manage
            </Button>
          }
        />
        <CardContent sx={{ pt: 1 }}>
          {budgetLoading ? (
            <Stack sx={{
              gap: 2
            }}>
              {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={48} />)}
            </Stack>
          ) : budgetVsActual.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 2
                }}>
                No budgets set yet. Set monthly limits to track your spending.
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddBudget}
              >
                Set Your First Budget
              </Button>
            </Box>
          ) : (
            <Box>
              {budgetVsActual.map(item => (
                <BudgetProgressBar
                  key={item.budget.id}
                  budget={item.budget}
                  actual={item.actual}
                  pct={item.pct}
                  status={item.status}
                />
              ))}
              <Divider sx={{ my: 1.5 }} />
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddBudget}
                color="inherit"
              >
                Add Budget
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      {/* Manage Budgets Modal */}
      <AppModal
        open={manageBudgetsOpen}
        onClose={() => setManageBudgetsOpen(false)}
        title="Manage Budgets"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBudget}
            size="small"
          >
            Add Budget
          </Button>
        }
      >
        <BudgetList onEdit={handleEditBudget} />
      </AppModal>
      {/* Budget Form Modal */}
      <BudgetForm
        open={budgetFormOpen}
        onClose={() => { setBudgetFormOpen(false); setEditingBudget(null) }}
        budget={editingBudget}
      />
    </PageContainer>
  );
}
