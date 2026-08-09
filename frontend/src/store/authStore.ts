import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false, // Controla se já terminamos de buscar os dados do SecureStore no boot do App
  
  login: async (token: string, user: User) => {
    // 1. Salva no cofre criptografado do celular
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    
    // 2. Disponibiliza instantaneamente na memória global do App
    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ token: null, user: null });
  },

  // Função chamada logo que o App abre para restaurar a sessão do usuário
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error("Erro ao carregar sessão protegida:", error);
      set({ isHydrated: true });
    }
  }
}));
