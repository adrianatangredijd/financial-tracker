import { Add, DeleteOutline } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'

import {
  ConfirmDialog,
  JobCostStatusBadge,
  MetricCard,
  MetricCardSkeleton,
  PageHeader,
  SectionCard,
  StateNotice,
  TableSkeleton,
} from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateJobCostMutation,
  useDeleteJobCostMutation,
  useJobCostsQuery,
  useProjectsQuery,
} from '@/lib/api/hooks'
import type { JobCost, JobCostPayload, JobCostType } from '@/lib/api/types'
import { jobCostTypeOptions, paymentMethodOptions } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'

const emptyJobCostPayload: JobCostPayload = {
  project_id: '',
  date: '',
  category: 'labor',
  cost_type: 'sub_labor',
  description: '',
  vendor: '',
  projected_amount: 0,
  actual_amount: 0,
  payment_method: 'bank_transfer',
}

function deriveCategoryFromType(costType: JobCostType): JobCostPayload['category'] {
  switch (costType) {
    case 'materials':
      return 'materials'
    case 'sub_labor':
      return 'subcontractor'
    case 'in_house':
    case 'timesheet_labor':
      return 'labor'
    case 'permits':
      return 'permits'
    case 'equipment':
      return 'equipment'
    default:
      return 'other'
  }
}

function formatCostTypeLabel(costType: string) {
  return (
    jobCostTypeOptions.find((option) => option.value === costType)?.label ??
    costType.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  )
}

export function JobCostsPage() {
  const jobCostsQuery = useJobCostsQuery()
  const projectsQuery = useProjectsQuery()
  const createJobCostMutation = useCreateJobCostMutation()
  const deleteJobCostMutation = useDeleteJobCostMutation()

  const [formState, setFormState] = useState<JobCostPayload>(emptyJobCostPayload)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projectFilter, setProjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | JobCostType>('all')
  const [jobCostToDelete, setJobCostToDelete] = useState<{ id: string; label: string } | null>(null)

  const jobCosts = useMemo(
    () => [...(jobCostsQuery.data ?? [])].sort((left, right) => right.date.localeCompare(left.date)),
    [jobCostsQuery.data],
  )
  const filteredJobCosts = useMemo(
    () =>
      jobCosts.filter((item) => {
        if (projectFilter !== 'all' && item.project_id !== projectFilter) {
          return false
        }
        if (typeFilter !== 'all' && item.cost_type !== typeFilter) {
          return false
        }

        return true
      }),
    [jobCosts, projectFilter, typeFilter],
  )
  const projectsById = useMemo(
    () => Object.fromEntries((projectsQuery.data ?? []).map((project) => [project.id, project])),
    [projectsQuery.data],
  )
  const kpis = useMemo(() => {
    const totals = {
      subLabor: 0,
      inHouse: 0,
      materials: 0,
      projected: 0,
      actual: 0,
      paidCount: 0,
      openCount: 0,
    }

    filteredJobCosts.forEach((item) => {
      totals.projected += item.projected_amount
      totals.actual += item.actual_amount

      if (item.status === 'Paid') {
        totals.paidCount += 1
      }
      if (item.status === 'Open') {
        totals.openCount += 1
      }

      switch (item.cost_type) {
        case 'sub_labor':
          totals.subLabor += item.actual_amount
          break
        case 'in_house':
        case 'timesheet_labor':
          totals.inHouse += item.actual_amount
          break
        case 'materials':
          totals.materials += item.actual_amount
          break
        default:
          break
      }
    })

    return totals
  }, [filteredJobCosts])
  const breakdownRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        projectId: string
        projectName: string
        subLabor: number
        inHouse: number
        materials: number
        totalCost: number
        contract: number
      }
    >()

    filteredJobCosts.forEach((item) => {
      const existing = grouped.get(item.project_id) ?? {
        projectId: item.project_id,
        projectName: item.project_name ?? item.project_id,
        subLabor: 0,
        inHouse: 0,
        materials: 0,
        totalCost: 0,
        contract: projectsById[item.project_id]?.contract_value ?? 0,
      }

      if (item.cost_type === 'sub_labor') {
        existing.subLabor += item.actual_amount
      } else if (item.cost_type === 'in_house' || item.cost_type === 'timesheet_labor') {
        existing.inHouse += item.actual_amount
      } else if (item.cost_type === 'materials') {
        existing.materials += item.actual_amount
      }

      existing.totalCost += item.actual_amount
      grouped.set(item.project_id, existing)
    })

    return [...grouped.values()]
      .map((row) => ({
        ...row,
        percentUsed: row.contract > 0 ? (row.totalCost / row.contract) * 100 : 0,
      }))
      .sort((left, right) => right.totalCost - left.totalCost)
  }, [filteredJobCosts, projectsById])

  const mutationError = createJobCostMutation.error ?? deleteJobCostMutation.error

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const costType = formState.cost_type ?? 'other'
    await createJobCostMutation.mutateAsync({
      ...formState,
      category: deriveCategoryFromType(costType),
      cost_type: costType,
    })
    setFormState({
      ...emptyJobCostPayload,
      project_id: formState.project_id,
      cost_type: formState.cost_type,
    })
    setIsDialogOpen(false)
  }

  async function handleDelete(jobCostId: string) {
    await deleteJobCostMutation.mutateAsync(jobCostId)
    setJobCostToDelete(null)
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Job Costs"
        description="Per-project expenses for sub labor, in-house labor, materials, and related direct costs."
        actions={
          <Button startIcon={<Add />} variant="contained" onClick={() => setIsDialogOpen(true)}>
            Add Job Cost
          </Button>
        }
      />

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' }}>
        {jobCostsQuery.isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Sub Labor"
              value={formatCurrency(kpis.subLabor)}
              helper="Subcontracted labor cost captured."
            />
            <MetricCard
              label="In-House"
              value={formatCurrency(kpis.inHouse)}
              helper="Payroll or timesheet labor captured."
            />
            <MetricCard
              label="Materials"
              value={formatCurrency(kpis.materials)}
              helper="Material purchases booked to projects."
            />
            <MetricCard
              label="Projected"
              value={formatCurrency(kpis.projected)}
              helper="Planned direct-cost amount."
            />
            <MetricCard
              label="Actual Paid"
              value={formatCurrency(kpis.actual)}
              helper={`${kpis.paidCount} paid - ${kpis.openCount} open`}
            />
          </>
        )}
      </Box>

      <SectionCard title="Cost Breakdown by Project">
        {jobCostsQuery.isLoading ? (
          <TableSkeleton rows={6} height={320} />
        ) : jobCostsQuery.isError ? (
          <StateNotice title="Job costs unavailable" description={getApiErrorMessage(jobCostsQuery.error)} />
        ) : breakdownRows.length === 0 ? (
          <StateNotice title="No job costs yet" description="Add the first job cost to see project breakdowns." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Sub Labor</TableCell>
                  <TableCell>In-House</TableCell>
                  <TableCell>Materials</TableCell>
                  <TableCell>Total Cost</TableCell>
                  <TableCell>Contract</TableCell>
                  <TableCell>% Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {breakdownRows.map((row) => (
                  <TableRow key={row.projectId} hover>
                    <TableCell>{row.projectName}</TableCell>
                    <TableCell>{formatCurrency(row.subLabor)}</TableCell>
                    <TableCell>{formatCurrency(row.inHouse)}</TableCell>
                    <TableCell>{formatCurrency(row.materials)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={700} variant="body2">
                        {formatCurrency(row.totalCost)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCurrency(row.contract)}</TableCell>
                    <TableCell>
                      <Typography color={row.percentUsed >= 75 ? 'error.main' : 'text.primary'} variant="body2">
                        {`${row.percentUsed.toFixed(1)}%`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            select
            label="Filter"
            size="small"
            sx={{ minWidth: 180 }}
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          >
            <MenuItem value="all">All Projects</MenuItem>
            {(projectsQuery.data ?? []).map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type"
            size="small"
            sx={{ minWidth: 180 }}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | JobCostType)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {jobCostTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Typography color="text.secondary" variant="body2">
          {`${filteredJobCosts.length} expense${filteredJobCosts.length === 1 ? '' : 's'} - ${formatCurrency(kpis.actual)}`}
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 4 }}>
        {jobCostsQuery.isLoading ? (
          <TableSkeleton rows={8} height={520} />
        ) : jobCostsQuery.isError ? (
          <Box p={3}>
            <StateNotice title="Job costs unavailable" description={getApiErrorMessage(jobCostsQuery.error)} />
          </Box>
        ) : filteredJobCosts.length === 0 ? (
          <Box p={3}>
            <StateNotice title="No matching job costs" description="Adjust the filters or add a new job cost." />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Projected</TableCell>
                  <TableCell>Actual</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobCosts.map((item: JobCost) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.project_name ?? item.project_id}</TableCell>
                    <TableCell>{item.vendor || '-'}</TableCell>
                    <TableCell>{formatCostTypeLabel(item.cost_type)}</TableCell>
                    <TableCell>{formatCurrency(item.projected_amount)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={700} variant="body2">
                        {formatCurrency(item.actual_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <JobCostStatusBadge value={item.status} />
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary" variant="body2">
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Delete job cost ${item.id}`}
                        color="error"
                        size="small"
                        onClick={() =>
                          setJobCostToDelete({
                            id: item.id,
                            label: item.description,
                          })
                        }
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog fullWidth maxWidth="sm" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Log Job Cost</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} onSubmit={(event) => void handleSubmit(event)}>
            <TextField
              label="Project"
              required
              select
              value={formState.project_id}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  project_id: event.target.value,
                }))
              }
            >
              <MenuItem value="">Select project</MenuItem>
              {(projectsQuery.data ?? []).map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Date"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
              />
              <TextField
                label="Category"
                required
                select
                value={formState.cost_type ?? 'sub_labor'}
                onChange={(event) => {
                  const costType = event.target.value as JobCostType
                  setFormState((current) => ({
                    ...current,
                    cost_type: costType,
                    category: deriveCategoryFromType(costType),
                  }))
                }}
              >
                {jobCostTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Vendor"
                value={formState.vendor}
                onChange={(event) => setFormState((current) => ({ ...current, vendor: event.target.value }))}
              />
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
            </Box>

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Projected Amount"
                required
                type="number"
                value={formState.projected_amount ?? 0}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    projected_amount: Number(event.target.value),
                  }))
                }
              />
              <TextField
                label="Actual Amount"
                placeholder="Leave empty if Open"
                type="number"
                value={formState.actual_amount ?? 0}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    actual_amount: Number(event.target.value),
                  }))
                }
              />
            </Box>

            <TextField
              label="Description"
              minRows={3}
              multiline
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5}>
              <Button variant="outlined" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createJobCostMutation.isPending || deleteJobCostMutation.isPending}
                type="submit"
                variant="contained"
              >
                Save
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

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
