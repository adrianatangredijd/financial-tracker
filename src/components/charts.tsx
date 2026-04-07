import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Box, Card, CardContent, CardHeader } from '@mui/material'
import type { ReactNode } from 'react'
import { Bar, Line } from 'react-chartjs-2'

import type {
  ChartPoint,
  DashboardBudgetActualPoint,
  DashboardComparisonPoint,
  DashboardValuePoint,
} from '@/lib/api/types'
import { formatCurrency, formatMonthLabel, formatPercent } from '@/lib/utils'

import { StateNotice } from '@/components/ui'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

function buildLabels(points: ChartPoint[]) {
  return points.map((point) => formatMonthLabel(point.month))
}

function renderPanel(
  title: string,
  description: string,
  content: ReactNode,
) {
  return (
    <Card>
      <CardHeader subheader={description} title={title} />
      <CardContent>
        <Box sx={{ height: { xs: 280, md: 320 }, width: '100%' }}>{content}</Box>
      </CardContent>
    </Card>
  )
}

export function ComparisonBarChartPanel({
  title,
  description,
  data,
}: {
  title: string
  description: string
  data: DashboardComparisonPoint[]
}) {
  if (data.length === 0) {
    return <StateNotice title={title} description="No chart data available yet." />
  }

  return renderPanel(
    title,
    description,
    <Bar
      data={{
        labels: data.map((point) => formatMonthLabel(point.month)),
        datasets: [
          {
            label: 'Revenue',
            data: data.map((point) => point.revenue),
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderRadius: 10,
          },
          {
            label: 'Expenses',
            data: data.map((point) => point.expenses),
            backgroundColor: 'rgba(64, 64, 64, 0.85)',
            borderRadius: 10,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${formatCurrency(context.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => formatCurrency(Number(value ?? 0)),
            },
          },
        },
      }}
    />,
  )
}

export function LineChartPanel({
  title,
  description,
  data,
}: {
  title: string
  description: string
  data: ChartPoint[]
}) {
  if (data.length === 0) {
    return <StateNotice title={title} description="No chart data available yet." />
  }

  return renderPanel(
    title,
    description,
    <Line
      data={{
        labels: buildLabels(data),
        datasets: [
          {
            label: title,
            data: data.map((point) => point.amount),
            borderColor: '#000000',
            backgroundColor: 'rgba(0, 0, 0, 0.10)',
            fill: true,
            tension: 0.3,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => formatCurrency(context.parsed.y ?? 0),
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => formatCurrency(Number(value ?? 0)),
            },
          },
        },
      }}
    />,
  )
}

export function ValueBarChartPanel({
  title,
  description,
  data,
  valueKind = 'currency',
}: {
  title: string
  description: string
  data: DashboardValuePoint[]
  valueKind?: 'currency' | 'percent'
}) {
  if (data.length === 0) {
    return <StateNotice title={title} description="No chart data available yet." />
  }

  const formatValue = (value: number) =>
    valueKind === 'percent' ? formatPercent(value / 100) : formatCurrency(value)

  return renderPanel(
    title,
    description,
    <Bar
      data={{
        labels: data.map((point) => point.label),
        datasets: [
          {
            label: title,
            data: data.map((point) => point.value),
            backgroundColor: 'rgba(179, 178, 178, 0.82)',
            borderRadius: 10,
          },
        ],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => formatValue(context.parsed.x ?? 0),
            },
          },
        },
        scales: {
          x: {
            ticks: {
              callback: (value) => formatValue(Number(value ?? 0)),
            },
          },
        },
      }}
    />,
  )
}

export function BudgetActualChartPanel({
  title,
  description,
  data,
}: {
  title: string
  description: string
  data: DashboardBudgetActualPoint[]
}) {
  if (data.length === 0) {
    return <StateNotice title={title} description="No chart data available yet." />
  }

  return renderPanel(
    title,
    description,
    <Bar
      data={{
        labels: data.map((point) => formatMonthLabel(point.month)),
        datasets: [
          {
            label: 'Budget',
            data: data.map((point) => point.budget),
            backgroundColor: 'rgba(179, 178, 178, 0.5)',
            borderRadius: 10,
          },
          {
            label: 'Actual',
            data: data.map((point) => point.actual),
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderRadius: 10,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${formatCurrency(context.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => formatCurrency(Number(value ?? 0)),
            },
          },
        },
      }}
    />,
  )
}
