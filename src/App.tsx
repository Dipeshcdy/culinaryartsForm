import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { AdminDashboard } from './pages/AdminDashboard'
import { FormBuilderPage } from './pages/FormBuilderPage'
import { FormsListPage } from './pages/FormsListPage'
import { LoginPage } from './pages/LoginPage'
import { PublicFormPage } from './pages/PublicFormPage'
import { SubmissionsPage } from './pages/SubmissionsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="forms" element={<FormsListPage />} />
              <Route path="forms/new" element={<FormBuilderPage />} />
              <Route path="forms/:formId" element={<FormBuilderPage />} />
              <Route
                path="forms/:formId/submissions"
                element={<SubmissionsPage />}
              />
            </Route>
          </Route>
          <Route path="/:formId" element={<PublicFormPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
