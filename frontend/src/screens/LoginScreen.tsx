import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // O Zustand vai cuidar de salvar isso no cofre e disparar a mudança de tela!
      await login(token, user);
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-emerald-400">Nosso Caixa</Text>
        <Text className="text-slate-400 mt-2 text-base">Acesse sua conta para continuar</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-slate-300 font-medium mb-1">E-mail</Text>
          <TextInput
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500"
            placeholder="Digite seu e-mail"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mt-4">
          <Text className="text-slate-300 font-medium mb-1">Senha</Text>
          <TextInput
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500"
            placeholder="Digite sua senha"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-lg items-center mt-8 active:bg-emerald-600"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
