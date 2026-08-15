import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { crossAlert } from '../utils/alertUtils';
import { api } from '../services/api';

export function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      crossAlert('Erro', 'Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      crossAlert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      
      navigation.navigate('VerifyEmail', { email });
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar a conta.';
      // O zod backend pode retornar array de issues, vamos pegar a primeira se houver
      const finalMessage = Array.isArray(message) ? message[0].message : message;
      crossAlert('Erro', finalMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-emerald-400">Criar Conta</Text>
        <Text className="text-slate-400 mt-2 text-base text-center">Junte-se ao Nosso Caixa e organize suas finanças</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-slate-300 font-medium mb-1">Nome</Text>
          <TextInput
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500"
            placeholder="Digite seu nome"
            placeholderTextColor="#64748b"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mt-4">
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
            placeholder="Digite sua senha (mín. 6 caracteres)"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-lg items-center mt-8 active:bg-emerald-600"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Cadastrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 items-center mt-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-slate-400 font-medium text-base">
            Já tem uma conta? <Text className="text-emerald-400 font-bold">Faça login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
