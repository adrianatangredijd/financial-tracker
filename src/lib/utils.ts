const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function parseDisplayDate(value: string) {
  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Date(`${value}-01T00:00:00`)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`)
  }

  return new Date(value)
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value)
}

export function formatDecimal(value: number) {
  return decimalFormatter.format(value)
}

export function formatDate(value: string) {
  const date = parseDisplayDate(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatMonthLabel(value: string) {
  const date = parseDisplayDate(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function toDateInputValue(value?: string) {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

export function toMonthInputValue(value?: string) {
  if (!value) {
    return ''
  }

  return value.slice(0, 7)
}

export function monthValueToApi(value: string) {
  return `${value}-01`
}
