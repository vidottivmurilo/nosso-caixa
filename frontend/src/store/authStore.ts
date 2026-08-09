import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

// Helpers para garantir que funcione na Web (localStorage) e no Celular (SecureStore)
const setItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false, // Controla se já terminamos de buscar os dados do SecureStore no boot do App
  
  login: async (token: string, user: User) => {
    // 1. Salva no cofre (ou no localStorage da web)
    await setItem('auth_token', token);
    await setItem('auth_user', JSON.stringify(user));
    
    // 2. Disponibiliza instantaneamente na memória global do App
    set({ token, user });
  },

  logout: async () => {
    await deleteItem('auth_token');
    await deleteItem('auth_user');
    set({ token: null, user: null });
  },

  // Função chamada logo que o App abre para restaurar a sessão do usuário
  hydrate: async () => {
    try {
      const token = await getItem('auth_token');
      const userStr = await getItem('auth_user');
      
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
