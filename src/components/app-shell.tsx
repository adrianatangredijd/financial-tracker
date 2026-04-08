import {
  Apartment as OverheadIcon,
  Assessment as ProjectionsIcon,
  Calculate as JobCostsIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Dashboard as DashboardIcon,
  Folder as ProjectsIcon,
  ReceiptLong as LogExpenseIcon,
  Menu as MenuIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { apiRequest } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/hooks'
import type { DashboardMetrics } from '@/lib/api/types'
import { sidebarItems } from '@/lib/constants'
import { navigationWidths } from '@/theme'

const icons = {
  Dashboard: DashboardIcon,
  'Log Expense': LogExpenseIcon,
  Projects: ProjectsIcon,
  'Job Costs': JobCostsIcon,
  Overhead: OverheadIcon,
  Projections: ProjectionsIcon,
} as const

export function AppShell() {
  const theme = useTheme()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isMediumUp = useMediaQuery(theme.breakpoints.up('md'))
  const isLargeUp = useMediaQuery(theme.breakpoints.up('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard,
      queryFn: () => apiRequest<DashboardMetrics>({ url: '/dashboard' }),
    })
  }, [queryClient])

  const drawerWidth = useMemo(() => {
    if (!isMediumUp) {
      return navigationWidths.expanded
    }

    if (isLargeUp) {
      return navigationWidths.expanded
    }

    return isCollapsed ? navigationWidths.collapsed : navigationWidths.expanded
  }, [isCollapsed, isLargeUp, isMediumUp])

  function isItemActive(href: string) {
    if (href === '/') {
      return location.pathname === '/'
    }

    return location.pathname.startsWith(href)
  }

  function renderNavigation(closeOnSelect: boolean) {
    return (
      <Stack sx={{ height: '100%' }}>
        <Box px={2} py={2}>
          <Stack alignItems={isCollapsed && isMediumUp && !isLargeUp ? 'center' : 'flex-start'} spacing={0.25}>
            <Typography
              color="text.secondary"
              fontSize={10}
              fontWeight={700}
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              Renovation
            </Typography>
            <Typography
              fontWeight={700}
              textAlign={isCollapsed && isMediumUp && !isLargeUp ? 'center' : 'left'}
              variant="subtitle1"
            >
              {isCollapsed && isMediumUp && !isLargeUp ? 'TG' : 'TG Renovation'}
            </Typography>
          </Stack>
        </Box>
        <Divider />
        <List sx={{ flexGrow: 1, px: 1, py: 1 }}>
          {sidebarItems.map((item) => {
            const Icon = icons[item.label]
            const selected = isItemActive(item.href)

            return (
              <Tooltip
                key={item.href}
                disableHoverListener={!isCollapsed || !isMediumUp || isLargeUp}
                placement="right"
                title={item.label}
              >
                <ListItemButton
                  component={NavLink}
                  selected={selected}
                  sx={{
                    borderRadius: 2,
                    justifyContent: isCollapsed && isMediumUp && !isLargeUp ? 'center' : 'flex-start',
                    mb: 0.5,
                    minHeight: 40,
                    px: 1.5,
                  }}
                  to={item.href}
                  onClick={() => {
                    if (closeOnSelect) {
                      setMobileOpen(false)
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: selected ? 'primary.main' : 'text.secondary',
                      minWidth: isCollapsed && isMediumUp && !isLargeUp ? 0 : 40,
                    }}
                  >
                    <Icon />
                  </ListItemIcon>
                  {isCollapsed && isMediumUp && !isLargeUp ? null : (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontWeight: selected ? 700 : 600 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>
      </Stack>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMediumUp ? (
        <Drawer
          ModalProps={{ keepMounted: true }}
          open={mobileOpen}
          PaperProps={{ sx: { width: navigationWidths.expanded } }}
          variant="temporary"
          onClose={() => setMobileOpen(false)}
        >
          {renderNavigation(true)}
        </Drawer>
      ) : (
        <Drawer
          open
          PaperProps={{
            sx: {
              overflowX: 'hidden',
              width: drawerWidth,
            },
          }}
          sx={{
            flexShrink: 0,
            width: drawerWidth,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
            },
          }}
          variant="permanent"
        >
          {renderNavigation(false)}
        </Drawer>
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          color="inherit"
          position="sticky"
          sx={{
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(255, 255, 255, 0.92)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 56 } }}>
            {!isMediumUp ? (
              <IconButton aria-label="Open navigation" edge="start" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            ) : !isLargeUp ? (
              <IconButton
                aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                edge="start"
                onClick={() => setIsCollapsed((current) => !current)}
              >
                {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
              </IconButton>
            ) : null}
          </Toolbar>
        </AppBar>

        <Container sx={{ px: { xs: 2, md: 3, lg: 4 }, py: { xs: 2, md: 3 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
