import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { PageHeader, SectionCard, StateNotice } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api/client'
import { useCreateLogExpenseMutation, useProjectsQuery } from '@/lib/api/hooks'
import type { JobCostType, LogExpensePayload } from '@/lib/api/types'
import { jobCostTypeOptions, paymentMethodOptions } from '@/lib/constants'

interface LogExpenseFormState {
  date: string
  payment_method: string
  vendor: string
  description: string
  amount: number
  project_id: string
  has_receipt: boolean
  cost_type: JobCostType | ''
}

const emptyFormState: LogExpenseFormState = {
  date: '',
  payment_method: 'check',
  vendor: '',
  description: '',
  amount: 0,
  project_id: '',
  has_receipt: false,
  cost_type: '',
}

export function LogExpensePage() {
  const projectsQuery = useProjectsQuery()
  const createLogExpenseMutation = useCreateLogExpenseMutation()

  const [step, setStep] = useState<1 | 2>(1)
  const [formState, setFormState] = useState<LogExpenseFormState>(emptyFormState)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function updateField<K extends keyof LogExpenseFormState>(field: K, value: LogExpenseFormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function validateStepOne() {
    if (!formState.date || !formState.payment_method || !formState.description.trim()) {
      return 'Complete the required fields before continuing.'
    }
    if (!Number.isFinite(formState.amount) || formState.amount <= 0) {
      return 'Amount paid must be greater than zero.'
    }

    return null
  }

  function handleReview() {
    const error = validateStepOne()
    setValidationError(error)
    if (error) {
      return
    }

    setStep(2)
  }

  async function handleSave() {
    setValidationError(null)

    if (formState.project_id && !formState.cost_type) {
      setValidationError('Select a cost type for project expenses before saving.')
      return
    }

    const payload: LogExpensePayload = {
      date: formState.date,
      payment_method: formState.payment_method,
      vendor: formState.vendor,
      description: formState.description,
      amount: formState.amount,
      project_id: formState.project_id || undefined,
      has_receipt: formState.has_receipt,
      cost_type: formState.project_id ? formState.cost_type || undefined : undefined,
    }

    const result = await createLogExpenseMutation.mutateAsync(payload)
    setSuccessMessage(
      result.destination === 'overhead'
        ? 'Expense saved to Overhead.'
        : 'Expense saved to Job Costs.',
    )
    setFormState(emptyFormState)
    setStep(1)
  }

  const mutationError = createLogExpenseMutation.error
  const selectedProject = (projectsQuery.data ?? []).find((project) => project.id === formState.project_id)

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Log Expense"
        description="Enter once - auto-classified into Job Costs or Overhead. No double entry."
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button disabled variant={step === 1 ? 'contained' : 'outlined'}>
          1. Enter Details
        </Button>
        <Button disabled variant={step === 2 ? 'contained' : 'outlined'}>
          2. Review & Save
        </Button>
      </Stack>

      <SectionCard title={step === 1 ? 'Expense Details' : 'Review Classification'}>
        {projectsQuery.isLoading ? (
          <StateNotice title="Loading projects" description="Preparing available project options." />
        ) : projectsQuery.isError ? (
          <StateNotice title="Projects unavailable" description={getApiErrorMessage(projectsQuery.error)} />
        ) : (
          <Stack spacing={3}>
            {step === 1 ? (
              <>
                <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
                  <TextField
                    label="Date"
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                    type="date"
                    value={formState.date}
                    onChange={(event) => updateField('date', event.target.value)}
                  />
                  <TextField
                    label="Payment Method"
                    required
                    select
                    value={formState.payment_method}
                    onChange={(event) => updateField('payment_method', event.target.value)}
                  >
                    {paymentMethodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <TextField
                  label="Vendor / Employee / Payee"
                  value={formState.vendor}
                  onChange={(event) => updateField('vendor', event.target.value)}
                />

                <TextField
                  label="Description"
                  required
                  minRows={3}
                  multiline
                  value={formState.description}
                  onChange={(event) => updateField('description', event.target.value)}
                />

                <TextField
                  label="Amount Paid"
                  required
                  type="number"
                  value={formState.amount}
                  onChange={(event) => updateField('amount', Number(event.target.value))}
                />

                <TextField
                  label="Project"
                  select
                  value={formState.project_id}
                  onChange={(event) => updateField('project_id', event.target.value)}
                >
                  <MenuItem value="">None (Overhead)</MenuItem>
                  {(projectsQuery.data ?? []).map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {`${project.name} - ${project.client_name}`}
                    </MenuItem>
                  ))}
                </TextField>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formState.has_receipt}
                      onChange={(event) => updateField('has_receipt', event.target.checked)}
                    />
                  }
                  label="Has receipt"
                />
              </>
            ) : (
              <>
                <Alert severity="info" variant="outlined">
                  {formState.project_id
                    ? `This expense will be saved to Job Costs for ${selectedProject?.name ?? 'the selected project'}.`
                    : 'This expense will be saved to Overhead.'}
                </Alert>

                <Box display="grid" gap={1}>
                  <Typography variant="body2">
                    <strong>Date:</strong> {formState.date}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Method:</strong> {formState.payment_method}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payee:</strong> {formState.vendor || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong> {formState.description}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Amount:</strong> ${formState.amount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Project:</strong> {selectedProject ? selectedProject.name : 'None (Overhead)'}
                  </Typography>
                </Box>

                {formState.project_id ? (
                  <TextField
                    label="Cost Type"
                    required
                    select
                    value={formState.cost_type}
                    onChange={(event) => updateField('cost_type', event.target.value as JobCostType)}
                  >
                    {jobCostTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </>
            )}

            {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
            {mutationError ? <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert> : null}
            {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1.5}>
              {step === 2 ? (
                <Button variant="outlined" onClick={() => setStep(1)}>
                  Back
                </Button>
              ) : null}
              <Button
                disabled={createLogExpenseMutation.isPending}
                variant="contained"
                onClick={step === 1 ? handleReview : () => void handleSave()}
              >
                {step === 1 ? 'Review Classification' : 'Save'}
              </Button>
            </Stack>
          </Stack>
        )}
      </SectionCard>
    </Stack>
  )
}
