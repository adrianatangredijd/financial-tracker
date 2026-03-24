export const sidebarItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Log Expense', href: '/log-expense' },
  { label: 'Projects', href: '/projects' },
  { label: 'Job Costs', href: '/job-costs' },
  { label: 'Overhead', href: '/overhead' },
  { label: 'Projections', href: '/projections' },
] as const

export const projectStatusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const jobCostCategoryOptions = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'permits', label: 'Permits' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
] as const

export const jobCostTypeOptions = [
  { value: 'sub_labor', label: 'Sub Labor' },
  { value: 'in_house', label: 'In-House' },
  { value: 'materials', label: 'Materials' },
  { value: 'timesheet_labor', label: 'Timesheet Labor' },
  { value: 'permits', label: 'Permits' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
] as const

export const overheadCategoryOptions = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'office', label: 'Office' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'other', label: 'Other' },
] as const

export const overheadGroupOptions = [
  { value: 'admin_salaries', label: 'Admin Salaries' },
  { value: 'insurance_licenses', label: 'Insurance & Licenses' },
  { value: 'vehicles_equipment', label: 'Vehicles & Equipment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'rent_utilities', label: 'Rent & Utilities' },
  { value: 'other', label: 'Other' },
] as const

export const paymentMethodOptions = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'check', label: 'Check' },
  { value: 'ach', label: 'ACH' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
] as const
