import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export function PrivateRoute() {
  const token = useAuthStore((state) => state.token)
  
  // Se não tem token, joga o usuário de volta pro login
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  // Se tem token, renderiza as rotas filhas
  return <Outlet />
}
