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

export type JobCostType =
  | 'sub_labor'
  | 'in_house'
  | 'materials'
  | 'timesheet_labor'
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

export type OverheadGroupKey =
  | 'admin_salaries'
  | 'insurance_licenses'
  | 'vehicles_equipment'
  | 'marketing'
  | 'rent_utilities'
  | 'other'

export interface ChartPoint {
  month: string
  amount: number
}

export interface DashboardSummary {
  current_cash: number
  total_collections: number
  total_job_costs: number
  total_overhead: number
  gross_profit: number
  net_profit: number
  backlog: number
  active_project_count: number
  over_budget_projects: number
  average_gross_margin: number
  total_project_count: number
  total_job_cost_count: number
  total_overhead_count: number
  total_projection_count: number
}

export interface DashboardProjectProgress {
  id: string
  name: string
  budget: number
  spent: number
  progress_percent: number
  status: string
  budget_consumption_percent: number
}

export interface DashboardForecastPoint {
  month: string
  actual_cash?: number
  projected_cash?: number
}

export interface DashboardProfitLoss {
  revenue: number
  job_costs: number
  gross_profit: number
  overhead: number
  net_profit: number
}

export interface DashboardBreakEven {
  monthly_overhead: number
  break_even_point: number
  revenue_run_rate: number
  surplus: number
  coverage_ratio: number
}

export interface DashboardComparisonPoint {
  month: string
  revenue: number
  expenses: number
}

export interface DashboardValuePoint {
  label: string
  value: number
}

export interface DashboardProjectMargin {
  project: string
  collected: number
  costs: number
  profit: number
  margin_percent: number
}

export interface DashboardBacklogSummary {
  total_contracted: number
  collected: number
  remaining: number
}

export interface DashboardBacklogRow {
  project: string
  contract: number
  remaining: number
  billed_percent: number
  milestone_percent: number
}

export interface DashboardBacklogPipeline {
  summary: DashboardBacklogSummary
  items: DashboardBacklogRow[]
}

export interface DashboardBudgetActualRow {
  metric: string
  budget: number
  actual: number
  variance: number
}

export interface DashboardBudgetActualPoint {
  month: string
  budget: number
  actual: number
}

export interface DashboardCrossCheckRow {
  month: string
  collections_actual: number
  collections_payments: number
  overhead_actual: number
  overhead_logs: number
  job_costs_actual: number
  job_costs_expected: number
}

export interface DashboardMetrics {
  summary: DashboardSummary
  project_progress: DashboardProjectProgress[]
  cash_flow_forecast: DashboardForecastPoint[]
  profit_loss: DashboardProfitLoss
  break_even: DashboardBreakEven
  job_cost_health: DashboardProjectProgress[]
  revenue_vs_expenses: DashboardComparisonPoint[]
  cash_flow_trend: ChartPoint[]
  gross_margin_by_project: DashboardProjectMargin[]
  backlog_pipeline: DashboardBacklogPipeline
  budget_vs_actual: DashboardBudgetActualRow[]
  data_cross_check: DashboardCrossCheckRow[]
}

export interface Project {
  id: string
  name: string
  client_name: string
  project_address: string
  contract_value: number
  job_cost_budget: number
  milestone_percent: number
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

export interface ProjectBudgetItem {
  id: string
  date: string
  vendor: string
  category: JobCostCategory
  description: string
  projected_amount: number
  actual_amount: number
  variance: number
  status: string
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
  cost_type: JobCostType
  description: string
  vendor: string
  projected_amount: number
  amount: number
  actual_amount: number
  variance: number
  status: string
  payment_method: string
  has_receipt: boolean
  created_at: string
}

export interface ProjectDetail {
  project: Project
  payments: ProjectPayment[]
  costs: JobCost[]
  cost_breakdown: CategoryTotal[]
  projected_total: number
  actual_spent: number
  variance: number
  budget_items: ProjectBudgetItem[]
}

export interface OverheadExpense {
  id: string
  date: string
  group_key: OverheadGroupKey
  category: OverheadCategory
  description: string
  vendor: string
  amount: number
  payment_method: string
  notes: string
  has_receipt: boolean
  created_at: string
}

export interface OverheadGroupSummary {
  group_key: OverheadGroupKey
  label: string
  total: number
}

export interface OverheadSummary {
  monthly_total: number
  avg_monthly: number
  yearly_total: number
  entry_count: number
  group_summaries: OverheadGroupSummary[]
  monthly_series: ChartPoint[]
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

export type ProjectionPlannerSectionKey =
  | 'collections'
  | 'job_costs'
  | 'gross_profit'
  | 'overhead'
  | 'marketing'
  | 'net_cash_flow'

export interface ProjectionPlannerValue {
  month: number
  amount: number
}

export interface ProjectionPlannerRow {
  id: string
  year: number
  section_key: ProjectionPlannerSectionKey
  label: string
  sort_order: number
  cost_rate: number
  monthly_values: ProjectionPlannerValue[]
  total: number
}

export interface ProjectionPlannerSection {
  key: ProjectionPlannerSectionKey
  label: string
  rows: ProjectionPlannerRow[]
  total_row: ProjectionPlannerRow
}

export interface ProjectionPlannerCharts {
  cash_balance_forecast: ChartPoint[]
  collections_vs_total_expenses: DashboardComparisonPoint[]
}

export interface ProjectionPlanner {
  year: number
  sections: ProjectionPlannerSection[]
  charts: ProjectionPlannerCharts
}

export interface ProjectPayload {
  name: string
  client_name: string
  project_address: string
  contract_value: number
  job_cost_budget: number
  milestone_percent: number
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
  cost_type?: JobCostType
  description: string
  vendor: string
  projected_amount?: number
  actual_amount?: number
  amount?: number
  payment_method: string
  has_receipt?: boolean
}

export interface OverheadPayload {
  date: string
  group_key?: OverheadGroupKey
  category: OverheadCategory
  description: string
  vendor: string
  amount: number
  payment_method: string
  notes?: string
  has_receipt?: boolean
}

export interface ProjectionPayload {
  month: string
  projected_revenue: number
  projected_job_costs: number
  projected_overhead: number
  notes: string
}

export interface ProjectionPlannerRowPayload {
  year: number
  section_key: ProjectionPlannerSectionKey
  label: string
  sort_order: number
  cost_rate: number
  monthly_values: ProjectionPlannerValue[]
}

export interface LogExpensePayload {
  date: string
  payment_method: string
  vendor: string
  description: string
  amount: number
  project_id?: string
  has_receipt?: boolean
  cost_type?: JobCostType
}

export interface LogExpenseResult {
  destination: 'job_cost' | 'overhead'
  project_id?: string
  job_cost?: JobCost
  overhead?: OverheadExpense
}
