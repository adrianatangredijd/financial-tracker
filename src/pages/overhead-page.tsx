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
  useCreateOverheadMutation,
  useDeleteOverheadMutation,
  useOverheadQuery,
} from '@/lib/api/hooks'
import type { OverheadPayload } from '@/lib/api/types'
import { overheadCategoryOptions, paymentMethodOptions } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'

const emptyOverheadPayload: OverheadPayload = {
  date: '',
  category: 'software',
  description: '',
  vendor: '',
  amount: 0,
  payment_method: 'card',
}

export function OverheadPage() {
  const theme = useTheme()
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'))
  const isDesktopUp = useMediaQuery(theme.breakpoints.up('lg'))
  const overheadQuery = useOverheadQuery()
  const createOverheadMutation = useCreateOverheadMutation()
  const deleteOverheadMutation = useDeleteOverheadMutation()

  const [formState, setFormState] = useState<OverheadPayload>(emptyOverheadPayload)
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; label: string } | null>(null)

  const items = useMemo(
    () =>
      [...(overheadQuery.data?.items ?? [])].sort((left, right) => right.date.localeCompare(left.date)),
    [overheadQuery.data?.items],
  )

  const mutationError = createOverheadMutation.error ?? deleteOverheadMutation.error

  const responsiveVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({
      date: true,
      category: true,
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
    await createOverheadMutation.mutateAsync(formState)
    setFormState(emptyOverheadPayload)
  }

  async function handleDelete(expenseId: string) {
    await deleteOverheadMutation.mutateAsync(expenseId)
    setExpenseToDelete(null)
  }

  const columns: GridColDef[] = [
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
          aria-label={`Delete overhead expense ${row.id}`}
          color="error"
          size="small"
          onClick={() =>
            setExpenseToDelete({
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
        title="Overhead"
        description="Track recurring business operating expenses separately from direct project costs."
      />

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
              label="Monthly Total"
              value={formatCurrency(overheadQuery.data?.summary.monthly_total ?? 0)}
              helper="Current month company overhead."
            />
            <MetricCard
              label="Yearly Total"
              value={formatCurrency(overheadQuery.data?.summary.yearly_total ?? 0)}
              helper="Year-to-date operating expense."
            />
            <MetricCard
              label="Entries"
              value={String(items.length)}
              helper="Recorded overhead expense items."
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
          title="Overhead ledger"
          description="Monitor software, insurance, vehicles, utilities, and other company expenses."
        >
          {overheadQuery.isLoading ? (
            <TableSkeleton />
          ) : overheadQuery.isError ? (
            <StateNotice
              title="Overhead unavailable"
              description={getApiErrorMessage(overheadQuery.error)}
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
                rows={items}
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
          title="Add overhead expense"
          description="Create new overhead entries using the backend overhead payload."
        >
          <Box component="form" display="grid" gap={2} onSubmit={(event) => void handleSubmit(event)}>
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
                    category: event.target.value as OverheadPayload['category'],
                  }))
                }
              >
                {overheadCategoryOptions.map((option) => (
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
              disabled={createOverheadMutation.isPending || deleteOverheadMutation.isPending}
              type="submit"
              variant="contained"
            >
              Add overhead expense
            </Button>
          </Box>
        </SectionCard>
      </Box>

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
