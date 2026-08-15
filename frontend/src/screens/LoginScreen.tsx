import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { crossAlert, crossConfirm } from '../utils/alertUtils';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  async function handleResendCode() {
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      crossAlert('Sucesso!', 'Novo código reenviado para o seu e-mail.');
      navigation.navigate('VerifyEmail', { email });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao reenviar código.';
      crossAlert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      crossAlert('Erro', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // O Zustand vai cuidar de salvar isso no cofre e disparar a mudança de tela!
      await login(token, user);
      
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Erro ao fazer login.';
      
      if (status === 403) {
        const wantsToResend = await crossConfirm('Conta não ativada', message + '\n\nDeseja reenviar o código de ativação?');
        if (wantsToResend) {
          handleResendCode();
        }
      } else {
        crossAlert('Erro', message);
      }
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
          <TouchableOpacity 
            className="mt-2 self-end"
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-emerald-400 font-medium text-sm">Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-lg items-center mt-6 active:bg-emerald-600"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 items-center mt-2"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-slate-400 font-medium text-base">
            Não tem uma conta? <Text className="text-emerald-400 font-bold">Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
