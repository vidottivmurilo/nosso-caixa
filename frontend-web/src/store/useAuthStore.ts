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
  currentGroupName: string | null
  setAuth: (token: string, user: User) => void
  setCurrentGroup: (groupId: string, groupName: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentGroupId: null,
      currentGroupName: null,
      setAuth: (token, user) => set({ token, user }),
      setCurrentGroup: (groupId, groupName) => set({ currentGroupId: groupId, currentGroupName: groupName }),
      logout: () => set({ token: null, user: null, currentGroupId: null, currentGroupName: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
