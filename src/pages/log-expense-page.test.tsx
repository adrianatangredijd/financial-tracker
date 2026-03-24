import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LogExpensePage } from '@/pages/log-expense-page'
import { renderWithProviders } from '@/test/test-utils'

const useProjectsQueryMock = vi.fn()
const useCreateLogExpenseMutationMock = vi.fn()

const createLogExpenseSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useProjectsQuery: () => useProjectsQueryMock(),
  useCreateLogExpenseMutation: () => useCreateLogExpenseMutationMock(),
}))

describe('LogExpensePage', () => {
  beforeEach(() => {
    createLogExpenseSpy.mockReset()
    createLogExpenseSpy.mockResolvedValue({ destination: 'overhead' })
    useProjectsQueryMock.mockReset()
    useCreateLogExpenseMutationMock.mockReset()

    useProjectsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: 'project-1',
          name: 'Jose 4 ADUs',
          client_name: 'Jose A Lovo',
        },
      ],
      error: null,
    })

    useCreateLogExpenseMutationMock.mockReturnValue({
      mutateAsync: createLogExpenseSpy,
      error: null,
      isPending: false,
    })
  })

  it('renders the two-step intake screen', () => {
    renderWithProviders(<LogExpensePage />)

    expect(screen.getByRole('heading', { name: 'Log Expense' })).toBeInTheDocument()
    expect(screen.getByText('1. Enter Details')).toBeInTheDocument()
    expect(screen.getByText('2. Review & Save')).toBeInTheDocument()
    expect(screen.getByLabelText('Project')).toBeInTheDocument()
  })

  it('routes none project expenses to overhead', async () => {
    renderWithProviders(<LogExpensePage />)

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    const amountInput = document.querySelector('input[type="number"]') as HTMLInputElement
    const textInputs = document.querySelectorAll('input[type="text"]')
    const descriptionInput = document.querySelector('textarea') as HTMLTextAreaElement
    const comboboxes = screen.getAllByRole('combobox')

    fireEvent.change(dateInput, { target: { value: '2026-03-24' } })
    fireEvent.mouseDown(comboboxes[0])
    fireEvent.click(screen.getByRole('option', { name: 'Check' }))
    fireEvent.change(textInputs[0] as HTMLInputElement, { target: { value: 'Verizon' } })
    fireEvent.change(descriptionInput, { target: { value: 'Monthly vehicle insurance' } })
    fireEvent.change(amountInput, { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review Classification' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(createLogExpenseSpy).toHaveBeenCalledWith({
        date: '2026-03-24',
        payment_method: 'check',
        vendor: 'Verizon',
        description: 'Monthly vehicle insurance',
        amount: 250,
        project_id: undefined,
        has_receipt: false,
        cost_type: undefined,
      })
    })
  })

  it('requires cost type when project is selected', async () => {
    renderWithProviders(<LogExpensePage />)

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    const amountInput = document.querySelector('input[type="number"]') as HTMLInputElement
    const textInputs = document.querySelectorAll('input[type="text"]')
    const descriptionInput = document.querySelector('textarea') as HTMLTextAreaElement
    const comboboxes = screen.getAllByRole('combobox')

    fireEvent.change(dateInput, { target: { value: '2026-03-24' } })
    fireEvent.mouseDown(comboboxes[0])
    fireEvent.click(screen.getByRole('option', { name: 'Check' }))
    fireEvent.change(textInputs[0] as HTMLInputElement, { target: { value: 'Larry Serrano' } })
    fireEvent.change(descriptionInput, { target: { value: 'Crew labor' } })
    fireEvent.change(amountInput, { target: { value: '170' } })
    fireEvent.mouseDown(comboboxes[1])
    fireEvent.click(screen.getByRole('option', { name: /Jose 4 ADUs/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Review Classification' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Select a cost type for project expenses before saving.')).toBeInTheDocument()
  })
})
