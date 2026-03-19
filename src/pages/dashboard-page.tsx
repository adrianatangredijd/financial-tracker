import { ArrowOutward } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import {
  BudgetActualChartPanel,
  ComparisonBarChartPanel,
  LineChartPanel,
  ValueBarChartPanel,
} from '@/components/charts'
import {
  DashboardCrossCheckList,
  DashboardHeroMetricCard,
  DashboardProjectList,
  DashboardProjectListItem,
  MetricCard,
  PageHeader,
  SectionCard,
  StateNotice,
  StatusBadge,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import { useDashboardQuery } from '@/lib/api/hooks'
import { formatCurrency, formatDate, formatDecimal, formatPercent } from '@/lib/utils'

export function DashboardPage() {
  const dashboardQuery = useDashboardQuery()

  if (dashboardQuery.isLoading) {
    return (
      <Box display="grid" gap={3}>
        <PageHeader
          title="Dashboard"
          description="Track current cash position, revenue, cost pressure, and month-over-month trends."
        />
        <Box
          display="grid"
          gap={2}
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                animation: 'pulse 1.8s ease-in-out infinite',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                height: 144,
              }}
            />
          ))}
        </Box>
      </Box>
    )
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Box display="grid" gap={3}>
        <PageHeader
          title="Dashboard"
          description="Track current cash position, revenue, cost pressure, and month-over-month trends."
        />
        <StateNotice
          title="Dashboard unavailable"
          description={getApiErrorMessage(dashboardQuery.error)}
        />
      </Box>
    )
  }

  const metrics = dashboardQuery.data

  return (
    <Box display="grid" gap={3}>
      <PageHeader
        title="Dashboard"
        description="Real-time from your records."
      />

      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{ xs: '1fr', xl: 'minmax(0, 1.7fr) repeat(5, minmax(0, 1fr))' }}
      >
        <Box sx={{ gridColumn: { xs: 'auto', xl: 'span 2' } }}>
          <DashboardHeroMetricCard
            subtitle={`${formatCurrency(metrics.summary.starting_cash)} start + ${formatCurrency(metrics.summary.ytd_collections)} in - ${formatCurrency(metrics.summary.ytd_expenses)} out`}
            title="Current Cash Balance"
            value={formatCurrency(metrics.summary.current_cash)}
          />
        </Box>
        <MetricCard
          helper="Average runway using the most recent expense pace."
          label="Months Runway"
          value={formatDecimal(metrics.summary.months_runway)}
        />
        <MetricCard
          helper="Collected revenue in the current calendar year."
          label="YTD Collections"
          value={formatCurrency(metrics.summary.ytd_collections)}
        />
        <MetricCard
          helper="Job costs plus overhead in the current calendar year."
          label="YTD Expenses"
          value={formatCurrency(metrics.summary.ytd_expenses)}
        />
        <MetricCard
          helper="Collections less direct job costs."
          label="Gross Margin"
          value={formatPercent(metrics.summary.gross_margin)}
        />
        <MetricCard
          helper="Remaining contract value on planning and active work."
          label="Backlog"
          value={formatCurrency(metrics.summary.backlog)}
        />
      </Box>

      <SectionCard title={`Today - ${formatDate(new Date().toISOString())}`}>
        <Stack divider={<Divider flexItem />} spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={RouterLink} startIcon={<ArrowOutward />} to="/job-costs" variant="contained">
                Log job costs
              </Button>
              <Chip
                label={`${metrics.today.active_project_count} active projects`}
                sx={{ fontWeight: 600 }}
                variant="outlined"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={RouterLink} startIcon={<ArrowOutward />} to="/overhead" variant="outlined">
                Log overhead
              </Button>
              <Chip
                color={metrics.today.current_month_overhead_count > 0 ? 'primary' : 'default'}
                label={
                  metrics.today.current_month_overhead_count > 0
                    ? `${metrics.today.current_month_overhead_count} this month`
                    : 'None yet (OK if none)'
                }
                sx={{ fontWeight: 600 }}
                variant="outlined"
              />
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography fontWeight={700} variant="body2">
              Missing recent days
            </Typography>
            {metrics.today.missing_recent_days.length === 0 ? (
              <Alert severity="success" variant="outlined">
                No recent missing activity days detected.
              </Alert>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Missing {metrics.today.missing_recent_days.length} recent day(s):{' '}
                {metrics.today.missing_recent_days.map((day) => formatDate(day)).join(', ')}
              </Typography>
            )}
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard
        actions={
          <Button component={RouterLink} endIcon={<ArrowOutward />} to="/projects" variant="text">
            View all
          </Button>
        }
        description="Open work sorted by contract strength and current collected progress."
        title="Active Projects"
      >
        <DashboardProjectList
          emptyState="No active projects available yet."
          items={metrics.active_projects.map((project) => (
            <Box key={project.id}>
              <DashboardProjectListItem
                amountLabel={`${formatCurrency(project.collected_revenue)} / ${formatCurrency(project.contract_value)}`}
                progressLabel={`${Math.round(project.progress_percent)}% collected`}
                progressValue={project.progress_percent}
                title={project.name}
              />
              <Stack direction="row" justifyContent="space-between" pb={1}>
                <StatusBadge value={project.status} />
                <Button
                  component={RouterLink}
                  endIcon={<ArrowOutward />}
                  size="small"
                  to={`/projects/${project.id}`}
                  variant="text"
                >
                  Open
                </Button>
              </Stack>
            </Box>
          ))}
        />
      </SectionCard>

      <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}>
        <ComparisonBarChartPanel
          data={metrics.revenue_vs_expenses}
          description="Monthly collections against direct and overhead spend."
          title="Revenue vs Expenses"
        />
        <LineChartPanel
          title="Cash Flow Trend"
          description="Running net cash based on monthly inflows minus outflows."
          data={metrics.cash_flow_trend}
        />
      </Box>

      <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}>
        <ValueBarChartPanel
          data={metrics.gross_margin_by_project}
          description="Project gross margin percentage ranked from strongest to weakest."
          title="Gross Margin by Project"
          valueKind="percent"
        />
        <ValueBarChartPanel
          data={metrics.backlog_by_project}
          description="Remaining contract value on open work, ranked by pipeline strength."
          title="Backlog - Pipeline Strength"
        />
      </Box>

      <BudgetActualChartPanel
        data={metrics.ytd_budget_vs_actual}
        description="Monthly net cash budget from projections compared with actual monthly net cash."
        title="YTD Budget vs Actual"
      />

      <SectionCard
        description="Operational alerts that help you sanity-check project and cash records."
        title="Data Cross-Check"
      >
        <DashboardCrossCheckList items={metrics.cross_checks} />
      </SectionCard>
    </Box>
  )
}
