import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@/pages/dashboard-page'
import { renderWithProviders } from '@/test/test-utils'

const useDashboardQueryMock = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useDashboardQuery: () => useDashboardQueryMock(),
}))

vi.mock('@/components/charts', () => ({
  BudgetActualChartPanel: ({ title }: { title: string }) => <div>{title}</div>,
  ComparisonBarChartPanel: ({ title }: { title: string }) => <div>{title}</div>,
  LineChartPanel: ({ title }: { title: string }) => <div>{title}</div>,
  ValueBarChartPanel: ({ title }: { title: string }) => <div>{title}</div>,
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    useDashboardQueryMock.mockReset()
    useDashboardQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        summary: {
          starting_cash: 0,
          current_cash: 120000,
          months_runway: 4.1,
          ytd_collections: 260000,
          ytd_expenses: 140000,
          gross_margin: 0.75,
          backlog: 788353,
        },
        today: {
          active_project_count: 5,
          current_month_overhead_count: 0,
          missing_recent_days: ['2026-03-13', '2026-03-12'],
        },
        active_projects: [
          {
            id: 'project-1',
            name: 'Jose 4 ADUs',
            status: 'active',
            progress_percent: 51,
            collected_revenue: 48000,
            contract_value: 686000,
          },
        ],
        revenue_vs_expenses: [{ month: '2026-01', revenue: 50000, expenses: 18000 }],
        cash_flow_trend: [{ month: '2026-01', amount: 32000 }],
        gross_margin_by_project: [{ label: 'Jose 4 ADUs', value: 75 }],
        backlog_by_project: [{ label: 'Jose 4 ADUs', value: 638000 }],
        ytd_budget_vs_actual: [{ month: '2026-01', budget: 35000, actual: 32000 }],
        cross_checks: [
          {
            title: 'Projects with costs but no collections',
            detail: '1 project(s) have job costs posted without any revenue collected.',
            severity: 'warning',
            count: 1,
          },
        ],
      },
      error: null,
    })
  })

  it('renders the richer dashboard sections and metrics', () => {
    renderWithProviders(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Current Cash Balance')).toBeInTheDocument()
    expect(screen.getByText('Months Runway')).toBeInTheDocument()
    expect(screen.getAllByText('$120,000').length).toBeGreaterThan(0)
    expect(screen.getByText('$260,000')).toBeInTheDocument()
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
    expect(screen.getByText('Jose 4 ADUs')).toBeInTheDocument()
    expect(screen.getByText('Revenue vs Expenses')).toBeInTheDocument()
    expect(screen.getByText('Cash Flow Trend')).toBeInTheDocument()
    expect(screen.getByText('Gross Margin by Project')).toBeInTheDocument()
    expect(screen.getByText('Backlog - Pipeline Strength')).toBeInTheDocument()
    expect(screen.getByText('YTD Budget vs Actual')).toBeInTheDocument()
    expect(screen.getByText('Data Cross-Check')).toBeInTheDocument()
  })

  it('renders on mobile width without dropping dashboard sections', () => {
    window.resizeTo(375, 812)

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Current Cash Balance')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Log job costs/i })).toBeInTheDocument()
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
  })

  it('renders on tablet width without dropping dashboard sections', () => {
    window.resizeTo(768, 1024)

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Revenue vs Expenses')).toBeInTheDocument()
    expect(screen.getByText('YTD Budget vs Actual')).toBeInTheDocument()
    expect(screen.getByText('Data Cross-Check')).toBeInTheDocument()
  })
})
