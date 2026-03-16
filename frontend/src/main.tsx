import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './index.css'
import App from './App.tsx'

const theme = createTheme({
  typography: {
    fontFamily: "'KoPub', sans-serif",
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: "'KoPub', sans-serif",
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
