import { Add, EditOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
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
  Tabs,
} from '@mui/material'
import { BarChart, LineChart } from '@mui/x-charts'
import { Fragment, useMemo, useState } from 'react'

import { PageHeader, SectionCard, StateNotice, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateProjectionPlannerRowMutation,
  useDashboardQuery,
  useProjectionPlannerQuery,
  useUpdateProjectionPlannerRowMutation,
} from '@/lib/api/hooks'
import type {
  ProjectionPlannerRow,
  ProjectionPlannerRowPayload,
  ProjectionPlannerSectionKey,
  ProjectionPlannerValue,
} from '@/lib/api/types'
import { formatCurrency, formatMonthLabel } from '@/lib/utils'

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface ProjectionPlannerFormState {
  year: number
  section_key: ProjectionPlannerSectionKey
  label: string
  sort_order: number
  cost_rate: number
  monthly_values: ProjectionPlannerValue[]
}

const emptyPlannerForm = (year: number): ProjectionPlannerFormState => ({
  year,
  section_key: 'collections',
  label: '',
  sort_order: 0,
  cost_rate: 0.65,
  monthly_values: monthLabels.map((_, index) => ({ month: index + 1, amount: 0 })),
})

function buildPlannerFormState(row: ProjectionPlannerRow): ProjectionPlannerFormState {
  return {
    year: row.year,
    section_key: row.section_key,
    label: row.label,
    sort_order: row.sort_order,
    cost_rate: row.cost_rate,
    monthly_values: row.monthly_values.map((value) => ({ ...value })),
  }
}

export function ProjectionsPage() {
  const currentYear = new Date().getFullYear()
  const plannerQuery = useProjectionPlannerQuery(currentYear)
  const dashboardQuery = useDashboardQuery()
  const createPlannerRowMutation = useCreateProjectionPlannerRowMutation()
  const updatePlannerRowMutation = useUpdateProjectionPlannerRowMutation()

  const [activeTab, setActiveTab] = useState<'planner' | 'actual_vs_projected'>('planner')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<ProjectionPlannerRow | null>(null)
  const [formState, setFormState] = useState<ProjectionPlannerFormState>(emptyPlannerForm(currentYear))

  const mutationError = createPlannerRowMutation.error ?? updatePlannerRowMutation.error
  const planner = plannerQuery.data

  const comparisonRows = useMemo(() => {
    if (!planner || !dashboardQuery.data) {
      return []
    }

    const collectionsSection = planner.sections.find((section) => section.key === 'collections')
    const jobCostsSection = planner.sections.find((section) => section.key === 'job_costs')
    const overheadSection = planner.sections.find((section) => section.key === 'overhead')
    const marketingSection = planner.sections.find((section) => section.key === 'marketing')

    return monthLabels.map((label, index) => {
      const monthKey = String(index + 1).padStart(2, '0')
      const projectedCollections = collectionsSection?.total_row.monthly_values[index]?.amount ?? 0
      const projectedExpenses =
        (jobCostsSection?.total_row.monthly_values[index]?.amount ?? 0) +
        (overheadSection?.total_row.monthly_values[index]?.amount ?? 0) +
        (marketingSection?.total_row.monthly_values[index]?.amount ?? 0)
      const actualPoint = dashboardQuery.data.revenue_vs_expenses.find((point) => point.month.endsWith(`-${monthKey}`))

      return {
        month: label,
        projectedCollections,
        actualCollections: actualPoint?.revenue ?? 0,
        projectedExpenses,
        actualExpenses: actualPoint?.expenses ?? 0,
      }
    })
  }, [dashboardQuery.data, planner])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: ProjectionPlannerRowPayload = formState
    if (editingRow) {
      await updatePlannerRowMutation.mutateAsync({
        rowId: editingRow.id,
        payload,
      })
      setEditingRow(null)
      setIsDialogOpen(false)
      setFormState(emptyPlannerForm(currentYear))
      return
    }

    await createPlannerRowMutation.mutateAsync(payload)
    setIsDialogOpen(false)
    setFormState(emptyPlannerForm(currentYear))
  }

  function handleEdit(row: ProjectionPlannerRow) {
    setEditingRow(row)
    setFormState(buildPlannerFormState(row))
    setIsDialogOpen(true)
  }

  function handleCreate(sectionKey: ProjectionPlannerSectionKey = 'collections') {
    setEditingRow(null)
    setFormState({ ...emptyPlannerForm(currentYear), section_key: sectionKey })
    setIsDialogOpen(true)
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Projections"
        description={`${currentYear} Cash Flow Tracker - All amounts in actual dollars.`}
        actions={
          <Button startIcon={<Add />} variant="contained" onClick={() => handleCreate('collections')}>
            Add Project
          </Button>
        }
      />

      <SectionCard title="Projection Planner">
        <Stack spacing={3}>
          <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)}>
            <Tab label={`${currentYear} Projections`} value="planner" />
            <Tab label="Actual vs Projected" value="actual_vs_projected" />
          </Tabs>

          {plannerQuery.isLoading ? (
            <>
              <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}>
                <TableSkeleton rows={4} height={320} />
                <TableSkeleton rows={4} height={320} />
              </Box>
              <TableSkeleton rows={10} height={720} />
            </>
          ) : plannerQuery.isError || !planner ? (
            <StateNotice title="Projections unavailable" description={getApiErrorMessage(plannerQuery.error)} />
          ) : (
            <>
              <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}>
                <SectionCard title="Cash Balance Forecast">
                  <Box sx={{ height: 300 }}>
                    <LineChart
                      height={300}
                      margin={{ top: 16, right: 16, bottom: 24, left: 72 }}
                      series={[
                        {
                          data: planner.charts.cash_balance_forecast.map((point) => point.amount),
                          label: 'Cash Balance',
                        },
                      ]}
                      xAxis={[
                        {
                          scaleType: 'point',
                          data: planner.charts.cash_balance_forecast.map((point) => formatMonthLabel(point.month)),
                        },
                      ]}
                    />
                  </Box>
                </SectionCard>

                <SectionCard title="Collections vs Total Expenses">
                  <Box sx={{ height: 300 }}>
                    <BarChart
                      height={300}
                      margin={{ top: 16, right: 16, bottom: 24, left: 72 }}
                      series={[
                        {
                          data: planner.charts.collections_vs_total_expenses.map((point) => point.revenue),
                          label: 'Collections',
                        },
                        {
                          data: planner.charts.collections_vs_total_expenses.map((point) => point.expenses),
                          label: 'Total Expenses',
                        },
                      ]}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: planner.charts.collections_vs_total_expenses.map((point) => formatMonthLabel(point.month)),
                        },
                      ]}
                    />
                  </Box>
                </SectionCard>
              </Box>

              {activeTab === 'planner' ? (
                <SectionCard
                  title={`TG Renovations - ${planner.year} Cash Flow Tracker`}
                  description='Click "Edit" on any row to modify values.'
                >
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 240 }}>Line Item</TableCell>
                          {monthLabels.map((label) => (
                            <TableCell key={label} align="right">
                              {label}
                            </TableCell>
                          ))}
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {planner.sections.map((section) => (
                          <Fragment key={section.key}>
                            <TableRow key={section.key}>
                              <TableCell colSpan={15} sx={{ bgcolor: 'grey.100', fontWeight: 700 }}>
                                {section.label}
                              </TableCell>
                            </TableRow>
                            {section.rows.map((row) => (
                              <TableRow key={row.id} hover>
                                <TableCell>{row.label}</TableCell>
                                {row.monthly_values.map((value) => (
                                  <TableCell key={`${row.id}-${value.month}`} align="right">
                                    {value.amount > 0 ? formatCurrency(value.amount) : '-'}
                                  </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                  {formatCurrency(row.total)}
                                </TableCell>
                                <TableCell align="right">
                                  {section.key === 'collections' || section.key === 'overhead' || section.key === 'marketing' ? (
                                    <IconButton
                                      aria-label={`Edit ${row.label}`}
                                      color="primary"
                                      size="small"
                                      onClick={() => handleEdit(row)}
                                    >
                                      <EditOutlined fontSize="small" />
                                    </IconButton>
                                  ) : null}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>{section.total_row.label}</TableCell>
                              {section.total_row.monthly_values.map((value) => (
                                <TableCell
                                  key={`${section.total_row.label}-${value.month}`}
                                  align="right"
                                  sx={{
                                    color: section.key === 'net_cash_flow' && value.amount < 0 ? 'error.main' : 'text.primary',
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatCurrency(value.amount)}
                                </TableCell>
                              ))}
                              <TableCell
                                align="right"
                                sx={{
                                  color: section.key === 'net_cash_flow' && section.total_row.total < 0 ? 'error.main' : 'text.primary',
                                  fontWeight: 700,
                                }}
                              >
                                {formatCurrency(section.total_row.total)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </SectionCard>
              ) : (
                <SectionCard title="Actual vs Projected">
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Projected Collections</TableCell>
                          <TableCell align="right">Actual Collections</TableCell>
                          <TableCell align="right">Projected Expenses</TableCell>
                          <TableCell align="right">Actual Expenses</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comparisonRows.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell>{row.month}</TableCell>
                            <TableCell align="right">{formatCurrency(row.projectedCollections)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.actualCollections)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.projectedExpenses)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.actualExpenses)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </SectionCard>
              )}
            </>
          )}
        </Stack>
      </SectionCard>

      <Dialog fullWidth maxWidth="md" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>{editingRow ? 'Edit projection row' : 'Add projection row'}</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} onSubmit={(event) => void handleSubmit(event)}>
            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                label="Section"
                select
                value={formState.section_key}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    section_key: event.target.value as ProjectionPlannerSectionKey,
                  }))
                }
              >
                <MenuItem value="collections">Collections</MenuItem>
                <MenuItem value="overhead">Overhead</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
              </TextField>
              <TextField
                label="Label"
                required
                value={formState.label}
                onChange={(event) => setFormState((current) => ({ ...current, label: event.target.value }))}
              />
            </Box>

            {formState.section_key === 'collections' ? (
              <TextField
                label="Cost Rate"
                type="number"
                helperText="Fraction of collections allocated to job costs (e.g. 0.65 = 65%)"
                value={formState.cost_rate}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, cost_rate: Number(event.target.value) }))
                }
              />
            ) : null}

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }}>
              {formState.monthly_values.map((value, index) => (
                <TextField
                  key={value.month}
                  label={monthLabels[index]}
                  type="number"
                  value={value.amount}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      monthly_values: current.monthly_values.map((item) =>
                        item.month === value.month ? { ...item, amount: Number(event.target.value) } : item,
                      ),
                    }))
                  }
                />
              ))}
            </Box>

            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5}>
              <Button variant="outlined" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={createPlannerRowMutation.isPending || updatePlannerRowMutation.isPending}
                type="submit"
                variant="contained"
              >
                {editingRow ? 'Save row' : 'Create row'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
