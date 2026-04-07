import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { AppShell } from '@/components/app-shell'

const DashboardPage = lazy(() =>
  import('./pages/dashboard-page').then((m) => ({ default: m.DashboardPage })),
)
const LogExpensePage = lazy(() =>
  import('./pages/log-expense-page').then((m) => ({ default: m.LogExpensePage })),
)
const ProjectsPage = lazy(() =>
  import('./pages/projects-page').then((m) => ({ default: m.ProjectsPage })),
)
const ProjectDetailPage = lazy(() =>
  import('./pages/project-detail-page').then((m) => ({ default: m.ProjectDetailPage })),
)
const JobCostsPage = lazy(() =>
  import('./pages/job-costs-page').then((m) => ({ default: m.JobCostsPage })),
)
const OverheadPage = lazy(() =>
  import('./pages/overhead-page').then((m) => ({ default: m.OverheadPage })),
)
const ProjectionsPage = lazy(() =>
  import('./pages/projections-page').then((m) => ({ default: m.ProjectionsPage })),
)

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <DashboardPage />
            </Suspense>
          }
          path="/"
        />
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <LogExpensePage />
            </Suspense>
          }
          path="/log-expense"
        />
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <ProjectsPage />
            </Suspense>
          }
          path="/projects"
        />
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <ProjectDetailPage />
            </Suspense>
          }
          path="/projects/:id"
        />
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <JobCostsPage />
            </Suspense>
          }
          path="/job-costs"
        />
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <OverheadPage />
            </Suspense>
          }
          path="/overhead"
        />
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <ProjectionsPage />
            </Suspense>
          }
          path="/projections"
        />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

export default App
