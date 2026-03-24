import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectsPage } from '@/pages/projects-page'
import { renderWithProviders } from '@/test/test-utils'

const useProjectsQueryMock = vi.fn()
const useCreateProjectMutationMock = vi.fn()
const useUpdateProjectMutationMock = vi.fn()
const useDeleteProjectMutationMock = vi.fn()

const createProjectSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useProjectsQuery: () => useProjectsQueryMock(),
  useCreateProjectMutation: (options?: unknown) => useCreateProjectMutationMock(options),
  useUpdateProjectMutation: (options?: unknown) => useUpdateProjectMutationMock(options),
  useDeleteProjectMutation: () => useDeleteProjectMutationMock(),
}))

describe('ProjectsPage', () => {
  beforeEach(() => {
    createProjectSpy.mockReset()
    useProjectsQueryMock.mockReset()
    useCreateProjectMutationMock.mockReset()
    useUpdateProjectMutationMock.mockReset()
    useDeleteProjectMutationMock.mockReset()

    useProjectsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: 'project-1',
          name: 'Kitchen Remodel',
          client_name: 'Acme Homes',
          project_address: '101 Main Street',
          contract_value: 85000,
          job_cost_budget: 50000,
          milestone_percent: 65,
          start_date: '2026-01-10',
          estimated_end_date: '2026-03-15',
          status: 'active',
          notes: 'Cabinets approved',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-15T00:00:00Z',
          total_revenue: 30000,
          total_job_costs: 12000,
          profit: 18000,
          profit_margin: 0.6,
        },
      ],
    })

    useCreateProjectMutationMock.mockReturnValue({
      mutateAsync: createProjectSpy,
      error: null,
      isPending: false,
    })
    useUpdateProjectMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
    })
    useDeleteProjectMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
    })
  })

  it('renders project financial columns with formatted margin', () => {
    window.resizeTo(1280, 900)

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument()
    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument()
    expect(screen.getByText('Acme Homes')).toBeInTheDocument()
    expect(screen.getByText('$85,000')).toBeInTheDocument()
    expect(screen.getByText('$30,000')).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('hides lower-priority table columns on mobile widths', () => {
    window.resizeTo(375, 812)

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Client' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Address' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Project' })).toBeInTheDocument()
  })

  it('submits a create project payload from the form', async () => {
    window.resizeTo(1280, 900)

    renderWithProviders(<ProjectsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'New Project' }))

    fireEvent.change(screen.getByLabelText(/Project name/i, { selector: 'input' }), {
      target: { value: 'Office Refresh' },
    })
    fireEvent.change(screen.getByLabelText(/Client name/i, { selector: 'input' }), {
      target: { value: 'Northwind' },
    })
    fireEvent.change(screen.getByLabelText(/Project address/i, { selector: 'input' }), {
      target: { value: '88 Market Street' },
    })
    fireEvent.change(screen.getByLabelText(/Contract value/i, { selector: 'input' }), {
      target: { value: '95000' },
    })
    fireEvent.change(screen.getByLabelText(/Job cost budget/i, { selector: 'input' }), {
      target: { value: '64000' },
    })
    fireEvent.change(screen.getByLabelText(/Milestone progress %/i, { selector: 'input' }), {
      target: { value: '35' },
    })
    fireEvent.change(screen.getByLabelText(/Status/i, { selector: 'select' }), {
      target: { value: 'planning' },
    })
    fireEvent.change(screen.getByLabelText(/Start date/i, { selector: 'input' }), { target: { value: '2026-04-01' } })
    fireEvent.change(screen.getByLabelText(/Estimated end date/i, { selector: 'input' }), {
      target: { value: '2026-06-30' },
    })
    fireEvent.change(screen.getByLabelText(/Notes/i, { selector: 'textarea' }), {
      target: { value: 'Tenant improvement phase.' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(createProjectSpy).toHaveBeenCalledWith({
      name: 'Office Refresh',
      client_name: 'Northwind',
      project_address: '88 Market Street',
      contract_value: 95000,
      job_cost_budget: 64000,
      milestone_percent: 35,
      start_date: '2026-04-01',
      estimated_end_date: '2026-06-30',
      status: 'planning',
      notes: 'Tenant improvement phase.',
    })
  })
})
