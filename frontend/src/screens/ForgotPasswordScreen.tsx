import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { crossAlert } from '../utils/alertUtils';
import { api } from '../services/api';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!email) {
      crossAlert('Erro', 'Por favor, informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      
      crossAlert('Tudo certo!', 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.');
      navigation.navigate('ResetPassword', { email });
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao solicitar recuperação.';
      crossAlert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-emerald-400">Recuperar Senha</Text>
        <Text className="text-slate-400 mt-2 text-base text-center">
          Informe o e-mail cadastrado para enviarmos as instruções de recuperação.
        </Text>
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

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-lg items-center mt-8 active:bg-emerald-600"
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Enviar Código</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 items-center mt-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-slate-400 font-medium text-base">
            Lembrou a senha? <Text className="text-emerald-400 font-bold">Voltar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
