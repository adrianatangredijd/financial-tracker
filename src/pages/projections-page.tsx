import { EditOutlined } from '@mui/icons-material'
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

import { MetricCard, MetricCardSkeleton, PageHeader, SectionCard, StateNotice, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateProjectionMutation,
  useProjectionsQuery,
  useUpdateProjectionMutation,
} from '@/lib/api/hooks'
import type { Projection, ProjectionPayload } from '@/lib/api/types'
import { formatCurrency, formatMonthLabel, monthValueToApi, toMonthInputValue } from '@/lib/utils'

interface ProjectionFormState {
  month: string
  projected_revenue: number
  projected_job_costs: number
  projected_overhead: number
  notes: string
}

const emptyProjectionForm: ProjectionFormState = {
  month: '',
  projected_revenue: 0,
  projected_job_costs: 0,
  projected_overhead: 0,
  notes: '',
}

function buildProjectionFormState(projection?: Projection): ProjectionFormState {
  if (!projection) {
    return emptyProjectionForm
  }

  return {
    month: toMonthInputValue(projection.month),
    projected_revenue: projection.projected_revenue,
    projected_job_costs: projection.projected_job_costs,
    projected_overhead: projection.projected_overhead,
    notes: projection.notes,
  }
}

function toProjectionPayload(formState: ProjectionFormState): ProjectionPayload {
  return {
    ...formState,
    month: monthValueToApi(formState.month),
  }
}

export function ProjectionsPage() {
  const theme = useTheme()
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'))
  const isDesktopUp = useMediaQuery(theme.breakpoints.up('lg'))
  const projectionsQuery = useProjectionsQuery()
  const createProjectionMutation = useCreateProjectionMutation({
    onSuccess: () => {
      setEditingProjection(null)
      setFormState(emptyProjectionForm)
    },
  })
  const updateProjectionMutation = useUpdateProjectionMutation({
    onSuccess: () => {
      setEditingProjection(null)
      setFormState(emptyProjectionForm)
    },
  })

  const [editingProjection, setEditingProjection] = useState<Projection | null>(null)
  const [formState, setFormState] = useState<ProjectionFormState>(emptyProjectionForm)

  const projections = useMemo(
    () =>
      [...(projectionsQuery.data ?? [])].sort((left, right) => left.month.localeCompare(right.month)),
    [projectionsQuery.data],
  )

  const totals = projections.reduce(
    (accumulator, projection) => {
      accumulator.revenue += projection.projected_revenue
      accumulator.costs += projection.projected_job_costs + projection.projected_overhead
      accumulator.endingCash = projection.ending_cash
      return accumulator
    },
    { revenue: 0, costs: 0, endingCash: 0 },
  )

  const mutationError = createProjectionMutation.error ?? updateProjectionMutation.error

  const responsiveVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({
      month: true,
      projected_revenue: true,
      projected_job_costs: isTabletUp,
      projected_overhead: isDesktopUp,
      net_cash_flow: isTabletUp,
      ending_cash: true,
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

    const payload = toProjectionPayload(formState)
    if (editingProjection) {
      await updateProjectionMutation.mutateAsync({
        projectionId: editingProjection.id,
        payload,
      })
      return
    }

    await createProjectionMutation.mutateAsync(payload)
  }

  function handleEdit(projection: Projection) {
    setEditingProjection(projection)
    setFormState(buildProjectionFormState(projection))
  }

  function handleCancelEdit() {
    setEditingProjection(null)
    setFormState(emptyProjectionForm)
  }

  const columns: GridColDef[] = [
    {
      field: 'month',
      flex: 1,
      headerName: 'Month',
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box py={1}>
          <Typography fontWeight={700} variant="body2">
            {formatMonthLabel(row.month)}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {row.notes || 'No notes'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'projected_revenue',
      headerName: 'Revenue',
      minWidth: 140,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'projected_job_costs',
      headerName: 'Job Costs',
      minWidth: 140,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'projected_overhead',
      headerName: 'Overhead',
      minWidth: 140,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'net_cash_flow',
      headerName: 'Net Cash Flow',
      minWidth: 160,
      valueFormatter: (value) => formatCurrency(Number(value)),
    },
    {
      field: 'ending_cash',
      headerName: 'Ending Cash',
      minWidth: 150,
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
          aria-label={`Edit ${formatMonthLabel(row.month)}`}
          color="primary"
          size="small"
          onClick={() => handleEdit(row)}
        >
          <EditOutlined fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Projections"
        description="Forecast upcoming revenue, direct costs, overhead, and resulting ending cash."
      />

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}>
        {projectionsQuery.isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Projected Revenue"
              value={formatCurrency(totals.revenue)}
              helper="Combined projected revenue across all forecast months."
            />
            <MetricCard
              label="Projected Outflows"
              value={formatCurrency(totals.costs)}
              helper="Projected job costs plus projected overhead."
            />
            <MetricCard
              label="Ending Cash"
              value={formatCurrency(totals.endingCash)}
              helper="Latest rolling cash balance from the forecast series."
            />
          </>
        )}
      </Box>

      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: '1fr', xl: 'minmax(0, 1.4fr) minmax(360px, 0.9fr)' }}
      >
        <SectionCard
          title="Projection schedule"
          description="Monthly forecast entries returned by the backend projection service."
        >
          {projectionsQuery.isLoading ? (
            <TableSkeleton />
          ) : projectionsQuery.isError ? (
            <StateNotice
              title="Projections unavailable"
              description={getApiErrorMessage(projectionsQuery.error)}
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
                rows={projections}
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
          title={editingProjection ? 'Edit projection' : 'Create projection'}
          description="Create or update the monthly forecast payload used by the backend."
          actions={
            editingProjection ? (
              <Button variant="outlined" onClick={handleCancelEdit}>
                Cancel edit
              </Button>
            ) : null
          }
        >
          <Box component="form" display="grid" gap={2} onSubmit={(event) => void handleSubmit(event)}>
            <TextField
              id="projection_month"
              label="Month"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="month"
              value={formState.month}
              onChange={(event) =>
                setFormState((current) => ({ ...current, month: event.target.value }))
              }
            />

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                id="projected_revenue"
                label="Projected revenue"
                required
                type="number"
                value={formState.projected_revenue}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    projected_revenue: Number(event.target.value),
                  }))
                }
              />

              <TextField
                id="projected_job_costs"
                label="Projected job costs"
                required
                type="number"
                value={formState.projected_job_costs}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    projected_job_costs: Number(event.target.value),
                  }))
                }
              />
            </Box>

            <TextField
              id="projected_overhead"
              label="Projected overhead"
              required
              type="number"
              value={formState.projected_overhead}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  projected_overhead: Number(event.target.value),
                }))
              }
            />

            <TextField
              id="projection_notes"
              label="Notes"
              minRows={4}
              multiline
              value={formState.notes}
              onChange={(event) =>
                setFormState((current) => ({ ...current, notes: event.target.value }))
              }
            />

            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}

            <Button
              disabled={createProjectionMutation.isPending || updateProjectionMutation.isPending}
              type="submit"
              variant="contained"
            >
              {editingProjection ? 'Save projection' : 'Create projection'}
            </Button>
          </Box>
        </SectionCard>
      </Box>
    </Stack>
  )
}
