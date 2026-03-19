import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectionsPage } from '@/pages/projections-page'
import { renderWithProviders } from '@/test/test-utils'

const useProjectionsQueryMock = vi.fn()
const useCreateProjectionMutationMock = vi.fn()
const useUpdateProjectionMutationMock = vi.fn()

const createProjectionSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useProjectionsQuery: () => useProjectionsQueryMock(),
  useCreateProjectionMutation: (options?: unknown) => useCreateProjectionMutationMock(options),
  useUpdateProjectionMutation: (options?: unknown) => useUpdateProjectionMutationMock(options),
}))

describe('ProjectionsPage', () => {
  beforeEach(() => {
    createProjectionSpy.mockReset()
    useProjectionsQueryMock.mockReset()
    useCreateProjectionMutationMock.mockReset()
    useUpdateProjectionMutationMock.mockReset()

    useProjectionsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: 'projection-1',
          month: '2026-03-01',
          projected_revenue: 65000,
          projected_job_costs: 28000,
          projected_overhead: 6000,
          notes: 'Spring pipeline',
          created_at: '2026-02-01T00:00:00Z',
          net_cash_flow: 31000,
          ending_cash: 31000,
        },
      ],
    })

    useCreateProjectionMutationMock.mockReturnValue({
      mutateAsync: createProjectionSpy,
      error: null,
      isPending: false,
    })
    useUpdateProjectionMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
    })
  })

  it('renders projection totals and backend-computed cash fields', () => {
    window.resizeTo(1280, 900)

    renderWithProviders(<ProjectionsPage />)

    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByText('Projected Revenue')).toBeInTheDocument()
    expect(screen.getByText('Projected Outflows')).toBeInTheDocument()
    expect(screen.getAllByText('Ending Cash')).not.toHaveLength(0)
    expect(screen.getAllByText('$65,000').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$34,000').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$31,000').length).toBeGreaterThan(0)
    expect(screen.getByText('Mar 2026')).toBeInTheDocument()
  })

  it('normalizes month input before creating a projection', async () => {
    const user = userEvent.setup()
    window.resizeTo(768, 1024)

    renderWithProviders(<ProjectionsPage />)

    fireEvent.change(screen.getByLabelText(/Month/i, { selector: 'input' }), {
      target: { value: '2026-06' },
    })
    await user.clear(screen.getByLabelText(/Projected revenue/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/Projected revenue/i, { selector: 'input' }), '87000')
    await user.clear(screen.getByLabelText(/Projected job costs/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/Projected job costs/i, { selector: 'input' }), '41000')
    await user.clear(screen.getByLabelText(/Projected overhead/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/Projected overhead/i, { selector: 'input' }), '7500')
    await user.type(screen.getByLabelText(/Notes/i, { selector: 'textarea' }), 'Summer production ramp.')

    await user.click(screen.getByRole('button', { name: 'Create projection' }))

    expect(createProjectionSpy).toHaveBeenCalledWith({
      month: '2026-06-01',
      projected_revenue: 87000,
      projected_job_costs: 41000,
      projected_overhead: 7500,
      notes: 'Summer production ramp.',
    })
  })
})
