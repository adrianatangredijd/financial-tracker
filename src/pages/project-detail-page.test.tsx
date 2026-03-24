import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ProjectDetailPage } from '@/pages/project-detail-page'
import { renderWithProviders } from '@/test/test-utils'

const useProjectDetailQueryMock = vi.fn()
const useCreatePaymentMutationMock = vi.fn()
const useDeletePaymentMutationMock = vi.fn()
const useCreateJobCostMutationMock = vi.fn()
const useDeleteJobCostMutationMock = vi.fn()
const useUpdateProjectMutationMock = vi.fn()

const createJobCostSpy = vi.fn()
const updateProjectSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useProjectDetailQuery: (projectId: string) => useProjectDetailQueryMock(projectId),
  useCreatePaymentMutation: () => useCreatePaymentMutationMock(),
  useDeletePaymentMutation: (projectId: string) => useDeletePaymentMutationMock(projectId),
  useCreateJobCostMutation: () => useCreateJobCostMutationMock(),
  useDeleteJobCostMutation: () => useDeleteJobCostMutationMock(),
  useUpdateProjectMutation: () => useUpdateProjectMutationMock(),
}))

function renderDetailPage() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/projects/project-1']}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>,
    { withRouter: false },
  )
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    createJobCostSpy.mockReset()
    updateProjectSpy.mockReset()
    createJobCostSpy.mockResolvedValue(undefined)
    updateProjectSpy.mockResolvedValue(undefined)
    useProjectDetailQueryMock.mockReset()
    useCreatePaymentMutationMock.mockReset()
    useDeletePaymentMutationMock.mockReset()
    useCreateJobCostMutationMock.mockReset()
    useDeleteJobCostMutationMock.mockReset()
    useUpdateProjectMutationMock.mockReset()

    useProjectDetailQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        project: {
          id: 'project-1',
          name: 'Jose 4 ADUs',
          client_name: 'Jose A Lovo',
          project_address: '5749 Elmer Ave, North Hollywood, CA',
          contract_value: 686000,
          job_cost_budget: 92627,
          milestone_percent: 20,
          start_date: '2026-01-10',
          estimated_end_date: '2026-12-10',
          status: 'active',
          notes: 'Main ADU package in progress.',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-15T00:00:00Z',
          total_revenue: 160030,
          total_job_costs: 92627,
          profit: 67403,
          profit_margin: 0.42,
        },
        payments: [
          {
            id: 'payment-1',
            project_id: 'project-1',
            date: '2026-03-17',
            amount: 25000,
            payment_method: 'check',
            description: 'Permit draw',
            created_at: '2026-03-17T00:00:00Z',
          },
        ],
        costs: [],
        cost_breakdown: [
          { category: 'labor', total: 6000 },
          { category: 'other', total: 25500 },
        ],
        projected_total: 92627,
        actual_spent: 92627,
        variance: 0,
        budget_items: [
          {
            id: 'cost-1',
            date: '2026-03-17',
            vendor: 'German Framer',
            category: 'labor',
            description: 'Back unit concrete',
            projected_amount: 6000,
            actual_amount: 6000,
            variance: 0,
            status: 'Paid',
          },
        ],
      },
      error: null,
      refetch: vi.fn(),
    })

    useCreatePaymentMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
    })
    useDeletePaymentMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
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
    useUpdateProjectMutationMock.mockReturnValue({
      mutateAsync: updateProjectSpy,
      error: null,
      isPending: false,
    })
  })

  it('renders the redesigned detail layout', () => {
    renderDetailPage()

    expect(screen.getByRole('heading', { name: 'Jose 4 ADUs' })).toBeInTheDocument()
    expect(screen.getAllByText('Projected').length).toBeGreaterThan(0)
    expect(screen.getByText('Actual Spent')).toBeInTheDocument()
    expect(screen.getAllByText('Variance').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: 'Expenses' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Budget vs Actual' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Payments' })).toBeInTheDocument()
    expect(screen.getByText('German Framer')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('submits an expense from the expense dialog', async () => {
    renderDetailPage()

    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Date/i, { selector: 'input' }), {
      target: { value: '2026-03-18' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Vendor/i, { selector: 'input' }), {
      target: { value: 'Fast Lane Pumping' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Category/i, { selector: 'select' }), {
      target: { value: 'materials' },
    })
    fireEvent.change(within(dialog).getAllByRole('spinbutton')[0], {
      target: { value: '4000' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Payment method/i, { selector: 'select' }), {
      target: { value: 'check' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Description/i, { selector: 'textarea' }), {
      target: { value: 'Concrete and pump' },
    })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Expense' }))

    await waitFor(() => {
      expect(createJobCostSpy).toHaveBeenCalledWith({
        project_id: 'project-1',
        date: '2026-03-18',
        category: 'materials',
        description: 'Concrete and pump',
        vendor: 'Fast Lane Pumping',
        amount: 4000,
        payment_method: 'check',
      })
    })
  })

  it('updates the project status from the header control', async () => {
    renderDetailPage()

    fireEvent.change(screen.getByDisplayValue('Active'), {
      target: { value: 'completed' },
    })

    await waitFor(() => {
      expect(updateProjectSpy).toHaveBeenCalled()
    })
  })
})
