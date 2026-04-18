import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
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
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from '@/lib/dayjs'
import { PageContainer } from '../../components/common/PageContainer'
import { ProGate } from '../../components/common/ProGate'
import { BudgetProgressBar } from '../../components/charts/BudgetProgressBar'
import { CategoryDonutChart } from '../../components/charts/CategoryDonutChart'
import { SpendingTrendChart } from '../../components/charts/SpendingTrendChart'
import { ScannerDialog } from '../../components/receipts/ScannerDialog'
import { RecentExpenseRow } from '../../components/dashboard/RecentExpenseRow'
import { ReceiptThumb } from '../../components/dashboard/ReceiptThumb'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard, useKpi, useSummary, useBudgetVsActual } from '../../hooks/useAnalytics'
import { useReceipts } from '../../hooks/useReceipt'

const DASH_TREND_PERIODS = [
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Mo' },
  { value: '6months', label: '6 Mo' },
]

const getTrendDates = (period) => {
  const now = dayjs()
  switch (period) {
    case '3months':
      return {
        startDate: now.subtract(2, 'month').startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        groupBy: 'month',
      }
    case '6months':
      return {
        startDate: now.subtract(5, 'month').startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        groupBy: 'month',
      }
    default:
      return {
        startDate: now.startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        groupBy: 'day',
      }
  }
}

const getGreeting = () => {
  const hour = dayjs().hour()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const MomIcon = ({ pct }) => {
  if (Math.abs(pct) < 1) return <TrendingFlatIcon fontSize="small" />
  return pct > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
}

const KpiCard = ({ label, value, subValue, isLoading, valueColor, accentColor = 'primary.main' }) => (
  <Card sx={{ height: '100%', borderTop: '3px solid', borderColor: accentColor }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
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
        <Typography variant="caption" color="text.secondary">{subValue}</Typography>
      )}
    </CardContent>
  </Card>
)

const SeeAllChip = ({ label, to }) => {
  const navigate = useNavigate()
  return (
    <Chip
      label={label}
      size="small"
      onClick={() => navigate(to)}
      sx={{ fontSize: '0.72rem', cursor: 'pointer' }}
    />
  )
}

export default function DashboardPage() {
  const now = dayjs()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isFree = user?.tier === 'free'
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  const [trendPeriod, setTrendPeriod] = useState('month')
  const [scannerOpen, setScannerOpen] = useState(false)

  const year = now.year()
  const month = now.month() + 1
  const currentMonthStart = now.startOf('month').toISOString()
  const currentMonthEnd = now.endOf('month').toISOString()

  const trendDates = getTrendDates(trendPeriod)
  const threeMonthsAgo = now.subtract(3, 'month').startOf('month')
  const isTrendGated = isFree && dayjs(trendDates.startDate).isBefore(threeMonthsAgo)

  const { data: kpi, isLoading: kpiLoading } = useKpi(year, month)
  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: donutSummary } = useSummary(currentMonthStart, currentMonthEnd, 'category')
  const { data: trendSummary, isLoading: trendLoading, error: trendError } = useSummary(
    isTrendGated ? null : trendDates.startDate,
    isTrendGated ? null : trendDates.endDate,
    trendDates.groupBy
  )
  const { data: budgetVsActual = [], isLoading: budgetLoading } = useBudgetVsActual(year, month)
  const { data: receipts = [] } = useReceipts()

  const momPct = kpi?.momPctChange ?? 0
  const momColor = Math.abs(momPct) < 1 ? 'text.secondary' : momPct > 0 ? 'custom.spendRed' : 'custom.incomeGreen'

  const budgetHealthAccent = kpi?.budgetHealthScore != null
    ? kpi.budgetHealthScore >= 80 ? 'success.main'
    : kpi.budgetHealthScore >= 50 ? 'warning.main'
    : 'error.main'
    : 'primary.main'

  const recentExpenses = dashboard?.recent ?? []
  const recentReceipts = receipts.slice(0, 3)
  const topBudgets = budgetVsActual.slice(0, 3)

  return (
    <PageContainer maxWidth="lg">
      {/* Greeting Header */}
      <Box sx={{
        mb: 3,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
      }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {getGreeting()}, {firstName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Here&apos;s your financial snapshot for {now.format('MMMM YYYY')}
          </Typography>
        </Box>
        <Box sx={{
          px: 2, py: 0.75,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' },
        }}>
          <Typography variant="caption" color="text.secondary" display="block">Month total</Typography>
          {kpiLoading ? (
            <Skeleton width={60} height={24} />
          ) : (
            <Typography variant="h6" sx={{ color: 'custom.amountGold', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
              ${(kpi?.currentMonthTotal ?? 0).toFixed(0)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* KPI Strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="This Month"
            value={kpi ? `$${kpi.currentMonthTotal.toFixed(0)}` : null}
            isLoading={kpiLoading}
            valueColor="custom.amountGold"
            accentColor="custom.amountGold"
          />
        </Grid>
        <Grid item xs={6} md={3}>
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
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Top Category"
            isLoading={kpiLoading}
            value={kpi?.topCategory?.name ?? (kpiLoading ? null : 'None')}
            subValue={kpi?.topCategory ? `$${kpi.topCategory.total.toFixed(0)} this month` : null}
            accentColor="primary.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
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

      {/* Spending Trend */}
      <Card sx={{ mb: 3 }}>
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
              {DASH_TREND_PERIODS.map(p => (
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
              <SpendingTrendChart data={trendSummary?.totals ?? []} height={180} />
            )}
          </ProGate>
        </CardContent>
      </Card>

      {/* Category Donut + Budget Tracker */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
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
                height={240}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Budget Tracker" subheader={now.format('MMMM YYYY')} />
            <CardContent sx={{ pt: 1 }}>
              {budgetLoading ? (
                <Stack gap={2}>
                  {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={48} />)}
                </Stack>
              ) : topBudgets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No budgets set yet.
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate('/analytics')}>
                    Set budgets
                  </Button>
                </Box>
              ) : (
                <Box>
                  {topBudgets.map(item => (
                    <BudgetProgressBar
                      key={item.budget.id}
                      budget={item.budget}
                      actual={item.actual}
                      pct={item.pct}
                      status={item.status}
                    />
                  ))}
                  {budgetVsActual.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Showing 3 of {budgetVsActual.length} budgets
                    </Typography>
                  )}
                  <Divider sx={{ my: 1.5 }} />
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => navigate('/analytics')}
                  >
                    See full analytics →
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Expenses + Recent Receipts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Recent Expenses"
              action={<SeeAllChip label="See all →" to="/expenses" />}
            />
            <CardContent sx={{ pt: 1 }}>
              {dashLoading ? (
                <Stack gap={1.5}>
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={44} />)}
                </Stack>
              ) : recentExpenses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No expenses yet. Add your first one.
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate('/expenses')}>
                    Add expense
                  </Button>
                </Box>
              ) : (
                <Box>
                  {recentExpenses.map(expense => (
                    <RecentExpenseRow key={expense._id} expense={expense} />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  Recent Receipts
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SeeAllChip label="See all →" to="/receipts" />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon fontSize="small" />}
                    onClick={() => setScannerOpen(true)}
                    sx={{ py: 0.5, px: 1.25, fontSize: '0.72rem', minWidth: 0 }}
                  >
                    Upload
                  </Button>
                </Box>
              }
            />
            <CardContent sx={{ pt: 1 }}>
              {recentReceipts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No receipts uploaded yet.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => setScannerOpen(true)}
                  >
                    Upload first receipt
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {recentReceipts.map(receipt => (
                    <ReceiptThumb key={receipt._id} receipt={receipt} />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </PageContainer>
  )
}
