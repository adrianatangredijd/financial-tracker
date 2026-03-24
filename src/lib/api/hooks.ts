import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'

import { apiRequest } from '@/lib/api/client'
import type {
  DashboardMetrics,
  JobCost,
  JobCostPayload,
  LogExpensePayload,
  LogExpenseResult,
  OverheadExpense,
  OverheadList,
  OverheadPayload,
  PaymentPayload,
  ProjectionPlanner,
  ProjectionPlannerRow,
  ProjectionPlannerRowPayload,
  Projection,
  ProjectionPayload,
  Project,
  ProjectDetail,
  ProjectPayload,
  ProjectPayment,
} from '@/lib/api/types'

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  logExpense: ['log-expense'] as const,
  projects: ['projects'] as const,
  projectDetail: (projectId: string) => ['projects', projectId] as const,
  payments: (projectId: string) => ['projects', projectId, 'payments'] as const,
  jobCosts: ['job-costs'] as const,
  overhead: ['overhead'] as const,
  projections: ['projections'] as const,
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiRequest<DashboardMetrics>({ url: '/dashboard' }),
  })
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => apiRequest<Project[]>({ url: '/projects' }),
  })
}

export function useProjectDetailQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectDetail(projectId),
    queryFn: () => apiRequest<ProjectDetail>({ url: `/projects/${projectId}` }),
    enabled: Boolean(projectId),
  })
}

export function useCreateProjectMutation(
  options?: UseMutationOptions<Project, unknown, ProjectPayload>,
) {
  const queryClient = useQueryClient()
  const { onSuccess, ...mutationOptions } = options ?? {}

  return useMutation({
    ...mutationOptions,
    mutationFn: (payload: ProjectPayload) =>
      apiRequest<Project>({
        method: 'POST',
        url: '/projects',
        data: payload,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await onSuccess?.(...args)
    },
  })
}

export function useUpdateProjectMutation(
  options?: UseMutationOptions<Project, unknown, { projectId: string; payload: ProjectPayload }>,
) {
  const queryClient = useQueryClient()
  const { onSuccess, ...mutationOptions } = options ?? {}

  return useMutation({
    ...mutationOptions,
    mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectPayload }) =>
      apiRequest<Project>({
        method: 'PUT',
        url: `/projects/${projectId}`,
        data: payload,
      }),
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectDetail(variables.projectId),
      })
      await onSuccess?.(data, variables, context, mutation)
    },
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest<void>({
        method: 'DELETE',
        url: `/projects/${projectId}`,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string
      payload: PaymentPayload
    }) =>
      apiRequest<ProjectPayment>({
        method: 'POST',
        url: `/projects/${projectId}/payments`,
        data: payload,
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectDetail(variables.projectId),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.payments(variables.projectId),
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDeletePaymentMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentId: string) => {
      await apiRequest<void>({
        method: 'DELETE',
        url: `/payments/${paymentId}`,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectDetail(projectId),
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useJobCostsQuery() {
  return useQuery({
    queryKey: queryKeys.jobCosts,
    queryFn: () => apiRequest<JobCost[]>({ url: '/job-costs' }),
  })
}

export function useCreateJobCostMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JobCostPayload) =>
      apiRequest<JobCost>({
        method: 'POST',
        url: '/job-costs',
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobCosts })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDeleteJobCostMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobCostId: string) => {
      await apiRequest<void>({
        method: 'DELETE',
        url: `/job-costs/${jobCostId}`,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobCosts })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useCreateLogExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LogExpensePayload) =>
      apiRequest<LogExpenseResult>({
        method: 'POST',
        url: '/log-expense',
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobCosts })
      await queryClient.invalidateQueries({ queryKey: queryKeys.overhead })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useOverheadQuery() {
  return useQuery({
    queryKey: queryKeys.overhead,
    queryFn: () => apiRequest<OverheadList>({ url: '/overhead' }),
  })
}

export function useOverheadFilteredQuery(filters?: { year?: number; month?: number; group?: string }) {
  return useQuery({
    queryKey: [...queryKeys.overhead, filters ?? {}],
    queryFn: () =>
      apiRequest<OverheadList>({
        url: '/overhead',
        params: filters,
      }),
  })
}

export function useCreateOverheadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: OverheadPayload) =>
      apiRequest<OverheadExpense>({
        method: 'POST',
        url: '/overhead',
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.overhead })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDeleteOverheadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseId: string) => {
      await apiRequest<void>({
        method: 'DELETE',
        url: `/overhead/${expenseId}`,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.overhead })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateOverheadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: string; payload: OverheadPayload }) =>
      apiRequest<OverheadExpense>({
        method: 'PUT',
        url: `/overhead/${expenseId}`,
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.overhead })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useProjectionsQuery() {
  return useQuery({
    queryKey: queryKeys.projections,
    queryFn: () => apiRequest<Projection[]>({ url: '/projections' }),
  })
}

export function useProjectionPlannerQuery(year?: number) {
  return useQuery({
    queryKey: [...queryKeys.projections, 'planner', year ?? 'current'],
    queryFn: () =>
      apiRequest<ProjectionPlanner>({
        url: '/projections/planner',
        params: year ? { year } : undefined,
      }),
  })
}

export function useCreateProjectionMutation(
  options?: UseMutationOptions<Projection, unknown, ProjectionPayload>,
) {
  const queryClient = useQueryClient()
  const { onSuccess, ...mutationOptions } = options ?? {}

  return useMutation({
    ...mutationOptions,
    mutationFn: (payload: ProjectionPayload) =>
      apiRequest<Projection>({
        method: 'POST',
        url: '/projections',
        data: payload,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projections })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      await onSuccess?.(...args)
    },
  })
}

export function useUpdateProjectionMutation(
  options?: UseMutationOptions<
    Projection,
    unknown,
    { projectionId: string; payload: ProjectionPayload }
  >,
) {
  const queryClient = useQueryClient()
  const { onSuccess, ...mutationOptions } = options ?? {}

  return useMutation({
    ...mutationOptions,
    mutationFn: ({ projectionId, payload }: { projectionId: string; payload: ProjectionPayload }) =>
      apiRequest<Projection>({
        method: 'PUT',
        url: `/projections/${projectionId}`,
        data: payload,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projections })
      await onSuccess?.(...args)
    },
  })
}

export function useCreateProjectionPlannerRowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProjectionPlannerRowPayload) =>
      apiRequest<ProjectionPlannerRow>({
        method: 'POST',
        url: '/projections/planner/rows',
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projections })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateProjectionPlannerRowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ rowId, payload }: { rowId: string; payload: ProjectionPlannerRowPayload }) =>
      apiRequest<ProjectionPlannerRow>({
        method: 'PUT',
        url: `/projections/planner/rows/${rowId}`,
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projections })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
