import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OverheadPage } from '@/pages/overhead-page'
import { renderWithProviders } from '@/test/test-utils'

const useOverheadFilteredQueryMock = vi.fn()
const useCreateOverheadMutationMock = vi.fn()
const useUpdateOverheadMutationMock = vi.fn()
const useDeleteOverheadMutationMock = vi.fn()

const createOverheadSpy = vi.fn()
const updateOverheadSpy = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
  useOverheadFilteredQuery: (filters?: unknown) => useOverheadFilteredQueryMock(filters),
  useCreateOverheadMutation: () => useCreateOverheadMutationMock(),
  useUpdateOverheadMutation: () => useUpdateOverheadMutationMock(),
  useDeleteOverheadMutation: () => useDeleteOverheadMutationMock(),
}))

vi.mock('@mui/x-charts', () => ({
  BarChart: () => <div>Bar Chart</div>,
}))

describe('OverheadPage', () => {
  beforeEach(() => {
    createOverheadSpy.mockReset()
    updateOverheadSpy.mockReset()
    createOverheadSpy.mockResolvedValue(undefined)
    updateOverheadSpy.mockResolvedValue(undefined)
    useOverheadFilteredQueryMock.mockReset()
    useCreateOverheadMutationMock.mockReset()
    useUpdateOverheadMutationMock.mockReset()
    useDeleteOverheadMutationMock.mockReset()

    useOverheadFilteredQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: 'expense-1',
            date: '2026-01-12',
            group_key: 'admin_salaries',
            category: 'office',
            description: 'Zolia',
            vendor: 'Rudy',
            amount: 400,
            payment_method: 'card',
            notes: 'Mom',
            has_receipt: false,
            created_at: '2026-01-12T00:00:00Z',
          },
        ],
        summary: {
          monthly_total: 22953,
          avg_monthly: 34133,
          yearly_total: 102399,
          entry_count: 229,
          group_summaries: [
            { group_key: 'admin_salaries', label: 'Admin Salaries', total: 36450 },
            { group_key: 'other', label: 'Other', total: 24328 },
            { group_key: 'insurance_licenses', label: 'Insurance & Licenses', total: 18605 },
            { group_key: 'vehicles_equipment', label: 'Vehicles & Equipment', total: 17815 },
            { group_key: 'marketing', label: 'Marketing', total: 3765 },
            { group_key: 'rent_utilities', label: 'Rent & Utilities', total: 1437 },
          ],
          monthly_series: [
            { month: '2026-01', amount: 18000 },
            { month: '2026-02', amount: 22000 },
          ],
        },
      },
      error: null,
    })

    useCreateOverheadMutationMock.mockReturnValue({
      mutateAsync: createOverheadSpy,
      error: null,
      isPending: false,
    })
    useUpdateOverheadMutationMock.mockReturnValue({
      mutateAsync: updateOverheadSpy,
      error: null,
      isPending: false,
    })
    useDeleteOverheadMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      error: null,
      isPending: false,
    })
  })

  it('renders the redesigned overhead control center', () => {
    renderWithProviders(<OverheadPage />)

    expect(screen.getByRole('heading', { name: /Overhead Expenses/i })).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(screen.getByText('Avg Monthly')).toBeInTheDocument()
    expect(screen.getByText('YTD Total')).toBeInTheDocument()
    expect(screen.getAllByText('Admin Salaries').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: 'Expense Log' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Monthly Summary' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Chart' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Overhead' })).toBeInTheDocument()
    expect(screen.getByText('Zolia')).toBeInTheDocument()
  })

  it('submits the quick add overhead payload', async () => {
    renderWithProviders(<OverheadPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Overhead' }))
    const dialog = screen.getByRole('dialog')
    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement
    const numberInput = dialog.querySelector('input[type="number"]') as HTMLInputElement
    const textInputs = dialog.querySelectorAll('input[type="text"]')
    const comboboxes = within(dialog).getAllByRole('combobox')

    fireEvent.change(dateInput, { target: { value: '2026-03-24' } })
    fireEvent.change(textInputs[0] as HTMLInputElement, {
      target: { value: 'Verizon bill' },
    })
    fireEvent.mouseDown(comboboxes[0])
    fireEvent.click(screen.getByRole('option', { name: 'Marketing' }))
    fireEvent.change(numberInput, { target: { value: '250' } })
    fireEvent.mouseDown(comboboxes[1])
    fireEvent.click(screen.getByRole('option', { name: 'Card' }))
    fireEvent.change(textInputs[1] as HTMLInputElement, {
      target: { value: 'Optional' },
    })
    fireEvent.mouseDown(comboboxes[2])
    fireEvent.click(screen.getByRole('option', { name: 'Marketing' }))
    fireEvent.click(within(dialog).getByLabelText('Receipt?'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Expense' }))

    await waitFor(() => {
      expect(createOverheadSpy).toHaveBeenCalledWith({
        date: '2026-03-24',
        group_key: 'marketing',
        category: 'marketing',
        description: 'Verizon bill',
        vendor: '',
        amount: 250,
        payment_method: 'card',
        notes: 'Optional',
        has_receipt: true,
      })
    })
  })

  it('submits edits from the edit dialog', async () => {
    renderWithProviders(<OverheadPage />)

    fireEvent.click(screen.getByLabelText('Edit overhead expense expense-1'))
    const dialog = screen.getByRole('dialog')
    const dialogComboboxes = within(dialog).getAllByRole('combobox')
    const dialogDateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement
    const dialogNumberInput = dialog.querySelector('input[type="number"]') as HTMLInputElement
    const dialogTextInputs = dialog.querySelectorAll('input[type="text"]')

    fireEvent.change(dialogDateInput, { target: { value: '2026-01-15' } })
    fireEvent.change(dialogTextInputs[0] as HTMLInputElement, { target: { value: 'IRS' } })
    fireEvent.mouseDown(dialogComboboxes[0])
    fireEvent.click(screen.getByRole('option', { name: 'Other' }))
    fireEvent.mouseDown(dialogComboboxes[1])
    fireEvent.click(screen.getByRole('option', { name: 'Other' }))
    fireEvent.change(dialogNumberInput, { target: { value: '850' } })
    fireEvent.mouseDown(dialogComboboxes[2])
    fireEvent.click(screen.getByRole('option', { name: 'ACH' }))
    fireEvent.change(dialogTextInputs[1] as HTMLInputElement, { target: { value: 'IRS' } })
    fireEvent.change(dialogTextInputs[2] as HTMLInputElement, { target: { value: 'Taxes R' } })
    fireEvent.click(within(dialog).getByLabelText('Receipt?'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateOverheadSpy).toHaveBeenCalledWith({
        expenseId: 'expense-1',
        payload: {
          date: '2026-01-15',
          group_key: 'other',
          category: 'other',
          description: 'IRS',
          vendor: 'IRS',
          amount: 850,
          payment_method: 'ach',
          notes: 'Taxes R',
          has_receipt: true,
        },
      })
    })
  })
})
