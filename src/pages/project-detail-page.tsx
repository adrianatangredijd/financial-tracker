import { ArrowBack, DeleteOutline, Payments } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { ConfirmDialog, MetricCard, PageHeader, SectionCard, StateNotice } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useProjectDetailQuery,
} from '@/lib/api/hooks'
import type { PaymentPayload } from '@/lib/api/types'
import { paymentMethodOptions } from '@/lib/constants'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'

const emptyPaymentPayload: PaymentPayload = {
  date: '',
  amount: 0,
  payment_method: 'bank_transfer',
  description: '',
}

export function ProjectDetailPage() {
  const theme = useTheme()
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'))
  const isDesktopUp = useMediaQuery(theme.breakpoints.up('lg'))
  const { id = '' } = useParams()
  const projectDetailQuery = useProjectDetailQuery(id)
  const createPaymentMutation = useCreatePaymentMutation()
  const deletePaymentMutation = useDeletePaymentMutation(id)

  const [paymentForm, setPaymentForm] = useState<PaymentPayload>(emptyPaymentPayload)
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; label: string } | null>(null)

  const paymentVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({
      date: true,
      payment_method: isTabletUp,
      description: isDesktopUp,
      amount: true,
      actions: true,
    }),
    [isDesktopUp, isTabletUp],
  )
  const jobCostVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({
      date: true,
      category: true,
      vendor: isDesktopUp,
      description: isTabletUp,
      amount: true,
    }),
    [isDesktopUp, isTabletUp],
  )
  const [paymentColumnsVisible, setPaymentColumnsVisible] =
    useState<GridColumnVisibilityModel>(paymentVisibilityModel)
  const [jobCostColumnsVisible, setJobCostColumnsVisible] =
    useState<GridColumnVisibilityModel>(jobCostVisibilityModel)

  useEffect(() => {
    setPaymentColumnsVisible(paymentVisibilityModel)
  }, [paymentVisibilityModel])

  useEffect(() => {
    setJobCostColumnsVisible(jobCostVisibilityModel)
  }, [jobCostVisibilityModel])

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
  }

  async function handleDeletePayment(paymentId: string) {
    await deletePaymentMutation.mutateAsync(paymentId)
    setPaymentToDelete(null)
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

  const detail = projectDetailQuery.data
  const paymentError = createPaymentMutation.error ?? deletePaymentMutation.error

  const paymentColumns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      minWidth: 120,
      valueFormatter: (value) => formatDate(String(value)),
    },
    {
      field: 'payment_method',
      headerName: 'Method',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Typography sx={{ textTransform: 'capitalize' }} variant="body2">
          {String(value).replaceAll('_', ' ')}
        </Typography>
      ),
    },
    {
      field: 'description',
      flex: 1,
      headerName: 'Description',
      minWidth: 220,
      renderCell: ({ value }) => (
        <Typography color="text.secondary" variant="body2">
          {String(value || '-')}
        </Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      minWidth: 140,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'actions',
      disableColumnMenu: true,
      filterable: false,
      headerName: 'Actions',
      minWidth: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <IconButton
          aria-label={`Delete payment ${row.id}`}
          color="error"
          size="small"
          onClick={() =>
            setPaymentToDelete({
              id: row.id,
              label: formatCurrency(row.amount),
            })
          }
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      ),
    },
  ]

  const costColumns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      minWidth: 120,
      valueFormatter: (value) => formatDate(String(value)),
    },
    {
      field: 'category',
      headerName: 'Category',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Typography sx={{ textTransform: 'capitalize' }} variant="body2">
          {String(value)}
        </Typography>
      ),
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      minWidth: 160,
      renderCell: ({ value }) => (
        <Typography color="text.secondary" variant="body2">
          {String(value || '-')}
        </Typography>
      ),
    },
    {
      field: 'description',
      flex: 1,
      headerName: 'Description',
      minWidth: 220,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      minWidth: 140,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
  ]

  return (
    <Stack spacing={3}>
      <PageHeader
        title={detail.project.name}
        description={`${detail.project.client_name} • ${detail.project.project_address}`}
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
        display="grid"
        gap={2}
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }}
      >
        <MetricCard
          label="Contract Value"
          value={formatCurrency(detail.project.contract_value)}
          helper={`Status: ${detail.project.status}`}
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(detail.project.total_revenue)}
          helper="Payments posted to this project."
        />
        <MetricCard
          label="Job Costs"
          value={formatCurrency(detail.project.total_job_costs)}
          helper="Direct costs booked against this project."
        />
        <MetricCard
          label="Profit"
          value={formatCurrency(detail.project.profit)}
          helper={`Margin ${formatPercent(detail.project.profit_margin)}`}
        />
      </Box>

      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: '1fr', xl: 'minmax(0, 1.4fr) minmax(340px, 0.9fr)' }}
      >
        <SectionCard
          title="Project summary"
          description={`Runs from ${formatDate(detail.project.start_date)} to ${formatDate(detail.project.estimated_end_date)}.`}
        >
          <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }}>
            <Box>
              <Typography color="text.secondary" fontWeight={700} textTransform="uppercase" variant="caption">
                Notes
              </Typography>
              <Typography color="text.secondary" mt={2} sx={{ whiteSpace: 'pre-wrap' }} variant="body2">
                {detail.project.notes || 'No project notes recorded yet.'}
              </Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" fontWeight={700} textTransform="uppercase" variant="caption">
                Cost breakdown
              </Typography>
              <Stack mt={2} spacing={1.5}>
                {detail.cost_breakdown.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No cost breakdown available yet.
                  </Typography>
                ) : (
                  detail.cost_breakdown.map((item) => (
                    <Box
                      key={item.category}
                      display="flex"
                      justifyContent="space-between"
                      px={2}
                      py={1.5}
                      sx={{ bgcolor: 'grey.50', borderRadius: 3 }}
                    >
                      <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }} variant="body2">
                        {item.category}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {formatCurrency(item.total)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard
          title="Add payment"
          description="Post revenue to the project using the backend payment payload."
        >
          <Box
            component="form"
            display="grid"
            gap={2}
            onSubmit={(event) => void handlePaymentSubmit(event)}
          >
            <TextField
              label="Date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={paymentForm.date}
              onChange={(event) =>
                setPaymentForm((current) => ({ ...current, date: event.target.value }))
              }
            />

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Amount"
                required
                type="number"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    amount: Number(event.target.value),
                  }))
                }
              />

              <TextField
                label="Payment method"
                select
                SelectProps={{ native: true }}
                value={paymentForm.payment_method}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    payment_method: event.target.value,
                  }))
                }
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
              minRows={4}
              multiline
              value={paymentForm.description}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            {paymentError ? <Alert severity="error">{getApiErrorMessage(paymentError)}</Alert> : null}

            <Button
              disabled={createPaymentMutation.isPending || deletePaymentMutation.isPending}
              startIcon={<Payments />}
              type="submit"
              variant="contained"
            >
              Add payment
            </Button>
          </Box>
        </SectionCard>
      </Box>

      <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}>
        <SectionCard title="Payments" description="All recorded revenue events for this project.">
          {detail.payments.length === 0 ? (
            <StateNotice
              title="No payments yet"
              description="Payments added to the project will appear here."
            />
          ) : (
            <Box sx={{ height: 520, width: '100%' }}>
              <DataGrid
                columnVisibilityModel={paymentColumnsVisible}
                columns={paymentColumns}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[5, 10, 25]}
                pagination
                rows={detail.payments}
                showToolbar
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                  },
                }}
                sx={{ border: 0 }}
                onColumnVisibilityModelChange={setPaymentColumnsVisible}
              />
            </Box>
          )}
        </SectionCard>

        <SectionCard
          title="Job costs"
          description="Direct costs linked to this project from the company job cost ledger."
        >
          {detail.costs.length === 0 ? (
            <StateNotice
              title="No job costs yet"
              description="Direct costs posted against this project will appear here."
            />
          ) : (
            <Box sx={{ height: 520, width: '100%' }}>
              <DataGrid
                columnVisibilityModel={jobCostColumnsVisible}
                columns={costColumns}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[5, 10, 25]}
                pagination
                rows={detail.costs}
                showToolbar
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                  },
                }}
                sx={{ border: 0 }}
                onColumnVisibilityModelChange={setJobCostColumnsVisible}
              />
            </Box>
          )}
        </SectionCard>
      </Box>

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
    </Stack>
  )
}
