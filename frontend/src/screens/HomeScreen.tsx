import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';

export function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View className="flex-1 bg-slate-900 items-center justify-center px-6">
      <Text className="text-3xl font-bold text-white mb-2">
        Olá, {user?.name}! 👋
      </Text>
      <Text className="text-emerald-400 font-semibold text-lg text-center mb-10">
        Bem-vindo ao Dashboard do Nosso Caixa.
      </Text>
      
      <TouchableOpacity 
        className="px-8 py-3 bg-red-500 rounded-lg active:bg-red-600"
        onPress={logout}
      >
        <Text className="text-white font-bold">Sair do App</Text>
      </TouchableOpacity>
    </View>
  );
}
