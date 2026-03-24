import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@/pages/dashboard-page'
import { renderWithProviders } from '@/test/test-utils'

const useDashboardQueryMock = vi.fn()
const useProjectsQueryMock = vi.fn()
const useJobCostsQueryMock = vi.fn()
const useOverheadQueryMock = vi.fn()
const useProjectionsQueryMock = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useDashboardQuery: () => useDashboardQueryMock(),
  useProjectsQuery: () => useProjectsQueryMock(),
  useJobCostsQuery: () => useJobCostsQueryMock(),
  useOverheadQuery: () => useOverheadQueryMock(),
  useProjectionsQuery: () => useProjectionsQueryMock(),
}))

vi.mock('@mui/x-charts', () => ({
  BarChart: () => <div>Bar Chart</div>,
  LineChart: () => <div>Line Chart</div>,
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    useDashboardQueryMock.mockReset()
    useProjectsQueryMock.mockReset()
    useJobCostsQueryMock.mockReset()
    useOverheadQueryMock.mockReset()
    useProjectionsQueryMock.mockReset()
    useDashboardQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        summary: {
          current_cash: 120000,
          total_collections: 260000,
          total_job_costs: 100000,
          total_overhead: 40000,
          gross_profit: 160000,
          net_profit: 120000,
          backlog: 788353,
          active_project_count: 5,
          over_budget_projects: 1,
          average_gross_margin: 0.62,
        },
        project_progress: [
          {
            id: 'project-1',
            name: 'Jose 4 ADUs',
            budget: 400000,
            spent: 320000,
            progress_percent: 51,
            status: 'On Track',
            budget_consumption_percent: 80,
          },
        ],
        cash_flow_forecast: [
          { month: '2026-01', actual_cash: 80000 },
          { month: '2026-02', actual_cash: 95000, projected_cash: 100000 },
        ],
        profit_loss: {
          revenue: 260000,
          job_costs: 100000,
          gross_profit: 160000,
          overhead: 40000,
          net_profit: 120000,
        },
        break_even: {
          monthly_overhead: 12000,
          break_even_point: 12000,
          revenue_run_rate: 35000,
          surplus: 23000,
          coverage_ratio: 2.9,
        },
        job_cost_health: [
          {
            id: 'project-1',
            name: 'Jose 4 ADUs',
            budget: 400000,
            spent: 320000,
            progress_percent: 51,
            status: 'On Track',
            budget_consumption_percent: 80,
          },
        ],
        revenue_vs_expenses: [{ month: '2026-01', revenue: 50000, expenses: 18000 }],
        cash_flow_trend: [{ month: '2026-01', amount: 32000 }],
        gross_margin_by_project: [
          {
            project: 'Jose 4 ADUs',
            collected: 48000,
            costs: 18000,
            profit: 30000,
            margin_percent: 62.5,
          },
        ],
        backlog_pipeline: {
          summary: {
            total_contracted: 900000,
            collected: 112000,
            remaining: 788000,
          },
          items: [
            {
              project: 'Jose 4 ADUs',
              contract: 686000,
              remaining: 638000,
              billed_percent: 7,
              milestone_percent: 51,
            },
          ],
        },
        budget_vs_actual: [{ metric: 'Collections', budget: 300000, actual: 260000, variance: -40000 }],
        data_cross_check: [
          {
            month: '2026-01',
            collections_actual: 50000,
            collections_payments: 50000,
            overhead_actual: 6000,
            overhead_logs: 6000,
            job_costs_actual: 12000,
            job_costs_expected: 15000,
          },
        ],
      },
      error: null,
    })

    useProjectsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: 'project-1',
          name: 'Jose 4 ADUs',
          client_name: 'Acme',
          project_address: '123 Main St',
          contract_value: 686000,
          job_cost_budget: 400000,
          milestone_percent: 51,
          start_date: '2026-01-01',
          estimated_end_date: '2026-12-31',
          status: 'active',
          notes: '',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          total_revenue: 48000,
          total_job_costs: 18000,
          profit: 30000,
          profit_margin: 0.625,
        },
      ],
      error: null,
    })
    useJobCostsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
    })
    useOverheadQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], summary: { monthly_total: 0, yearly_total: 0 } },
      error: null,
    })
    useProjectionsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      error: null,
    })
  })

  it('renders the command center sections and metrics', () => {
    renderWithProviders(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Current Cash')).toBeInTheDocument()
    expect(screen.getAllByText('Gross Profit').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$120,000').length).toBeGreaterThan(0)
    expect(screen.getByText('Project Progress')).toBeInTheDocument()
    expect(screen.getByText('12-Month Cash Flow Forecast')).toBeInTheDocument()
    expect(screen.getByText('Profit & Loss Statement')).toBeInTheDocument()
    expect(screen.getByText('Break-Even Analysis')).toBeInTheDocument()
    expect(screen.getByText('Job Cost Health')).toBeInTheDocument()
    expect(screen.getAllByText('Jose 4 ADUs').length).toBeGreaterThan(0)
    expect(screen.getByText('Revenue vs Expenses')).toBeInTheDocument()
    expect(screen.getByText('Cash Flow Trend')).toBeInTheDocument()
    expect(screen.getByText('Gross Margin by Project')).toBeInTheDocument()
    expect(screen.getByText('Backlog / Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument()
    expect(screen.getByText('Data Cross-Check')).toBeInTheDocument()
  })

  it('renders on mobile width without dropping dashboard sections', () => {
    window.resizeTo(375, 812)

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Current Cash')).toBeInTheDocument()
    expect(screen.getByText('12-Month Cash Flow Forecast')).toBeInTheDocument()
    expect(screen.getByText('Project Progress')).toBeInTheDocument()
  })

  it('renders on tablet width without dropping dashboard sections', () => {
    window.resizeTo(768, 1024)

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Revenue vs Expenses')).toBeInTheDocument()
    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument()
    expect(screen.getByText('Data Cross-Check')).toBeInTheDocument()
  })
})
