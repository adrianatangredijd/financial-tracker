import { createTheme } from '@mui/material/styles'

export const navigationWidths = {
  expanded: 280,
  collapsed: 88,
} as const

const serifStack = '"Times New Roman", Georgia, "Palatino Linotype", serif'
const sansStack =
  '"Century Gothic", Futura, "Trebuchet MS", "Questrial", Arial, sans-serif'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      dark: '#000000',
      light: '#404040',
    },
    secondary: {
      main: '#404040',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    error: {
      main: '#b71c1c',
    },
    text: {
      primary: '#000000',
      secondary: '#404040',
    },
    divider: '#B3B2B2',
  },
  shape: {
    borderRadius: 16,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 1280,
      xl: 1536,
    },
  },
  spacing: 8,
  typography: {
    fontFamily: sansStack,
    h4: {
      fontFamily: serifStack,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: serifStack,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontFamily: serifStack,
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          minHeight: '100%',
          backgroundColor: '#FFFFFF',
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          paddingInline: 18,
          minHeight: 42,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '1px solid #B3B2B2',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px 0',
        },
        title: {
          fontSize: '1.05rem',
          fontWeight: 600,
        },
        subheader: {
          marginTop: 4,
          color: '#404040',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'xl',
      },
    },
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
        maxWidth: 'sm',
      },
      styleOverrides: {
        paper: {
          borderRadius: 24,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #B3B2B2',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: 'outlined',
      },
    },
  },
})
