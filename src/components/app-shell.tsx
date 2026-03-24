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
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

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
  const isMediumUp = useMediaQuery(theme.breakpoints.up('md'))
  const isLargeUp = useMediaQuery(theme.breakpoints.up('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

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
        <Box px={2.5} py={3}>
          <Stack alignItems={isCollapsed && isMediumUp && !isLargeUp ? 'center' : 'flex-start'} spacing={1}>
            <Typography
              color="primary.main"
              fontSize={12}
              fontWeight={700}
              letterSpacing="0.2em"
              textTransform="uppercase"
            >
              Operations
            </Typography>
            <Typography
              textAlign={isCollapsed && isMediumUp && !isLargeUp ? 'center' : 'left'}
              variant="h6"
            >
              {isCollapsed && isMediumUp && !isLargeUp ? 'FT' : 'Financial Tracker'}
            </Typography>
            {isCollapsed && isMediumUp && !isLargeUp ? null : (
              <Typography color="text.secondary" variant="body2">
                Manage project profitability, direct job costs, overhead, and forward cash flow.
              </Typography>
            )}
          </Stack>
        </Box>
        <Divider />
        <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
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
                    borderRadius: 3,
                    justifyContent: isCollapsed && isMediumUp && !isLargeUp ? 'center' : 'flex-start',
                    mb: 0.75,
                    minHeight: 48,
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
            bgcolor: 'rgba(248, 250, 252, 0.92)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64, md: 72 } }}>
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
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">Construction Financial Tracker</Typography>
              <Typography color="text.secondary" variant="body2">
                Responsive project finance operations
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container sx={{ px: { xs: 2, md: 3, lg: 4 }, py: { xs: 3, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
