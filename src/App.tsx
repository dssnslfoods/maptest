import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { LoginPage } from '@/pages/login';
import { SignupPage } from '@/pages/signup';
import { DashboardPage } from '@/pages/dashboard';
import { TestSetupPage } from '@/pages/test-setup';
import { TestActivePage } from '@/pages/test-active';
import { ResultsPage } from '@/pages/results';
import { ProgressPage } from '@/pages/progress';
import { StudentsPage } from '@/pages/students';
import { ReportsPage } from '@/pages/reports';
import { AdminQuestionsPage } from '@/pages/admin/questions';
import { AdminGeneratorPage } from '@/pages/admin/generator';
import { AdminDraftsPage } from '@/pages/admin/drafts';
import { SettingsPage } from '@/pages/settings';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/app-layout';
import { ErrorBoundary } from '@/components/error-boundary';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AuthGate>
            <Toaster richColors position="top-right" />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Active test runs outside main layout (full-screen) */}
              <Route
                path="/test/:sessionId"
                element={
                  <ProtectedRoute roles={['student']}>
                    <TestActivePage />
                  </ProtectedRoute>
                }
              />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/test/setup"
                  element={
                    <ProtectedRoute roles={['student']}>
                      <TestSetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/results/:sessionId" element={<ResultsPage />} />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute roles={['student']}>
                      <ProgressPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute roles={['teacher', 'admin']}>
                      <StudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute roles={['teacher', 'admin']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminQuestionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/generator"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminGeneratorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drafts"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDraftsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
