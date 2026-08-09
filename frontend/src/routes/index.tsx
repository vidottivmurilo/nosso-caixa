import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

export function Routes() {
  // O componente observa o token. Se mudar, ele troca a Stack instantaneamente.
  const { token } = useAuthStore();

  return (
    <NavigationContainer>
      {token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
