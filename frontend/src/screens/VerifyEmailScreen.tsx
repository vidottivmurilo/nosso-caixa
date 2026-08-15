import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { crossAlert } from '../utils/alertUtils';
import { api } from '../services/api';

export function VerifyEmailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Pega o e-mail que foi passado pela tela de cadastro
  const email = route.params?.email || '';

  async function handleVerify() {
    if (code.length !== 6) {
      crossAlert('Erro', 'O código deve ter exatamente 6 números.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, code });
      
      crossAlert('Sucesso!', 'Seu e-mail foi verificado. Agora você já pode entrar no app!', [
        { text: 'Ir para o Login', onPress: () => navigation.navigate('Login') }
      ]);
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao verificar o código.';
      const finalMessage = Array.isArray(message) ? message[0].message : message;
      crossAlert('Erro', finalMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-emerald-400">Verifique seu E-mail</Text>
        <Text className="text-slate-400 mt-2 text-base text-center">
          Enviamos um código de 6 dígitos para o e-mail:
        </Text>
        <Text className="text-emerald-300 font-bold mt-1 text-lg">{email}</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-slate-300 font-medium mb-1">Código de 6 dígitos</Text>
          <TextInput
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500 text-center text-2xl tracking-widest"
            placeholder="000000"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-lg items-center mt-8 active:bg-emerald-600"
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Verificar Conta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 items-center mt-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-slate-400 font-medium text-base">
            Voltar para o <Text className="text-emerald-400 font-bold">Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
