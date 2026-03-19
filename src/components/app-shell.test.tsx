import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppShell } from '@/components/app-shell'
import { renderWithProviders } from '@/test/test-utils'

function renderShell(initialPath = '/') {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route element={<div>Dashboard content</div>} path="/" />
          <Route element={<div>Projects content</div>} path="/projects" />
        </Route>
      </Routes>
    </MemoryRouter>,
    { withRouter: false },
  )
}

describe('AppShell', () => {
  it('uses a temporary drawer on mobile', async () => {
    const user = userEvent.setup()
    window.resizeTo(375, 812)

    renderShell('/')

    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))

    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('shows a collapsible sidebar control on tablet', () => {
    window.resizeTo(768, 1024)

    renderShell('/projects')

    expect(screen.getByRole('button', { name: 'Collapse navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Projects content')).toBeInTheDocument()
  })

  it('keeps desktop navigation visible without the collapse toggle', () => {
    window.resizeTo(1280, 900)

    renderShell('/projects')

    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collapse navigation' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Projects content')).toBeInTheDocument()
  })
})
