import { DeleteOutline, EditOutlined, OpenInNew, PostAdd } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
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
import { Link as RouterLink } from 'react-router-dom'

import { ConfirmDialog, PageHeader, SectionCard, StateNotice, StatusBadge, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from '@/lib/api/hooks'
import type { Project, ProjectPayload } from '@/lib/api/types'
import { projectStatusOptions } from '@/lib/constants'
import { formatCurrency, formatDate, formatPercent, toDateInputValue } from '@/lib/utils'

const emptyProjectPayload: ProjectPayload = {
  name: '',
  client_name: '',
  project_address: '',
  contract_value: 0,
  start_date: '',
  estimated_end_date: '',
  status: 'planning',
  notes: '',
}

function buildProjectPayload(project?: Project): ProjectPayload {
  if (!project) {
    return emptyProjectPayload
  }

  return {
    name: project.name,
    client_name: project.client_name,
    project_address: project.project_address,
    contract_value: project.contract_value,
    start_date: toDateInputValue(project.start_date),
    estimated_end_date: toDateInputValue(project.estimated_end_date),
    status: project.status,
    notes: project.notes,
  }
}

export function ProjectsPage() {
  const theme = useTheme()
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'))
  const isDesktopUp = useMediaQuery(theme.breakpoints.up('lg'))
  const projectsQuery = useProjectsQuery()
  const createProjectMutation = useCreateProjectMutation({
    onSuccess: async () => {
      await projectsQuery.refetch()
      setEditingProject(null)
      setFormState(emptyProjectPayload)
      setFormMessage({
        severity: 'success',
        text: 'Project created successfully.',
      })
    },
  })
  const updateProjectMutation = useUpdateProjectMutation({
    onSuccess: async () => {
      await projectsQuery.refetch()
      setEditingProject(null)
      setFormState(emptyProjectPayload)
      setFormMessage({
        severity: 'success',
        text: 'Project updated successfully.',
      })
    },
  })
  const deleteProjectMutation = useDeleteProjectMutation()

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formState, setFormState] = useState<ProjectPayload>(emptyProjectPayload)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(
    null,
  )

  const projects = useMemo(
    () =>
      [...(projectsQuery.data ?? [])].sort((left, right) =>
        right.updated_at.localeCompare(left.updated_at),
      ),
    [projectsQuery.data],
  )

  const mutationError =
    createProjectMutation.error ?? updateProjectMutation.error ?? deleteProjectMutation.error

  const responsiveVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({
      client_name: isTabletUp,
      total_revenue: isTabletUp,
      total_job_costs: isDesktopUp,
      profit: isDesktopUp,
      profit_margin: isDesktopUp,
      contract_value: true,
      status: true,
      actions: true,
      name: true,
    }),
    [isDesktopUp, isTabletUp],
  )

  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>(responsiveVisibilityModel)

  useEffect(() => {
    setColumnVisibilityModel(responsiveVisibilityModel)
  }, [responsiveVisibilityModel])

  function handleFieldChange<K extends keyof ProjectPayload>(field: K, value: ProjectPayload[K]) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function handleEdit(project: Project) {
    setEditingProject(project)
    setFormState(buildProjectPayload(project))
  }

  function handleCancelEdit() {
    setEditingProject(null)
    setFormState(emptyProjectPayload)
    setValidationError(null)
  }

  async function handleDelete(projectId: string) {
    await deleteProjectMutation.mutateAsync(projectId)
    if (editingProject?.id === projectId) {
      handleCancelEdit()
    }
    setProjectToDelete(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (
      !formState.name.trim() ||
      !formState.client_name.trim() ||
      !formState.project_address.trim() ||
      !formState.start_date ||
      !formState.estimated_end_date
    ) {
      setValidationError('Complete all required fields before saving the project.')
      return
    }

    if (!Number.isFinite(formState.contract_value) || formState.contract_value <= 0) {
      setValidationError('Contract value must be greater than zero.')
      return
    }

    try {
      if (editingProject) {
        await updateProjectMutation.mutateAsync({
          projectId: editingProject.id,
          payload: formState,
        })
        return
      }

      await createProjectMutation.mutateAsync(formState)
    } catch (error) {
      setFormMessage({
        severity: 'error',
        text: getApiErrorMessage(error),
      })
    }
  }

  const columns = useMemo<GridColDef<Project>[]>(
    () => [
      {
        field: 'name',
        flex: 1.4,
        headerName: 'Project',
        minWidth: 240,
        renderCell: ({ row }) => (
          <Box py={1}>
            <Typography fontWeight={700} variant="body2">
              {row.name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {row.project_address}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Ends {formatDate(row.estimated_end_date)}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'client_name',
        flex: 1,
        headerName: 'Client',
        minWidth: 180,
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 140,
        renderCell: ({ value }) => <StatusBadge value={String(value)} />,
      },
      {
        field: 'contract_value',
        headerName: 'Contract',
        minWidth: 140,
        valueFormatter: (value) => formatCurrency(Number(value)),
      },
      {
        field: 'total_revenue',
        headerName: 'Revenue',
        minWidth: 140,
        valueFormatter: (value) => formatCurrency(Number(value)),
      },
      {
        field: 'total_job_costs',
        headerName: 'Costs',
        minWidth: 140,
        valueFormatter: (value) => formatCurrency(Number(value)),
      },
      {
        field: 'profit',
        headerName: 'Profit',
        minWidth: 140,
        valueFormatter: (value) => formatCurrency(Number(value)),
      },
      {
        field: 'profit_margin',
        headerName: 'Margin',
        minWidth: 120,
        valueFormatter: (value) => formatPercent(Number(value)),
      },
      {
        field: 'actions',
        disableColumnMenu: true,
        filterable: false,
        headerName: 'Actions',
        minWidth: 180,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton
              aria-label={`Open ${row.name}`}
              color="primary"
              component={RouterLink}
              size="small"
              to={`/projects/${row.id}`}
            >
              <OpenInNew fontSize="small" />
            </IconButton>
            <IconButton
              aria-label={`Edit ${row.name}`}
              color="primary"
              size="small"
              onClick={() => handleEdit(row)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton
              aria-label={`Delete ${row.name}`}
              color="error"
              size="small"
              onClick={() => setProjectToDelete(row)}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [],
  )

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Projects"
        description="Manage active work, contract values, profitability, and project-level notes."
        actions={
          editingProject ? (
            <Button fullWidth={!isTabletUp} variant="outlined" onClick={handleCancelEdit}>
              Create new project
            </Button>
          ) : (
            <Button
              fullWidth={!isTabletUp}
              startIcon={<PostAdd />}
              variant="contained"
              onClick={() => {
                setEditingProject(null)
                setFormState(emptyProjectPayload)
              }}
            >
              New project
            </Button>
          )
        }
      />

      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: '1fr', xl: 'minmax(0, 1.7fr) minmax(360px, 0.9fr)' }}
      >
        <SectionCard
          title="Project portfolio"
          description="Review financial performance and open any project for deeper cost and payment detail."
        >
          {projectsQuery.isLoading ? (
            <TableSkeleton rows={5} height={640} />
          ) : projectsQuery.isError ? (
            <StateNotice
              title="Projects unavailable"
              description={getApiErrorMessage(projectsQuery.error)}
            />
          ) : projects.length === 0 ? (
            <StateNotice
              title="No projects yet"
              description="Create the first project to start tracking contract value, payments, and profitability."
            />
          ) : (
            <Box sx={{ height: 640, width: '100%' }}>
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
                rows={projects}
                showToolbar
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                  },
                }}
                sx={{
                  border: 0,
                  minWidth: 0,
                }}
                onColumnVisibilityModelChange={setColumnVisibilityModel}
              />
            </Box>
          )}
        </SectionCard>

        <SectionCard
          title={editingProject ? 'Edit project' : 'Create project'}
          description="Use the backend project payload shape to create or update contract records."
        >
          <Box component="form" display="grid" gap={2} noValidate onSubmit={(event) => void handleSubmit(event)}>
            <TextField
              id="project_name"
              label="Project name"
              required
              value={formState.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
            />

            <TextField
              id="client_name"
              label="Client name"
              required
              value={formState.client_name}
              onChange={(event) => handleFieldChange('client_name', event.target.value)}
            />

            <TextField
              id="project_address"
              label="Project address"
              required
              value={formState.project_address}
              onChange={(event) => handleFieldChange('project_address', event.target.value)}
            />

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                id="contract_value"
                label="Contract value"
                required
                type="number"
                value={formState.contract_value}
                onChange={(event) => handleFieldChange('contract_value', Number(event.target.value))}
              />
              <TextField
                id="project_status"
                label="Status"
                select
                SelectProps={{ native: true }}
                value={formState.status}
                onChange={(event) => handleFieldChange('status', event.target.value as Project['status'])}
              >
                {projectStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Box>

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                id="start_date"
                label="Start date"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={formState.start_date}
                onChange={(event) => handleFieldChange('start_date', event.target.value)}
              />
              <TextField
                id="estimated_end_date"
                label="Estimated end date"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={formState.estimated_end_date}
                onChange={(event) => handleFieldChange('estimated_end_date', event.target.value)}
              />
            </Box>

            <TextField
              id="project_notes"
              label="Notes"
              minRows={4}
              multiline
              value={formState.notes}
              onChange={(event) => handleFieldChange('notes', event.target.value)}
            />

            {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                type="submit"
                variant="contained"
              >
                {createProjectMutation.isPending || updateProjectMutation.isPending
                  ? editingProject
                    ? 'Saving...'
                    : 'Creating...'
                  : editingProject
                    ? 'Save project'
                    : 'Create project'}
              </Button>
              {editingProject ? (
                <Button variant="outlined" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </Stack>
          </Box>
        </SectionCard>
      </Box>

      <ConfirmDialog
        confirmLabel="Delete project"
        description="This will remove the project and its related records."
        isLoading={deleteProjectMutation.isPending}
        open={Boolean(projectToDelete)}
        title={projectToDelete ? `Delete ${projectToDelete.name}?` : 'Delete project?'}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            void handleDelete(projectToDelete.id)
          }
        }}
      />

      <Snackbar
        autoHideDuration={4000}
        open={Boolean(formMessage)}
        onClose={() => setFormMessage(null)}
      >
        <Alert
          severity={formMessage?.severity ?? 'success'}
          sx={{ width: '100%' }}
          onClose={() => setFormMessage(null)}
        >
          {formMessage?.text}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
