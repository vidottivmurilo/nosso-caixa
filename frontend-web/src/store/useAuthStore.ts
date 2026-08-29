import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  token: string | null
  user: User | null
  currentGroupId: string | null
  setAuth: (token: string, user: User) => void
  setCurrentGroup: (groupId: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentGroupId: null,
      setAuth: (token, user) => set({ token, user }),
      setCurrentGroup: (groupId) => set({ currentGroupId: groupId }),
      logout: () => set({ token: null, user: null, currentGroupId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
