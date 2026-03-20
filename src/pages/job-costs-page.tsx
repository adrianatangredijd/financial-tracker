import { DeleteOutline } from '@mui/icons-material'
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

import { ConfirmDialog, MetricCard, MetricCardSkeleton, PageHeader, SectionCard, StateNotice, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateJobCostMutation,
  useDeleteJobCostMutation,
  useJobCostsQuery,
  useProjectsQuery,
} from '@/lib/api/hooks'
import type { JobCostPayload } from '@/lib/api/types'
import { jobCostCategoryOptions, paymentMethodOptions } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'

const emptyJobCostPayload: JobCostPayload = {
  project_id: '',
  date: '',
  category: 'materials',
  description: '',
  vendor: '',
  amount: 0,
  payment_method: 'bank_transfer',
}

export function JobCostsPage() {
  const theme = useTheme()
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'))
  const isDesktopUp = useMediaQuery(theme.breakpoints.up('lg'))
  const jobCostsQuery = useJobCostsQuery()
  const projectsQuery = useProjectsQuery()
  const createJobCostMutation = useCreateJobCostMutation()
  const deleteJobCostMutation = useDeleteJobCostMutation()

  const [formState, setFormState] = useState<JobCostPayload>(emptyJobCostPayload)
  const [jobCostToDelete, setJobCostToDelete] = useState<{ id: string; label: string } | null>(null)

  const jobCosts = useMemo(
    () => [...(jobCostsQuery.data ?? [])].sort((left, right) => right.date.localeCompare(left.date)),
    [jobCostsQuery.data],
  )

  const totalCost = jobCosts.reduce((sum, item) => sum + item.amount, 0)
  const averageCost = jobCosts.length > 0 ? totalCost / jobCosts.length : 0
  const activeProjects = new Set(jobCosts.map((item) => item.project_id)).size
  const mutationError = createJobCostMutation.error ?? deleteJobCostMutation.error

  const responsiveVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({
      project_name: true,
      category: true,
      date: true,
      amount: true,
      description: isTabletUp,
      vendor: isDesktopUp,
      payment_method: isDesktopUp,
      actions: true,
    }),
    [isDesktopUp, isTabletUp],
  )

  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>(responsiveVisibilityModel)

  useEffect(() => {
    setColumnVisibilityModel(responsiveVisibilityModel)
  }, [responsiveVisibilityModel])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createJobCostMutation.mutateAsync(formState)
    setFormState({
      ...emptyJobCostPayload,
      project_id: formState.project_id,
    })
  }

  async function handleDelete(jobCostId: string) {
    await deleteJobCostMutation.mutateAsync(jobCostId)
    setJobCostToDelete(null)
  }

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      minWidth: 120,
      valueFormatter: (value) => formatDate(String(value)),
    },
    {
      field: 'project_name',
      flex: 1,
      headerName: 'Project',
      minWidth: 180,
      renderCell: ({ row }) => (
        <Typography fontWeight={600} variant="body2">
          {row.project_name ?? row.project_id}
        </Typography>
      ),
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
      field: 'description',
      flex: 1.2,
      headerName: 'Description',
      minWidth: 220,
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
      field: 'payment_method',
      headerName: 'Payment',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Typography sx={{ textTransform: 'capitalize' }} variant="body2">
          {String(value).replaceAll('_', ' ')}
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
          aria-label={`Delete job cost ${row.id}`}
          color="error"
          size="small"
          onClick={() =>
            setJobCostToDelete({
              id: row.id,
              label: row.description,
            })
          }
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Job Costs"
        description="Capture direct project expenses with the same required fields the backend expects."
      />

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
        {jobCostsQuery.isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Job Costs"
              value={formatCurrency(totalCost)}
              helper="All direct costs currently recorded."
            />
            <MetricCard
              label="Average Entry"
              value={formatCurrency(averageCost)}
              helper="Average cost amount per ledger item."
            />
            <MetricCard
              label="Projects Impacted"
              value={String(activeProjects)}
              helper="Distinct projects with recorded job costs."
            />
          </>
        )}
      </Box>

      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: '1fr', xl: 'minmax(0, 1.5fr) minmax(360px, 0.9fr)' }}
      >
        <SectionCard
          title="Job cost ledger"
          description="Direct materials, labor, equipment, permits, and subcontractor spend."
        >
          {jobCostsQuery.isLoading ? (
            <TableSkeleton />
          ) : jobCostsQuery.isError ? (
            <StateNotice
              title="Job costs unavailable"
              description={getApiErrorMessage(jobCostsQuery.error)}
            />
          ) : (
            <Box sx={{ height: 620, width: '100%' }}>
              <DataGrid
                columnVisibilityModel={columnVisibilityModel}
                columns={columns}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[5, 10, 25]}
                pagination
                rows={jobCosts}
                showToolbar
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                  },
                }}
                sx={{ border: 0 }}
                onColumnVisibilityModelChange={setColumnVisibilityModel}
              />
            </Box>
          )}
        </SectionCard>

        <SectionCard
          title="Add job cost"
          description="The backend currently supports create and delete operations for job costs."
        >
          <Box component="form" display="grid" gap={2} onSubmit={(event) => void handleSubmit(event)}>
            <TextField
              label="Project"
              required
              select
              SelectProps={{ native: true }}
              value={formState.project_id}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  project_id: event.target.value,
                }))
              }
            >
              <option value="">Select a project</option>
              {(projectsQuery.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </TextField>

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Date"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={formState.date}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, date: event.target.value }))
                }
              />
              <TextField
                label="Category"
                select
                SelectProps={{ native: true }}
                value={formState.category}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    category: event.target.value as JobCostPayload['category'],
                  }))
                }
              >
                {jobCostCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Description"
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
                label="Vendor"
                value={formState.vendor}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, vendor: event.target.value }))
                }
              />
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

            <TextField
              label="Payment method"
              select
              SelectProps={{ native: true }}
              value={formState.payment_method}
              onChange={(event) =>
                setFormState((current) => ({
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

            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}

            <Button
              disabled={createJobCostMutation.isPending || deleteJobCostMutation.isPending}
              type="submit"
              variant="contained"
            >
              Add job cost
            </Button>
          </Box>
        </SectionCard>
      </Box>

      <ConfirmDialog
        confirmLabel="Delete job cost"
        description="This will permanently remove the selected job cost entry."
        isLoading={deleteJobCostMutation.isPending}
        open={Boolean(jobCostToDelete)}
        title={jobCostToDelete ? `Delete "${jobCostToDelete.label}"?` : 'Delete job cost?'}
        onClose={() => setJobCostToDelete(null)}
        onConfirm={() => {
          if (jobCostToDelete) {
            void handleDelete(jobCostToDelete.id)
          }
        }}
      />
    </Stack>
  )
}
