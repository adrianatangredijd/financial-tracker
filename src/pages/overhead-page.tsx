import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  Typography,
} from '@mui/material'
import { BarChart } from '@mui/x-charts'
import { useMemo, useState } from 'react'

import { ConfirmDialog, MetricCard, MetricCardSkeleton, PageHeader, SectionCard, StateNotice, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateOverheadMutation,
  useDeleteOverheadMutation,
  useOverheadFilteredQuery,
  useUpdateOverheadMutation,
} from '@/lib/api/hooks'
import type { OverheadExpense, OverheadGroupKey, OverheadPayload } from '@/lib/api/types'
import { overheadCategoryOptions, overheadGroupOptions, paymentMethodOptions } from '@/lib/constants'
import { formatCurrency, formatDate, formatMonthLabel, toDateInputValue } from '@/lib/utils'

const emptyOverheadPayload: OverheadPayload = {
  date: '',
  group_key: 'other',
  category: 'software',
  description: '',
  vendor: '',
  amount: 0,
  payment_method: 'card',
  notes: '',
  has_receipt: false,
}

const monthOptions = [
  { value: 'all', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

export function OverheadPage() {
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedGroup, setSelectedGroup] = useState<'all' | OverheadGroupKey>('all')
  const [activeTab, setActiveTab] = useState<'expense_log' | 'monthly_summary' | 'chart'>('expense_log')
  const overheadQuery = useOverheadFilteredQuery({
    year: currentYear,
    month: selectedMonth === 'all' ? undefined : Number(selectedMonth),
    group: selectedGroup === 'all' ? undefined : selectedGroup,
  })
  const createOverheadMutation = useCreateOverheadMutation()
  const deleteOverheadMutation = useDeleteOverheadMutation()
  const updateOverheadMutation = useUpdateOverheadMutation()

  const [formState, setFormState] = useState<OverheadPayload>(emptyOverheadPayload)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<OverheadExpense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; label: string } | null>(null)

  const items = useMemo(
    () =>
      [...(overheadQuery.data?.items ?? [])].sort((left, right) => right.date.localeCompare(left.date)),
    [overheadQuery.data?.items],
  )

  const mutationError = createOverheadMutation.error ?? deleteOverheadMutation.error ?? updateOverheadMutation.error

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createOverheadMutation.mutateAsync(formState)
    setFormState(emptyOverheadPayload)
    setIsCreateDialogOpen(false)
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingExpense) {
      return
    }

    await updateOverheadMutation.mutateAsync({
      expenseId: editingExpense.id,
      payload: formState,
    })
    setEditingExpense(null)
    setFormState(emptyOverheadPayload)
  }

  async function handleDelete(expenseId: string) {
    await deleteOverheadMutation.mutateAsync(expenseId)
    setExpenseToDelete(null)
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={`Overhead Expenses - ${currentYear}`}
        description="Company-wide costs not tied to any project: rent, insurance, admin payroll, marketing, vehicles, and similar operating expenses."
        actions={
          <Button
            variant="contained"
            onClick={() => {
              setActiveTab('expense_log')
              setEditingExpense(null)
              setFormState(emptyOverheadPayload)
              setIsCreateDialogOpen(true)
            }}
          >
            Add Overhead
          </Button>
        }
      />

      <Alert severity="warning" variant="outlined">
        <Stack spacing={0.5}>
          <Typography fontWeight={700} variant="body2">
            Overhead Only - No Job Costs Here
          </Typography>
          <Typography variant="body2">
            This page tracks company-wide expenses that should stay outside project ledgers.
          </Typography>
        </Stack>
      </Alert>

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
        {overheadQuery.isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="This Month"
              value={formatCurrency(overheadQuery.data?.summary.monthly_total ?? 0)}
              helper="Current month overhead based on active filter scope."
            />
            <MetricCard
              label="Avg Monthly"
              value={formatCurrency(overheadQuery.data?.summary.avg_monthly ?? 0)}
              helper="Average monthly overhead for the selected year."
            />
            <MetricCard
              label="YTD Total"
              value={formatCurrency(overheadQuery.data?.summary.yearly_total ?? 0)}
              helper="Year-to-date operating expense."
            />
          </>
        )}
      </Box>

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' }}>
        {(overheadQuery.data?.summary.group_summaries ?? []).map((group) => (
          <MetricCard
            key={group.group_key}
            helper="Grouped overhead total."
            label={group.label}
            value={formatCurrency(group.total)}
          />
        ))}
      </Box>

      <SectionCard title="Overhead Control Center">
        <Stack spacing={3}>
          <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
            <Tab label="Expense Log" value="expense_log" />
            <Tab label="Monthly Summary" value="monthly_summary" />
            <Tab label="Chart" value="chart" />
          </Tabs>

          {activeTab === 'expense_log' ? (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    select
                    label="Filter"
                    size="small"
                    sx={{ minWidth: 160 }}
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  >
                    {monthOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Group"
                    size="small"
                    sx={{ minWidth: 160 }}
                    value={selectedGroup}
                    onChange={(event) => setSelectedGroup(event.target.value as 'all' | OverheadGroupKey)}
                  >
                    <MenuItem value="all">All Groups</MenuItem>
                    {overheadGroupOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {`${overheadQuery.data?.summary.entry_count ?? 0} entries - ${formatCurrency(overheadQuery.data?.summary.yearly_total ?? 0)}`}
                </Typography>
              </Stack>

              {overheadQuery.isLoading ? (
                <TableSkeleton rows={8} height={520} />
              ) : overheadQuery.isError ? (
                <StateNotice title="Overhead unavailable" description={getApiErrorMessage(overheadQuery.error)} />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Group</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Receipt</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            {overheadGroupOptions.find((option) => option.value === item.group_key)?.label ?? 'Other'}
                          </TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{item.category.replaceAll('_', ' ')}</TableCell>
                          <TableCell>
                            <Typography fontWeight={700} variant="body2">
                              {formatCurrency(item.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.payment_method.replaceAll('_', ' ')}</TableCell>
                          <TableCell>{item.has_receipt ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                              <IconButton
                                aria-label={`Edit overhead expense ${item.id}`}
                                size="small"
                                onClick={() => {
                                  setEditingExpense(item)
                                  setFormState({
                                    date: toDateInputValue(item.date),
                                    group_key: item.group_key,
                                    category: item.category,
                                    description: item.description,
                                    vendor: item.vendor,
                                    amount: item.amount,
                                    payment_method: item.payment_method,
                                    notes: item.notes,
                                    has_receipt: item.has_receipt,
                                  })
                                }}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                              <IconButton
                                aria-label={`Delete overhead expense ${item.id}`}
                                color="error"
                                size="small"
                                onClick={() =>
                                  setExpenseToDelete({
                                    id: item.id,
                                    label: item.description,
                                  })
                                }
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          ) : null}

          {activeTab === 'monthly_summary' ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(overheadQuery.data?.summary.monthly_series ?? []).map((point) => (
                    <TableRow key={point.month}>
                      <TableCell>{formatMonthLabel(point.month)}</TableCell>
                      <TableCell>{formatCurrency(point.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}

          {activeTab === 'chart' ? (
            <Box sx={{ height: 320 }}>
              <BarChart
                height={320}
                margin={{ top: 16, right: 16, bottom: 24, left: 72 }}
                series={[
                  {
                    data: (overheadQuery.data?.summary.monthly_series ?? []).map((point) => point.amount),
                    label: 'Overhead',
                    color: '#ef4444',
                  },
                ]}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: (overheadQuery.data?.summary.monthly_series ?? []).map((point) => formatMonthLabel(point.month)),
                  },
                ]}
              />
            </Box>
          ) : null}
        </Stack>
      </SectionCard>

      <Dialog fullWidth maxWidth="sm" open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <DialogTitle>Add Overhead</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} onSubmit={(event) => void handleSubmit(event)}>
            <TextField
              label="Date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
            />
            <TextField
              label="Description / Vendor"
              required
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Category"
                select
                value={formState.category}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    category: event.target.value as OverheadPayload['category'],
                  }))
                }
              >
                {overheadCategoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Amount"
                required
                type="number"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    amount: Number(event.target.value),
                  }))
                }
              />
            </Box>
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Payment Method"
                select
                value={formState.payment_method}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    payment_method: event.target.value,
                  }))
                }
              >
                {paymentMethodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Group"
                select
                value={formState.group_key ?? 'other'}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    group_key: event.target.value as OverheadGroupKey,
                  }))
                }
              >
                {overheadGroupOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Notes"
              value={formState.notes ?? ''}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formState.has_receipt)}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      has_receipt: event.target.checked,
                    }))
                  }
                />
              }
              label="Receipt?"
            />
            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5}>
              <Button variant="outlined" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createOverheadMutation.isPending || deleteOverheadMutation.isPending}
                type="submit"
                variant="contained"
              >
                Save Expense
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={Boolean(editingExpense)} onClose={() => setEditingExpense(null)}>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} onSubmit={(event) => void handleUpdate(event)}>
            <TextField
              label="Date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
            />
            <TextField
              label="Description"
              required
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
            />
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Group"
                select
                value={formState.group_key ?? 'other'}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, group_key: event.target.value as OverheadGroupKey }))
                }
              >
                {overheadGroupOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Category"
                select
                value={formState.category}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, category: event.target.value as OverheadPayload['category'] }))
                }
              >
                {overheadCategoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Amount"
                required
                type="number"
                value={formState.amount}
                onChange={(event) => setFormState((current) => ({ ...current, amount: Number(event.target.value) }))}
              />
              <TextField
                label="Payment method"
                select
                value={formState.payment_method}
                onChange={(event) => setFormState((current) => ({ ...current, payment_method: event.target.value }))}
              >
                {paymentMethodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Vendor"
              value={formState.vendor}
              onChange={(event) => setFormState((current) => ({ ...current, vendor: event.target.value }))}
            />
            <TextField
              label="Notes"
              value={formState.notes ?? ''}
              onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formState.has_receipt)}
                  onChange={(event) => setFormState((current) => ({ ...current, has_receipt: event.target.checked }))}
                />
              }
              label="Receipt?"
            />
            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5}>
              <Button variant="outlined" onClick={() => setEditingExpense(null)}>
                Cancel
              </Button>
              <Button disabled={updateOverheadMutation.isPending} type="submit" variant="contained">
                Save
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Delete expense"
        description="This will permanently remove the selected overhead expense."
        isLoading={deleteOverheadMutation.isPending}
        open={Boolean(expenseToDelete)}
        title={expenseToDelete ? `Delete "${expenseToDelete.label}"?` : 'Delete overhead expense?'}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            void handleDelete(expenseToDelete.id)
          }
        }}
      />
    </Stack>
  )
}
