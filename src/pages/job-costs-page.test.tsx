import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JobCostsPage } from '@/pages/job-costs-page'
import { renderWithProviders } from '@/test/test-utils'

const useJobCostsQueryMock = vi.fn()
const useProjectsQueryMock = vi.fn()
const useCreateJobCostMutationMock = vi.fn()
const useDeleteJobCostMutationMock = vi.fn()

const createJobCostSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useJobCostsQuery: () => useJobCostsQueryMock(),
  useProjectsQuery: () => useProjectsQueryMock(),
  useCreateJobCostMutation: () => useCreateJobCostMutationMock(),
  useDeleteJobCostMutation: () => useDeleteJobCostMutationMock(),
}))

describe('JobCostsPage', () => {
  beforeEach(() => {
    createJobCostSpy.mockReset()
    createJobCostSpy.mockResolvedValue(undefined)
    useJobCostsQueryMock.mockReset()
    useProjectsQueryMock.mockReset()
    useCreateJobCostMutationMock.mockReset()
    useDeleteJobCostMutationMock.mockReset()

    useJobCostsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: 'cost-1',
          project_id: 'project-1',
          project_name: 'Jose 4 ADUs',
          date: '2026-03-13',
          category: 'labor',
          cost_type: 'timesheet_labor',
          description: 'Crew labor',
          vendor: 'Larry Serrano',
          projected_amount: 170,
          amount: 170,
          actual_amount: 170,
          variance: 0,
          status: 'Paid',
          payment_method: 'check',
          created_at: '2026-03-13T00:00:00Z',
        },
        {
          id: 'cost-2',
          project_id: 'project-2',
          project_name: 'Garcia Rehab',
          date: '2026-03-11',
          category: 'materials',
          cost_type: 'materials',
          description: 'Drywall materials',
          vendor: 'Supply House',
          projected_amount: 500,
          amount: 0,
          actual_amount: 0,
          variance: 500,
          status: 'Open',
          payment_method: 'ach',
          created_at: '2026-03-11T00:00:00Z',
        },
      ],
      error: null,
    })

    useProjectsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: 'project-1',
          name: 'Jose 4 ADUs',
          client_name: 'Jose A Lovo',
          project_address: '5749 Elmer Ave',
          contract_value: 686000,
          job_cost_budget: 92627,
          milestone_percent: 20,
          start_date: '2026-01-10',
          estimated_end_date: '2026-12-10',
          status: 'active',
          notes: '',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          total_revenue: 160030,
          total_job_costs: 39431,
          profit: 120599,
          profit_margin: 0.75,
        },
        {
          id: 'project-2',
          name: 'Garcia Rehab',
          client_name: 'Alejandro Garcia',
          project_address: '2633 Hill St',
          contract_value: 58460,
          job_cost_budget: 18248,
          milestone_percent: 37,
          start_date: '2026-01-10',
          estimated_end_date: '2026-12-10',
          status: 'active',
          notes: '',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          total_revenue: 36481,
          total_job_costs: 18248,
          profit: 18233,
          profit_margin: 0.5,
        },
      ],
      error: null,
    })

    useCreateJobCostMutationMock.mockReturnValue({
      mutateAsync: createJobCostSpy,
      error: null,
      isPending: false,
    })
    useDeleteJobCostMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
    })
  })

  it('renders the redesigned KPI cards and breakdown table', () => {
    renderWithProviders(<JobCostsPage />)

    expect(screen.getByRole('heading', { name: 'Job Costs' })).toBeInTheDocument()
    expect(screen.getAllByText('Sub Labor').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In-House').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Materials').length).toBeGreaterThan(0)
    expect(screen.getByText('Cost Breakdown by Project')).toBeInTheDocument()
    expect(screen.getAllByText('Jose 4 ADUs').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0)
  })

  it('filters the ledger by project', () => {
    renderWithProviders(<JobCostsPage />)

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter' }))
    fireEvent.click(screen.getByRole('option', { name: 'Jose 4 ADUs' }))

    expect(screen.getAllByText('Jose 4 ADUs').length).toBeGreaterThan(0)
    expect(screen.queryByText('Drywall materials')).not.toBeInTheDocument()
  })

  it('submits the add job cost dialog payload', async () => {
    renderWithProviders(<JobCostsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Job Cost' }))
    const dialog = screen.getByRole('dialog')
    const comboboxes = within(dialog).getAllByRole('combobox')
    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement

    fireEvent.mouseDown(comboboxes[0])
    fireEvent.click(screen.getByRole('option', { name: 'Jose 4 ADUs' }))
    fireEvent.change(dateInput, {
      target: { value: '2026-03-24' },
    })
    fireEvent.mouseDown(comboboxes[1])
    fireEvent.click(screen.getByRole('option', { name: 'Timesheet Labor' }))
    fireEvent.change(within(dialog).getByLabelText('Vendor', { selector: 'input' }), {
      target: { value: 'Kennedy Serrano' },
    })
    fireEvent.mouseDown(comboboxes[2])
    fireEvent.click(screen.getByRole('option', { name: 'Check' }))
    const numberInputs = dialog.querySelectorAll('input[type="number"]')
    fireEvent.change(numberInputs[0] as HTMLInputElement, {
      target: { value: '156' },
    })
    fireEvent.change(numberInputs[1] as HTMLInputElement, {
      target: { value: '156' },
    })
    fireEvent.change(within(dialog).getByLabelText('Description', { selector: 'textarea' }), {
      target: { value: 'Timesheet labor' },
    })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(createJobCostSpy).toHaveBeenCalledWith({
        project_id: 'project-1',
        date: '2026-03-24',
        category: 'labor',
        cost_type: 'timesheet_labor',
        description: 'Timesheet labor',
        vendor: 'Kennedy Serrano',
        projected_amount: 156,
        actual_amount: 156,
        payment_method: 'check',
      })
    })
  })
})
