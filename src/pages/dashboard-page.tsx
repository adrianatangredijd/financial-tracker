import { Box, Chip, Divider, Grid, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { BarChart, LineChart } from '@mui/x-charts'

import { MetricCard, PageHeader, SectionCard, StateNotice, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import { useDashboardQuery } from '@/lib/api/hooks'
import type { DashboardProjectMargin } from '@/lib/api/types'
import { formatCurrency, formatMonthLabel } from '@/lib/utils'

function BudgetStatusChip({ status }: { status: string }) {
  return <Chip color={status === 'Over Budget' ? 'error' : 'success'} label={status} size="small" />
}

function ProgressList({
  rows,
  progressLabel,
}: {
  rows: Array<{
    id: string
    name: string
    budget: number
    spent: number
    progress_percent: number
    status: string
    budget_consumption_percent: number
  }>
  progressLabel: string
}) {
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No projects available yet.
      </Typography>
    )
  }

  return (
    <Stack divider={<Divider flexItem />} spacing={1.5}>
      {rows.map((row) => {
        const progressValue = Math.max(0, Math.min(row.budget_consumption_percent, 100))
        const isOver = row.status === 'Over Budget'
        return (
          <Stack key={row.id} spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
              <Box>
                <Typography fontWeight={600} variant="body2">
                  {row.name}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Spent: {formatCurrency(row.spent)} / {formatCurrency(row.budget)}
                </Typography>
              </Box>
              <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.5}>
                <BudgetStatusChip status={row.status} />
                <Typography color="text.secondary" variant="caption">
                  {progressLabel}: {row.progress_percent.toFixed(0)}%
                </Typography>
              </Stack>
            </Stack>
            <LinearProgress
              color={isOver ? 'error' : 'success'}
              value={progressValue}
              variant="determinate"
            />
          </Stack>
        )
      })}
    </Stack>
  )
}

function CommandCenterTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header} sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row[0]}-${index}`} hover>
              {row.map((cell, cellIndex) => (
                <TableCell key={`${row[0]}-${index}-${cellIndex}`} sx={{ fontSize: '0.8rem' }}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function DashboardPage() {
  const theme = useTheme()
  const dashboardQuery = useDashboardQuery()

  if (dashboardQuery.isLoading) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Dashboard"
          description="Real-time financial overview"
        />
        <TableSkeleton rows={8} height={780} />
      </Stack>
    )
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Dashboard"
          description="Real-time financial overview"
        />
        <StateNotice title="Dashboard unavailable" description={getApiErrorMessage(dashboardQuery.error)} />
      </Stack>
    )
  }

  const metrics = dashboardQuery.data

  const revenueExpenseLabels = metrics.revenue_vs_expenses.map((point) => formatMonthLabel(point.month))
  const cashTrendLabels = metrics.cash_flow_trend.map((point) => formatMonthLabel(point.month))
  const forecastLabels = metrics.cash_flow_forecast.map((point) => formatMonthLabel(point.month))

  const grossMarginColumns: GridColDef<DashboardProjectMargin>[] = [
    { field: 'project', headerName: 'Project', flex: 1.5, minWidth: 200 },
    {
      field: 'collected',
      headerName: 'Collected',
      minWidth: 120,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'costs',
      headerName: 'Costs',
      minWidth: 120,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'profit',
      headerName: 'Profit',
      minWidth: 120,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'margin_percent',
      headerName: 'Margin %',
      minWidth: 100,
      valueFormatter: (value) => `${Number(value).toFixed(1)}%`,
    },
  ]

  const aboveBreakEven = metrics.break_even.surplus >= 0
  const grossMarginPct = metrics.profit_loss.revenue > 0
    ? ((metrics.profit_loss.gross_profit / metrics.profit_loss.revenue) * 100).toFixed(0)
    : '0'
  const netMarginPct = metrics.profit_loss.revenue > 0
    ? ((metrics.profit_loss.net_profit / metrics.profit_loss.revenue) * 100).toFixed(0)
    : '0'

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Dashboard"
        description="Real-time from your records"
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            helper={`${metrics.summary.total_project_count} projects across the portfolio`}
            label="Current Cash"
            value={formatCurrency(metrics.summary.current_cash)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            helper={`${metrics.summary.total_job_cost_count} job cost entries posted`}
            label="Gross Profit"
            value={formatCurrency(metrics.summary.gross_profit)}
            valueColor={metrics.summary.gross_profit >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            helper={`${metrics.summary.total_overhead_count} overhead entries logged`}
            label="Net Profit"
            value={formatCurrency(metrics.summary.net_profit)}
            valueColor={metrics.summary.net_profit >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            helper={`${metrics.summary.total_projection_count} forecast month(s) loaded`}
            label="Backlog"
            value={formatCurrency(metrics.summary.backlog)}
          />
        </Grid>
      </Grid>

      <SectionCard
        description="Budget consumption and delivery progress for active and planning work."
        title="Project Progress"
      >
        <ProgressList progressLabel="Progress" rows={metrics.project_progress} />
      </SectionCard>

      <SectionCard
        description="Historical cash position against projected ending cash by month."
        title="12-Month Cash Flow Forecast"
      >
        <Box sx={{ height: 320 }}>
          <LineChart
            height={320}
            margin={{ bottom: 24, left: 72, right: 24, top: 16 }}
            series={[
              {
                label: 'Actual Cash',
                data: metrics.cash_flow_forecast.map((point) => point.actual_cash ?? null),
                color: theme.palette.success.main,
              },
              {
                label: 'Projected Cash',
                data: metrics.cash_flow_forecast.map((point) => point.projected_cash ?? null),
                color: theme.palette.warning.main,
              },
            ]}
            xAxis={[{ scaleType: 'point', data: forecastLabels }]}
          />
        </Box>
      </SectionCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard
            title="Profit & Loss Statement"
            actions={
              <Stack direction="row" spacing={1}>
                <Chip color="success" label={`Gross Margin: ${grossMarginPct}%`} size="small" variant="filled" />
                <Chip color={metrics.profit_loss.net_profit >= 0 ? 'success' : 'error'} label={`Net Margin: ${netMarginPct}%`} size="small" variant="filled" />
              </Stack>
            }
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, border: 0, pl: 0 }} />
                  <TableCell align="right" sx={{ fontWeight: 700, border: 0 }}>YTD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ pl: 0 }}>Revenue (Collections)</TableCell>
                  <TableCell align="right">
                    <Typography color="success.main" fontWeight={600} variant="body2">{formatCurrency(metrics.profit_loss.revenue)}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 0 }}>Job Costs (COGS)</TableCell>
                  <TableCell align="right">
                    <Typography color="error.main" fontWeight={600} variant="body2">({formatCurrency(Math.abs(metrics.profit_loss.job_costs))})</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 0, fontWeight: 700 }}>Gross Profit</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} variant="body2">{formatCurrency(metrics.profit_loss.gross_profit)}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 0 }}>Overhead</TableCell>
                  <TableCell align="right">
                    <Typography color="error.main" fontWeight={600} variant="body2">({formatCurrency(Math.abs(metrics.profit_loss.overhead))})</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 0, fontWeight: 700, borderBottom: 0 }}>Net Profit</TableCell>
                  <TableCell align="right" sx={{ borderBottom: 0 }}>
                    <Typography color={metrics.profit_loss.net_profit >= 0 ? 'success.main' : 'error.main'} fontWeight={700} variant="body2">
                      {formatCurrency(metrics.profit_loss.net_profit)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard
            title="Break-Even Analysis"
            actions={
              <Chip
                color={aboveBreakEven ? 'success' : 'error'}
                label={aboveBreakEven ? 'Above Break-Even' : 'Below Break-Even'}
                size="small"
              />
            }
          >
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography color="text.secondary" textTransform="uppercase" variant="caption" fontWeight={600}>Monthly Overhead</Typography>
                  <Typography fontWeight={700} variant="body1">{formatCurrency(metrics.break_even.monthly_overhead)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography color="text.secondary" textTransform="uppercase" variant="caption" fontWeight={600}>Break-Even</Typography>
                  <Typography color="error.main" fontWeight={700} variant="body1">{formatCurrency(metrics.break_even.break_even_point)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography color="text.secondary" textTransform="uppercase" variant="caption" fontWeight={600}>Revenue Run Rate</Typography>
                  <Typography fontWeight={700} variant="body1">{formatCurrency(metrics.break_even.revenue_run_rate)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography color="text.secondary" textTransform="uppercase" variant="caption" fontWeight={600}>Surplus</Typography>
                  <Typography color={metrics.break_even.surplus >= 0 ? 'success.main' : 'error.main'} fontWeight={700} variant="body1">
                    {formatCurrency(metrics.break_even.surplus)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography color="text.secondary" textTransform="uppercase" variant="caption" fontWeight={600}>Coverage Ratio</Typography>
                  <Typography color={metrics.break_even.coverage_ratio >= 1 ? 'success.main' : 'error.main'} fontWeight={700} variant="body1">
                    {metrics.break_even.coverage_ratio.toFixed(1)}x
                  </Typography>
                </Grid>
              </Grid>

              <Typography color="text.secondary" variant="caption">
                Revenue must cover {formatCurrency(metrics.break_even.break_even_point)}/mo in fixed costs before profit.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        description="Direct-cost budget consumption across the portfolio."
        title="Job Cost Health"
      >
        <ProgressList progressLabel="Milestone" rows={metrics.job_cost_health} />
      </SectionCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <SectionCard title="Revenue vs Expenses" description="Monthly collections compared with total monthly spend.">
            <Box sx={{ height: 300 }}>
              <BarChart
                height={300}
                margin={{ bottom: 24, left: 72, right: 24, top: 16 }}
                series={[
                  {
                    label: 'Revenue',
                    data: metrics.revenue_vs_expenses.map((point) => point.revenue),
                    color: theme.palette.success.main,
                  },
                  {
                    label: 'Expenses',
                    data: metrics.revenue_vs_expenses.map((point) => point.expenses),
                    color: theme.palette.error.main,
                  },
                ]}
                xAxis={[{ scaleType: 'band', data: revenueExpenseLabels }]}
              />
            </Box>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <SectionCard title="Cash Flow Trend" description="Running net cash based on monthly inflows minus outflows.">
            <Box sx={{ height: 300 }}>
              <LineChart
                height={300}
                margin={{ bottom: 24, left: 72, right: 24, top: 16 }}
                series={[
                  {
                    label: 'Cash Flow Trend',
                    data: metrics.cash_flow_trend.map((point) => point.amount),
                    color: theme.palette.success.main,
                  },
                ]}
                xAxis={[{ scaleType: 'point', data: cashTrendLabels }]}
              />
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        description="Collected revenue, job costs, and gross margin by project."
        title="Gross Margin by Project"
      >
        <Box sx={{ height: 380, width: '100%' }}>
          <DataGrid
            columns={grossMarginColumns}
            disableRowSelectionOnClick
            hideFooter
            rows={metrics.gross_margin_by_project.map((row) => ({ ...row, id: row.project }))}
            sx={{ border: 0 }}
          />
        </Box>
      </SectionCard>

      <SectionCard
        description="Contracted value, billed progress, and remaining pipeline by project."
        title="Backlog / Pipeline"
      >
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                helper="Open contract value in planning and active work."
                label="Total Contracted"
                value={formatCurrency(metrics.backlog_pipeline.summary.total_contracted)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                helper="Collected to date across open work."
                label="Collected"
                value={formatCurrency(metrics.backlog_pipeline.summary.collected)}
                valueColor="success.main"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <MetricCard
                helper="Remaining contract value still to be billed."
                label="Remaining"
                value={formatCurrency(metrics.backlog_pipeline.summary.remaining)}
              />
            </Grid>
          </Grid>
          <CommandCenterTable
            headers={['Project', 'Contract', 'Remaining', '% Billed', 'Milestone %']}
            rows={metrics.backlog_pipeline.items.map((item) => [
              item.project,
              formatCurrency(item.contract),
              formatCurrency(item.remaining),
              `${item.billed_percent.toFixed(0)}%`,
              `${item.milestone_percent.toFixed(0)}%`,
            ])}
          />
        </Stack>
      </SectionCard>

      <SectionCard
        description="Budget targets compared with actual company performance."
        title="Budget vs Actual"
      >
        <CommandCenterTable
          headers={['Metric', 'Budget', 'Actual', 'Variance']}
          rows={metrics.budget_vs_actual.map((item) => [
            item.metric,
            formatCurrency(item.budget),
            formatCurrency(item.actual),
            formatCurrency(item.variance),
          ])}
        />
      </SectionCard>

      <SectionCard
        description="Source-level validation across collections, overhead, and job costs by month."
        title="Data Cross-Check"
      >
        <CommandCenterTable
          headers={[
            'Month',
            'Collections (Actual)',
            'Collections (Payments)',
            'Overhead (Actual)',
            'Overhead (Logs)',
            'Job Costs (Actual)',
            'Job Costs (Expected)',
          ]}
          rows={metrics.data_cross_check.map((item) => [
            formatMonthLabel(item.month),
            formatCurrency(item.collections_actual),
            formatCurrency(item.collections_payments),
            formatCurrency(item.overhead_actual),
            formatCurrency(item.overhead_logs),
            formatCurrency(item.job_costs_actual),
            formatCurrency(item.job_costs_expected),
          ])}
        />
      </SectionCard>
    </Stack>
  )
}
