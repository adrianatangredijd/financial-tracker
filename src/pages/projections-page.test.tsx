import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectionsPage } from '@/pages/projections-page'
import { renderWithProviders } from '@/test/test-utils'

const useProjectionPlannerQueryMock = vi.fn()
const useDashboardQueryMock = vi.fn()
const useCreateProjectionPlannerRowMutationMock = vi.fn()
const useUpdateProjectionPlannerRowMutationMock = vi.fn()

const createProjectionRowSpy = vi.fn()
const updateProjectionRowSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useProjectionPlannerQuery: (year?: number) => useProjectionPlannerQueryMock(year),
  useDashboardQuery: () => useDashboardQueryMock(),
  useCreateProjectionPlannerRowMutation: () => useCreateProjectionPlannerRowMutationMock(),
  useUpdateProjectionPlannerRowMutation: () => useUpdateProjectionPlannerRowMutationMock(),
}))

vi.mock('@mui/x-charts', () => ({
  BarChart: () => <div>Bar Chart</div>,
  LineChart: () => <div>Line Chart</div>,
}))

describe('ProjectionsPage', () => {
  beforeEach(() => {
    createProjectionRowSpy.mockReset()
    updateProjectionRowSpy.mockReset()
    createProjectionRowSpy.mockResolvedValue(undefined)
    updateProjectionRowSpy.mockResolvedValue(undefined)
    useProjectionPlannerQueryMock.mockReset()
    useDashboardQueryMock.mockReset()
    useCreateProjectionPlannerRowMutationMock.mockReset()
    useUpdateProjectionPlannerRowMutationMock.mockReset()

    useProjectionPlannerQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        year: 2026,
        sections: [
          {
            key: 'collections',
            label: 'Collections from Sold Jobs',
            rows: [
              {
                id: 'row-1',
                year: 2026,
                section_key: 'collections',
                label: 'Jose 4 ADUs',
                sort_order: 0,
                cost_rate: 0.65,
                monthly_values: [
                  { month: 1, amount: 48000 },
                  { month: 2, amount: 68600 },
                  { month: 3, amount: 68600 },
                  { month: 4, amount: 68600 },
                  { month: 5, amount: 68600 },
                  { month: 6, amount: 68600 },
                  { month: 7, amount: 68600 },
                  { month: 8, amount: 68600 },
                  { month: 9, amount: 68600 },
                  { month: 10, amount: 60000 },
                  { month: 11, amount: 20000 },
                  { month: 12, amount: 10000 },
                ],
                total: 686800,
              },
            ],
            total_row: {
              id: 'collections-total',
              year: 2026,
              section_key: 'collections',
              label: 'TOTAL COLLECTIONS',
              sort_order: 0,
              cost_rate: 0,
              monthly_values: [
                { month: 1, amount: 48000 },
                { month: 2, amount: 68600 },
                { month: 3, amount: 68600 },
                { month: 4, amount: 68600 },
                { month: 5, amount: 68600 },
                { month: 6, amount: 68600 },
                { month: 7, amount: 68600 },
                { month: 8, amount: 68600 },
                { month: 9, amount: 68600 },
                { month: 10, amount: 60000 },
                { month: 11, amount: 20000 },
                { month: 12, amount: 10000 },
              ],
              total: 686800,
            },
          },
          {
            key: 'job_costs',
            label: 'Job Costs (65% of Collections)',
            rows: [],
            total_row: {
              id: 'job-costs-total',
              year: 2026,
              section_key: 'job_costs',
              label: 'TOTAL JOB COSTS',
              sort_order: 0,
              cost_rate: 0,
              monthly_values: monthValues([31200, 44590, 44590, 44590, 44590, 44590, 44590, 44590, 44590, 39000, 13000, 6500]),
              total: 446420,
            },
          },
          {
            key: 'gross_profit',
            label: 'Gross Profit',
            rows: [],
            total_row: {
              id: 'gross-profit',
              year: 2026,
              section_key: 'gross_profit',
              label: 'GROSS PROFIT',
              sort_order: 0,
              cost_rate: 0,
              monthly_values: monthValues([16800, 24010, 24010, 24010, 24010, 24010, 24010, 24010, 24010, 21000, 7000, 3500]),
              total: 240380,
            },
          },
          {
            key: 'overhead',
            label: 'Overhead Expenses',
            rows: [],
            total_row: {
              id: 'overhead-total',
              year: 2026,
              section_key: 'overhead',
              label: 'TOTAL OVERHEAD',
              sort_order: 0,
              cost_rate: 0,
              monthly_values: monthValues([30206, 33506, 35006, 34006, 34006, 34006, 35006, 36006, 36006, 36006, 39706, 36006]),
              total: 419472,
            },
          },
          {
            key: 'marketing',
            label: 'Marketing Expenses',
            rows: [],
            total_row: {
              id: 'marketing-total',
              year: 2026,
              section_key: 'marketing',
              label: 'TOTAL MARKETING',
              sort_order: 0,
              cost_rate: 0,
              monthly_values: monthValues([50, 7150, 8350, 8350, 8350, 8350, 8350, 8350, 8350, 8350, 8350, 8350]),
              total: 90650,
            },
          },
          {
            key: 'net_cash_flow',
            label: 'Net Cash Flow',
            rows: [],
            total_row: {
              id: 'net-cash-flow',
              year: 2026,
              section_key: 'net_cash_flow',
              label: 'NET CASH FLOW',
              sort_order: 0,
              cost_rate: 0,
              monthly_values: monthValues([-13456, -16646, -19346, -18346, -18346, -18346, -19346, -20346, -20346, -23356, -41056, -40856]),
              total: -265788,
            },
          },
        ],
        charts: {
          cash_balance_forecast: [
            { month: '2026-01', amount: -13456 },
            { month: '2026-02', amount: -30102 },
          ],
          collections_vs_total_expenses: [
            { month: '2026-01', revenue: 48000, expenses: 61456 },
            { month: '2026-02', revenue: 68600, expenses: 85246 },
          ],
        },
      },
    })
    useDashboardQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        revenue_vs_expenses: [
          { month: '2026-01', revenue: 50000, expenses: 60000 },
          { month: '2026-02', revenue: 72000, expenses: 81000 },
        ],
      },
      error: null,
    })
    useCreateProjectionPlannerRowMutationMock.mockReturnValue({
      mutateAsync: createProjectionRowSpy,
      error: null,
      isPending: false,
    })
    useUpdateProjectionPlannerRowMutationMock.mockReturnValue({
      mutateAsync: updateProjectionRowSpy,
      error: null,
      isPending: false,
    })
  })

  it('renders the annual planner layout with charts and section totals', () => {
    renderWithProviders(<ProjectionsPage />)

    expect(screen.getByRole('button', { name: 'Add Project' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '2026 Projections' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Actual vs Projected' })).toBeInTheDocument()
    expect(screen.getByText('Cash Balance Forecast')).toBeInTheDocument()
    expect(screen.getByText('Collections vs Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Collections from Sold Jobs')).toBeInTheDocument()
    expect(screen.getByText('TOTAL COLLECTIONS')).toBeInTheDocument()
    expect(screen.getByText('NET CASH FLOW')).toBeInTheDocument()
    expect(screen.getAllByText('Jose 4 ADUs').length).toBeGreaterThan(0)
  })

  it('creates a planner row from the dialog', async () => {
    renderWithProviders(<ProjectionsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Project' }))
    const dialog = screen.getByRole('dialog')
    const textInput = dialog.querySelector('input[type="text"]') as HTMLInputElement
    const numberInputs = dialog.querySelectorAll('input[type="number"]')
    fireEvent.change(textInput, { target: { value: 'Q2 ADU Alfredo' } })
    fireEvent.change(numberInputs[0] as HTMLInputElement, { target: { value: '0.65' } })
    fireEvent.change(numberInputs[1] as HTMLInputElement, { target: { value: '50000' } })
    fireEvent.change(numberInputs[2] as HTMLInputElement, { target: { value: '50000' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Create row' }))

    await waitFor(() => {
      expect(createProjectionRowSpy).toHaveBeenCalledWith({
        year: 2026,
        section_key: 'collections',
        label: 'Q2 ADU Alfredo',
        sort_order: 0,
        cost_rate: 0.65,
        monthly_values: [
          { month: 1, amount: 50000 },
          { month: 2, amount: 50000 },
          { month: 3, amount: 0 },
          { month: 4, amount: 0 },
          { month: 5, amount: 0 },
          { month: 6, amount: 0 },
          { month: 7, amount: 0 },
          { month: 8, amount: 0 },
          { month: 9, amount: 0 },
          { month: 10, amount: 0 },
          { month: 11, amount: 0 },
          { month: 12, amount: 0 },
        ],
      })
    })
  })

  it('edits an existing planner row', async () => {
    renderWithProviders(<ProjectionsPage />)

    fireEvent.click(screen.getByLabelText('Edit Jose 4 ADUs'))
    const dialog = screen.getByRole('dialog')
    const textInput = dialog.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(textInput, { target: { value: 'Jose 4 ADUs Updated' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save row' }))

    await waitFor(() => {
      expect(updateProjectionRowSpy).toHaveBeenCalled()
    })
  })
})

function monthValues(amounts: number[]) {
  return amounts.map((amount, index) => ({ month: index + 1, amount }))
}
