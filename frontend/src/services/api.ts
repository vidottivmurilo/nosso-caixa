import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * ATENÇÃO: Ao rodar no emulador Android ou celular físico, 
 * 'localhost' aponta para o próprio dispositivo móvel. 
 * Portanto, usamos o IP da sua máquina na rede Wi-Fi.
 */
const API_URL = 'http://192.168.15.4:3000';

export const api = axios.create({
  baseURL: API_URL,
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 * Um middleware invisível que é acionado ANTES de cada chamada pra API.
 * Ele vai na Store Global (Zustand), pega o Token JWT e anexa no cabeçalho (Header).
 */
api.interceptors.request.use(
  (config) => {
    // Lendo do estado sem precisar de Hooks do React
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
