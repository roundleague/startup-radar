import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Dashboard from './pages/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(240 8% 10%)',
            border: '1px solid hsl(240 10% 18%)',
            color: 'hsl(220 15% 92%)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
