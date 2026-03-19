import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import type { DashboardCrossCheck } from '@/lib/api/types'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems={{ xs: 'flex-start', md: 'flex-end' }}
      justifyContent="space-between"
    >
      <Box>
        <Typography
          color="primary.main"
          fontSize={12}
          fontWeight={700}
          letterSpacing="0.18em"
          textTransform="uppercase"
        >
          Construction Financial Tracker
        </Typography>
        <Typography mt={1} variant="h4">
          {title}
        </Typography>
        <Typography color="text.secondary" maxWidth={720} mt={1.5} variant="body2">
          {description}
        </Typography>
      </Box>
      {actions ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
  )
}

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <Card>
      <CardHeader
        subheader={label}
        subheaderTypographyProps={{ fontWeight: 600, textTransform: 'uppercase', variant: 'caption' }}
        title={value}
        titleTypographyProps={{ variant: 'h5' }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Typography color="text.secondary" variant="body2">
          {helper}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function DashboardHeroMetricCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography color="text.secondary" fontWeight={700} textTransform="uppercase" variant="caption">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
          <Typography color="text.secondary" variant="body2">
            {subtitle}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function DashboardProjectList({
  items,
  emptyState,
}: {
  items: ReactNode[]
  emptyState: string
}) {
  if (items.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {emptyState}
      </Typography>
    )
  }

  return <List disablePadding>{items}</List>
}

export function DashboardProjectListItem({
  title,
  progressLabel,
  amountLabel,
  progressValue,
}: {
  title: string
  progressLabel: string
  amountLabel: string
  progressValue: number
}) {
  return (
    <ListItem disableGutters sx={{ py: 1.5 }}>
      <Stack spacing={1.25} sx={{ width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <ListItemText
            primary={title}
            primaryTypographyProps={{ fontWeight: 700, variant: 'body2' }}
            secondary={progressLabel}
            secondaryTypographyProps={{ color: 'text.secondary', variant: 'caption' }}
            sx={{ m: 0 }}
          />
          <Typography fontWeight={700} variant="body2">
            {amountLabel}
          </Typography>
        </Stack>
        <LinearProgress
          sx={{ borderRadius: 999, height: 8 }}
          value={Math.max(0, Math.min(progressValue, 100))}
          variant="determinate"
        />
      </Stack>
    </ListItem>
  )
}

export function DashboardCrossCheckList({ items }: { items: DashboardCrossCheck[] }) {
  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Alert key={item.title} severity={item.severity} variant="outlined">
          <Stack spacing={0.5}>
            <Typography fontWeight={700} variant="body2">
              {item.title}
            </Typography>
            <Typography variant="body2">{item.detail}</Typography>
          </Stack>
        </Alert>
      ))}
    </Stack>
  )
}

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader action={actions} subheader={description} title={title} />
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function StatusBadge({
  value,
}: {
  value: string
}) {
  const palette: Record<string, 'warning' | 'success' | 'info' | 'error' | 'default'> = {
    planning: 'warning',
    active: 'success',
    completed: 'info',
    cancelled: 'error',
  }

  return (
    <Chip
      color={palette[value] ?? 'default'}
      label={value.replaceAll('_', ' ')}
      sx={{
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
      variant="filled"
    />
  )
}

export function StateNotice({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent>
        <Stack alignItems="center" spacing={1.5} textAlign="center">
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary" maxWidth={520} variant="body2">
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isLoading = false,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={isLoading} variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" disabled={isLoading} variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
