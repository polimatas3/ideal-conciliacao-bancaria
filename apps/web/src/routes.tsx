import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccountsPage } from '@/pages/AccountsPage'
import { ReconciliationsPage } from '@/pages/ReconciliationsPage'
import { RunDetailPage } from '@/pages/RunDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, element: <Navigate to="/reconciliations" replace /> },
      { path: 'accounts', Component: AccountsPage },
      { path: 'reconciliations', Component: ReconciliationsPage },
      { path: 'reconciliations/:id', Component: RunDetailPage },
    ],
  },
])
