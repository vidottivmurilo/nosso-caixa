import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Routes } from './src/routes';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const { hydrate, isHydrated } = useAuthStore();

  // Quando o App inicia, pede pro Zustand buscar o Token no cofre do celular
  useEffect(() => {
    hydrate();
  }, []);

  // Enquanto busca no cofre (processo assíncrono), mostra um loading verde bonitão
  if (!isHydrated) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Com tudo carregado, devolve as Rotas dinâmicas
  return (
    <>
      <StatusBar style="light" />
      <Routes />
    </>
  );
}
