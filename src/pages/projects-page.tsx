import { DeleteOutline, EditOutlined, PostAdd, Search, VisibilityOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { ConfirmDialog, PageHeader, StateNotice, StatusBadge, TableSkeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from '@/lib/api/hooks'
import type { Project, ProjectPayload } from '@/lib/api/types'
import { projectStatusOptions } from '@/lib/constants'
import { formatCurrency, toDateInputValue } from '@/lib/utils'

const emptyProjectPayload: ProjectPayload = {
  name: '',
  client_name: '',
  project_address: '',
  contract_value: 0,
  job_cost_budget: 0,
  milestone_percent: 0,
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
    job_cost_budget: project.job_cost_budget,
    milestone_percent: project.milestone_percent,
    start_date: toDateInputValue(project.start_date),
    estimated_end_date: toDateInputValue(project.estimated_end_date),
    status: project.status,
    notes: project.notes,
  }
}

export function ProjectsPage() {
  const theme = useTheme()
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'))
  const projectsQuery = useProjectsQuery()
  const createProjectMutation = useCreateProjectMutation({
    onSuccess: async () => {
      await projectsQuery.refetch()
      setEditingProject(null)
      setIsFormOpen(false)
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
      setIsFormOpen(false)
      setFormState(emptyProjectPayload)
      setFormMessage({
        severity: 'success',
        text: 'Project updated successfully.',
      })
    },
  })
  const deleteProjectMutation = useDeleteProjectMutation()

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formState, setFormState] = useState<ProjectPayload>(emptyProjectPayload)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
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
  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    if (!normalizedQuery) {
      return projects
    }

    return projects.filter((project) =>
      [project.name, project.client_name, project.project_address].some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [projects, searchValue])

  const mutationError =
    createProjectMutation.error ?? updateProjectMutation.error ?? deleteProjectMutation.error

  function handleFieldChange<K extends keyof ProjectPayload>(field: K, value: ProjectPayload[K]) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function handleEdit(project: Project) {
    setEditingProject(project)
    setFormState(buildProjectPayload(project))
    setValidationError(null)
    setIsFormOpen(true)
  }

  function handleCancelEdit() {
    setEditingProject(null)
    setFormState(emptyProjectPayload)
    setValidationError(null)
    setIsFormOpen(false)
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

    if (!Number.isFinite(formState.job_cost_budget) || formState.job_cost_budget <= 0) {
      setValidationError('Job cost budget must be greater than zero.')
      return
    }

    if (!Number.isFinite(formState.milestone_percent) || formState.milestone_percent < 0 || formState.milestone_percent > 100) {
      setValidationError('Milestone progress must be between 0 and 100.')
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

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Projects"
        description="Track active jobs, milestone progress, collected revenue, and portfolio health."
        actions={
          <Button
            fullWidth={!isTabletUp}
            startIcon={<PostAdd />}
            variant="contained"
            onClick={() => {
              setEditingProject(null)
              setFormState(emptyProjectPayload)
              setValidationError(null)
              setIsFormOpen(true)
            }}
          >
            New Project
          </Button>
        }
      />

      <Stack spacing={1}>
        <Typography color="text.secondary" variant="body2">
          {filteredProjects.length} total project{filteredProjects.length === 1 ? '' : 's'}
        </Typography>
        <TextField
          placeholder="Search projects..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Card sx={{ borderRadius: 4 }}>
        {projectsQuery.isLoading ? (
          <TableSkeleton rows={8} height={620} />
        ) : projectsQuery.isError ? (
          <Box p={3}>
            <StateNotice title="Projects unavailable" description={getApiErrorMessage(projectsQuery.error)} />
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box p={3}>
            <StateNotice
              title="No projects found"
              description={
                searchValue
                  ? 'Try another search term or clear the filter.'
                  : 'Create the first project to start tracking contract value and progress.'
              }
            />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  {isTabletUp ? <TableCell>Client</TableCell> : null}
                  {isTabletUp ? <TableCell>Address</TableCell> : null}
                  <TableCell>Contract</TableCell>
                  <TableCell>Collected</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Milestone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700} variant="body2">
                          {project.name}
                        </Typography>
                        {!isTabletUp ? (
                          <Typography color="text.secondary" variant="caption">
                            {project.client_name}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    {isTabletUp ? <TableCell>{project.client_name}</TableCell> : null}
                    {isTabletUp ? (
                      <TableCell>
                        <Typography color="text.secondary" variant="body2">
                          {project.project_address}
                        </Typography>
                      </TableCell>
                    ) : null}
                    <TableCell>{formatCurrency(project.contract_value)}</TableCell>
                    <TableCell>{formatCurrency(project.total_revenue)}</TableCell>
                    <TableCell>
                      <Stack alignItems="flex-start" direction="row" spacing={1.5}>
                        <Box sx={{ minWidth: 56 }}>
                          <LinearProgress
                            sx={{ borderRadius: 999, height: 8, mt: 1 }}
                            value={Math.max(0, Math.min(project.milestone_percent, 100))}
                            variant="determinate"
                          />
                        </Box>
                        <Typography variant="body2">{`${project.milestone_percent.toFixed(0)}%`}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={project.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <IconButton
                          aria-label={`Open ${project.name}`}
                          component={RouterLink}
                          size="small"
                          to={`/projects/${project.id}`}
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                        <IconButton aria-label={`Edit ${project.name}`} size="small" onClick={() => handleEdit(project)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${project.name}`}
                          color="error"
                          size="small"
                          onClick={() => setProjectToDelete(project)}
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
      </Card>

      <Dialog fullWidth maxWidth="md" open={isFormOpen} onClose={handleCancelEdit}>
        <DialogTitle>{editingProject ? 'Edit project' : 'New project'}</DialogTitle>
        <DialogContent>
          <Box component="form" display="grid" gap={2} mt={1} noValidate onSubmit={(event) => void handleSubmit(event)}>
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
                id="job_cost_budget"
                label="Job cost budget"
                required
                type="number"
                value={formState.job_cost_budget}
                onChange={(event) => handleFieldChange('job_cost_budget', Number(event.target.value))}
              />
            </Box>

            <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
              <TextField
                id="milestone_percent"
                label="Milestone progress %"
                required
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                value={formState.milestone_percent}
                onChange={(event) => handleFieldChange('milestone_percent', Number(event.target.value))}
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
              <Button variant="outlined" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

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
