export const sidebarItems = [
  { label: 'Dashboard', href: '/' },
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

export const paymentMethodOptions = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'check', label: 'Check' },
  { value: 'ach', label: 'ACH' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
] as const
