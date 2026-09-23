import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { shouldRetry } from './lib/helpers';
import App from './App.tsx'
import Session from './pages/Session.tsx'

import './index.css';
  
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
    },
  },
});

// TypeScript only:
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__:
      import('@tanstack/query-core')
        .QueryClient
  }
}

window.__TANSTACK_QUERY_CLIENT__ = queryClient

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/race/:sessionKey" element={<Session />} />
          <Route path="/race/:sessionKey/driver/:driverNumber" element={<div>About Page</div>} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
