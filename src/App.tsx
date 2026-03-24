import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/app-shell'
import { DashboardPage } from '@/pages/dashboard-page'
import { JobCostsPage } from '@/pages/job-costs-page'
import { LogExpensePage } from '@/pages/log-expense-page'
import { OverheadPage } from '@/pages/overhead-page'
import { ProjectDetailPage } from '@/pages/project-detail-page'
import { ProjectsPage } from '@/pages/projects-page'
import { ProjectionsPage } from '@/pages/projections-page'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route element={<DashboardPage />} path="/" />
        <Route element={<LogExpensePage />} path="/log-expense" />
        <Route element={<ProjectsPage />} path="/projects" />
        <Route element={<ProjectDetailPage />} path="/projects/:id" />
        <Route element={<JobCostsPage />} path="/job-costs" />
        <Route element={<OverheadPage />} path="/overhead" />
        <Route element={<ProjectionsPage />} path="/projections" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

export default App
