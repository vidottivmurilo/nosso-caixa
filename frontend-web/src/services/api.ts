import { useAuthStore } from '../store/useAuthStore'

// Lendo a URL da API da variável de ambiente, com fallback de segurança (mas o ideal é sempre definir a env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token
  
  const headers = new Headers(options.headers)
  
  // Por padrão enviamos JSON, a não ser que FormData seja usado
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  // Interceptador para caso o token expire
  if (response.status === 401) {
    useAuthStore.getState().logout()
    // Opcional: recarregar a página ou apenas deixar o PrivateRoute cuidar
  }
  
  return response
}
