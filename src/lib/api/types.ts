export interface ApiResponse<T> {
  data: T
}

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'cancelled'

export type JobCostCategory =
  | 'materials'
  | 'labor'
  | 'subcontractor'
  | 'permits'
  | 'equipment'
  | 'other'

export type OverheadCategory =
  | 'marketing'
  | 'software'
  | 'office'
  | 'utilities'
  | 'insurance'
  | 'vehicles'
  | 'subscriptions'
  | 'other'

export interface ChartPoint {
  month: string
  amount: number
}

export interface DashboardSummary {
  starting_cash: number
  current_cash: number
  months_runway: number
  ytd_collections: number
  ytd_expenses: number
  gross_margin: number
  backlog: number
}

export interface DashboardToday {
  active_project_count: number
  current_month_overhead_count: number
  missing_recent_days: string[]
}

export interface DashboardActiveProject {
  id: string
  name: string
  status: ProjectStatus
  progress_percent: number
  collected_revenue: number
  contract_value: number
}

export interface DashboardValuePoint {
  label: string
  value: number
}

export interface DashboardComparisonPoint {
  month: string
  revenue: number
  expenses: number
}

export interface DashboardBudgetActualPoint {
  month: string
  budget: number
  actual: number
}

export interface DashboardCrossCheck {
  title: string
  detail: string
  severity: 'success' | 'warning' | 'error' | 'info'
  count: number
}

export interface DashboardMetrics {
  summary: DashboardSummary
  today: DashboardToday
  active_projects: DashboardActiveProject[]
  revenue_vs_expenses: DashboardComparisonPoint[]
  cash_flow_trend: ChartPoint[]
  gross_margin_by_project: DashboardValuePoint[]
  backlog_by_project: DashboardValuePoint[]
  ytd_budget_vs_actual: DashboardBudgetActualPoint[]
  cross_checks: DashboardCrossCheck[]
}

export interface Project {
  id: string
  name: string
  client_name: string
  project_address: string
  contract_value: number
  start_date: string
  estimated_end_date: string
  status: ProjectStatus
  notes: string
  created_at: string
  updated_at: string
  total_revenue: number
  total_job_costs: number
  profit: number
  profit_margin: number
}

export interface ProjectPayment {
  id: string
  project_id: string
  date: string
  amount: number
  payment_method: string
  description: string
  created_at: string
}

export interface CategoryTotal {
  category: string
  total: number
}

export interface JobCost {
  id: string
  project_id: string
  project_name?: string
  date: string
  category: JobCostCategory
  description: string
  vendor: string
  amount: number
  payment_method: string
  created_at: string
}

export interface ProjectDetail {
  project: Project
  payments: ProjectPayment[]
  costs: JobCost[]
  cost_breakdown: CategoryTotal[]
}

export interface OverheadExpense {
  id: string
  date: string
  category: OverheadCategory
  description: string
  vendor: string
  amount: number
  payment_method: string
  created_at: string
}

export interface OverheadSummary {
  monthly_total: number
  yearly_total: number
}

export interface OverheadList {
  items: OverheadExpense[]
  summary: OverheadSummary
}

export interface Projection {
  id: string
  month: string
  projected_revenue: number
  projected_job_costs: number
  projected_overhead: number
  notes: string
  created_at: string
  net_cash_flow: number
  ending_cash: number
}

export interface ProjectPayload {
  name: string
  client_name: string
  project_address: string
  contract_value: number
  start_date: string
  estimated_end_date: string
  status: ProjectStatus
  notes: string
}

export interface PaymentPayload {
  date: string
  amount: number
  payment_method: string
  description: string
}

export interface JobCostPayload {
  project_id: string
  date: string
  category: JobCostCategory
  description: string
  vendor: string
  amount: number
  payment_method: string
}

export interface OverheadPayload {
  date: string
  category: OverheadCategory
  description: string
  vendor: string
  amount: number
  payment_method: string
}

export interface ProjectionPayload {
  month: string
  projected_revenue: number
  projected_job_costs: number
  projected_overhead: number
  notes: string
}
