import { Add, ArrowBack, DeleteOutline, Payments } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { ConfirmDialog, MetricCard, PageHeader, SectionCard, StateNotice } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateJobCostMutation,
  useCreatePaymentMutation,
  useDeleteJobCostMutation,
  useDeletePaymentMutation,
  useProjectDetailQuery,
  useUpdateProjectMutation,
} from '@/lib/api/hooks'
import type { JobCostPayload, PaymentPayload, ProjectPayload, ProjectStatus } from '@/lib/api/types'
import { jobCostCategoryOptions, paymentMethodOptions, projectStatusOptions } from '@/lib/constants'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'

const emptyPaymentPayload: PaymentPayload = {
  date: '',
  amount: 0,
  payment_method: 'bank_transfer',
  description: '',
}
const emptyExpensePayload: JobCostPayload = {
  project_id: '',
  date: '',
  category: 'materials',
  description: '',
  vendor: '',
  amount: 0,
  payment_method: 'bank_transfer',
}

function ExpenseStatusChip({ status }: { status: string }) {
  const color = status === 'Over' ? 'error' : status === 'Planned' ? 'default' : 'warning'
  return <Chip color={color} label={status} size="small" variant="filled" />
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const projectDetailQuery = useProjectDetailQuery(id)
  const createPaymentMutation = useCreatePaymentMutation()
  const createJobCostMutation = useCreateJobCostMutation()
  const deletePaymentMutation = useDeletePaymentMutation(id)
  const deleteJobCostMutation = useDeleteJobCostMutation()
  const updateProjectMutation = useUpdateProjectMutation()
  const detailData = projectDetailQuery.data

  const [activeTab, setActiveTab] = useState<'expenses' | 'budget' | 'payments'>('expenses')
  const [paymentForm, setPaymentForm] = useState<PaymentPayload>(emptyPaymentPayload)
  const [expenseForm, setExpenseForm] = useState<JobCostPayload>(emptyExpensePayload)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; label: string } | null>(null)
  const [costToDelete, setCostToDelete] = useState<{ id: string; label: string } | null>(null)
  const categoryBudgetRows = useMemo(() => {
    if (!detailData) {
      return []
    }

    const totalActual = detailData.cost_breakdown.reduce((sum, item) => sum + item.total, 0)
    return detailData.cost_breakdown.map((item) => {
      const budget =
        detailData.project.job_cost_budget > 0 && totalActual > 0
          ? (item.total / totalActual) * detailData.project.job_cost_budget
          : 0

      return {
        category: item.category,
        budget,
        actual: item.total,
        variance: budget - item.total,
      }
    })
  }, [detailData])

  if (!id) {
    return <StateNotice title="Project not found" description="A valid project id is required." />
  }

  async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createPaymentMutation.mutateAsync({
      projectId: id,
      payload: paymentForm,
    })
    setPaymentForm(emptyPaymentPayload)
    setPaymentDialogOpen(false)
  }

  async function handleExpenseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createJobCostMutation.mutateAsync({
      ...expenseForm,
      project_id: id,
    })
    setExpenseForm({ ...emptyExpensePayload, project_id: id })
    setExpenseDialogOpen(false)
  }

  async function handleDeletePayment(paymentId: string) {
    await deletePaymentMutation.mutateAsync(paymentId)
    setPaymentToDelete(null)
  }

  async function handleDeleteCost(jobCostId: string) {
    await deleteJobCostMutation.mutateAsync(jobCostId)
    setCostToDelete(null)
  }

  async function handleStatusChange(status: ProjectStatus) {
    if (!projectDetailQuery.data) {
      return
    }

    const project = projectDetailQuery.data.project
    const payload: ProjectPayload = {
      name: project.name,
      client_name: project.client_name,
      project_address: project.project_address,
      contract_value: project.contract_value,
      job_cost_budget: project.job_cost_budget,
      milestone_percent: project.milestone_percent,
      start_date: project.start_date.slice(0, 10),
      estimated_end_date: project.estimated_end_date.slice(0, 10),
      status,
      notes: project.notes,
    }

    await updateProjectMutation.mutateAsync({ projectId: id, payload })
    await projectDetailQuery.refetch()
  }

  if (projectDetailQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          title="Project detail"
          description="Review project profitability, payment history, and job cost activity."
          actions={
            <Button
              component={RouterLink}
              startIcon={<ArrowBack />}
              to="/projects"
              variant="outlined"
            >
              Back to projects
            </Button>
          }
        />
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            height: 288,
          }}
        />
      </Stack>
    )
  }

  if (projectDetailQuery.isError || !projectDetailQuery.data) {
    return (
      <Stack spacing={3}>
        <PageHeader
          title="Project detail"
          description="Review project profitability, payment history, and job cost activity."
        />
        <StateNotice
          title="Project unavailable"
          description={getApiErrorMessage(projectDetailQuery.error)}
        />
      </Stack>
    )
  }

  const detail = detailData as NonNullable<typeof detailData>
  const paymentError = createPaymentMutation.error ?? deletePaymentMutation.error
  const expenseError = createJobCostMutation.error ?? deleteJobCostMutation.error

  return (
    <Stack spacing={3}>
      <PageHeader
        title={detail.project.name}
        description={`${detail.project.client_name} • ${detail.project.project_address}`}
        actions={
          <>
            <Button component={RouterLink} startIcon={<ArrowBack />} to="/projects" variant="outlined">
              Back
            </Button>
            <TextField
              select
              SelectProps={{ native: true }}
              size="small"
              value={detail.project.status}
              onChange={(event) => void handleStatusChange(event.target.value as ProjectStatus)}
            >
              {projectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          </>
        }
      />

      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between">
          <Typography color="text.secondary" variant="caption">
            Milestone
          </Typography>
          <Typography fontWeight={700} variant="caption">
            {detail.project.milestone_percent.toFixed(0)}%
          </Typography>
        </Stack>
        <LinearProgress
          sx={{ borderRadius: 999, height: 8 }}
          value={Math.max(0, Math.min(detail.project.milestone_percent, 100))}
          variant="determinate"
        />
      </Stack>

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }}>
        <MetricCard
          label="Contract"
          value={formatCurrency(detail.project.contract_value)}
          helper={`Project budget ${formatCurrency(detail.project.job_cost_budget)}`}
        />
        <MetricCard
          label="Projected"
          value={formatCurrency(detail.projected_total)}
          helper="Projected direct spend for this project."
        />
        <MetricCard
          label="Actual Spent"
          value={formatCurrency(detail.actual_spent)}
          helper="Actual direct costs booked to date."
        />
        <MetricCard
          label="Variance"
          value={formatCurrency(detail.variance)}
          helper={`Margin ${formatPercent(detail.project.profit_margin)}`}
        />
      </Box>

      <SectionCard
        title="Project Control Center"
        description={`Runs from ${formatDate(detail.project.start_date)} to ${formatDate(detail.project.estimated_end_date)}.`}
        actions={
          activeTab === 'expenses' ? (
            <Button startIcon={<Add />} variant="contained" onClick={() => {
              setExpenseForm((current) => ({ ...current, project_id: id }))
              setExpenseDialogOpen(true)
            }}>
              Add Expense
            </Button>
          ) : activeTab === 'payments' ? (
            <Button startIcon={<Payments />} variant="contained" onClick={() => setPaymentDialogOpen(true)}>
              Add Payment
            </Button>
          ) : null
        }
      >
        <Stack spacing={3}>
          <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
            <Tab label="Expenses" value="expenses" />
            <Tab label="Budget vs Actual" value="budget" />
            <Tab label="Payments" value="payments" />
          </Tabs>

          {activeTab === 'expenses' ? (
            detail.budget_items.length === 0 ? (
              <StateNotice
                title="No expenses yet"
                description="Project expenses will appear here after posting job costs."
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Projected</TableCell>
                      <TableCell>Actual</TableCell>
                      <TableCell>Variance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.budget_items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{item.vendor || '-'}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{item.category}</TableCell>
                        <TableCell>{formatCurrency(item.projected_amount)}</TableCell>
                        <TableCell>{formatCurrency(item.actual_amount)}</TableCell>
                        <TableCell>{formatCurrency(item.variance)}</TableCell>
                        <TableCell>
                          <ExpenseStatusChip status={item.status} />
                        </TableCell>
                        <TableCell>
                          <Typography color="text.secondary" variant="body2">
                            {item.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label={`Delete expense ${item.id}`}
                            color="error"
                            size="small"
                            onClick={() => setCostToDelete({ id: item.id, label: item.description || formatCurrency(item.actual_amount) })}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : null}

          {activeTab === 'budget' ? (
            <Stack spacing={2}>
              <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
                <MetricCard
                  label="Budget"
                  value={formatCurrency(detail.project.job_cost_budget)}
                  helper="Target direct-cost budget."
                />
                <MetricCard
                  label="Actual"
                  value={formatCurrency(detail.actual_spent)}
                  helper="Actual direct costs posted."
                />
                <MetricCard
                  label="Variance"
                  value={formatCurrency(detail.variance)}
                  helper="Budget less actual direct costs."
                />
              </Box>
              {categoryBudgetRows.length === 0 ? (
                <StateNotice
                  title="No budget comparison yet"
                  description="Once job costs are recorded, category comparisons will appear here."
                />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Budget</TableCell>
                        <TableCell>Actual</TableCell>
                        <TableCell>Variance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryBudgetRows.map((row) => (
                        <TableRow key={row.category}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{row.category}</TableCell>
                          <TableCell>{formatCurrency(row.budget)}</TableCell>
                          <TableCell>{formatCurrency(row.actual)}</TableCell>
                          <TableCell>{formatCurrency(row.variance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          ) : null}

          {activeTab === 'payments' ? (
            detail.payments.length === 0 ? (
              <StateNotice
                title="No payments yet"
                description="Payments added to this project will appear here."
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {payment.payment_method.replaceAll('_', ' ')}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Typography color="text.secondary" variant="body2">
                            {payment.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label={`Delete payment ${payment.id}`}
                            color="error"
                            size="small"
                            onClick={() => setPaymentToDelete({ id: payment.id, label: formatCurrency(payment.amount) })}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : null}

          <Divider />

          <Box>
            <Typography color="text.secondary" fontWeight={700} textTransform="uppercase" variant="caption">
              Notes
            </Typography>
            <Typography color="text.secondary" mt={1.5} sx={{ whiteSpace: 'pre-wrap' }} variant="body2">
              {detail.project.notes || 'No project notes recorded yet.'}
            </Typography>
          </Box>
        </Stack>
      </SectionCard>

      <ConfirmDialog
        confirmLabel="Delete payment"
        description="This will permanently remove the selected payment."
        isLoading={deletePaymentMutation.isPending}
        open={Boolean(paymentToDelete)}
        title={paymentToDelete ? `Delete payment ${paymentToDelete.label}?` : 'Delete payment?'}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            void handleDeletePayment(paymentToDelete.id)
          }
        }}
      />

      <ConfirmDialog
        confirmLabel="Delete expense"
        description="This will permanently remove the selected expense."
        isLoading={deleteJobCostMutation.isPending}
        open={Boolean(costToDelete)}
        title={costToDelete ? `Delete expense ${costToDelete.label}?` : 'Delete expense?'}
        onClose={() => setCostToDelete(null)}
        onConfirm={() => {
          if (costToDelete) {
            void handleDeleteCost(costToDelete.id)
          }
        }}
      />

      <Dialog fullWidth maxWidth="sm" open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)}>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} onSubmit={(event) => void handleExpenseSubmit(event)}>
            <TextField
              label="Date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={expenseForm.date}
              onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))}
            />
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Vendor"
                required
                value={expenseForm.vendor}
                onChange={(event) => setExpenseForm((current) => ({ ...current, vendor: event.target.value }))}
              />
              <TextField
                label="Category"
                select
                SelectProps={{ native: true }}
                value={expenseForm.category}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, category: event.target.value as JobCostPayload['category'] }))
                }
              >
                {jobCostCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Amount"
                required
                type="number"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              />
              <TextField
                label="Payment method"
                select
                SelectProps={{ native: true }}
                value={expenseForm.payment_method}
                onChange={(event) => setExpenseForm((current) => ({ ...current, payment_method: event.target.value }))}
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Description"
              minRows={3}
              multiline
              value={expenseForm.description}
              onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
            />
            {expenseError ? <Alert severity="error">{getApiErrorMessage(expenseError)}</Alert> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button disabled={createJobCostMutation.isPending} type="submit" variant="contained">
                Add Expense
              </Button>
              <Button variant="outlined" onClick={() => setExpenseDialogOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} onSubmit={(event) => void handlePaymentSubmit(event)}>
            <TextField
              label="Date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={paymentForm.date}
              onChange={(event) => setPaymentForm((current) => ({ ...current, date: event.target.value }))}
            />
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Amount"
                required
                type="number"
                value={paymentForm.amount}
                onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              />
              <TextField
                label="Payment method"
                select
                SelectProps={{ native: true }}
                value={paymentForm.payment_method}
                onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method: event.target.value }))}
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Description"
              minRows={3}
              multiline
              value={paymentForm.description}
              onChange={(event) => setPaymentForm((current) => ({ ...current, description: event.target.value }))}
            />
            {paymentError ? <Alert severity="error">{getApiErrorMessage(paymentError)}</Alert> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button disabled={createPaymentMutation.isPending} type="submit" variant="contained">
                Add Payment
              </Button>
              <Button variant="outlined" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
