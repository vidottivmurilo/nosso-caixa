import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { crossAlert } from '../utils/alertUtils';
import { api } from '../services/api';

export function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // E-mail passado pela tela ForgotPassword
  const email = route.params?.email || '';

  async function handleResetPassword() {
    if (code.length !== 6) {
      crossAlert('Erro', 'O código deve ter exatamente 6 números.');
      return;
    }
    if (newPassword.length < 6) {
      crossAlert('Erro', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      
      crossAlert('Sucesso!', 'Sua senha foi redefinida. Agora você já pode fazer login com a senha nova!', [
        { text: 'Ir para o Login', onPress: () => navigation.navigate('Login') }
      ]);
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao redefinir a senha.';
      const finalMessage = Array.isArray(message) ? message[0].message : message;
      crossAlert('Erro', finalMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center px-6">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-emerald-400">Nova Senha</Text>
        <Text className="text-slate-400 mt-2 text-base text-center">
          Digite o código que enviamos para <Text className="text-emerald-300 font-bold">{email}</Text> e escolha a sua nova senha.
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-slate-300 font-medium mb-1">Código de 6 dígitos</Text>
          <TextInput
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500 text-center tracking-widest text-lg"
            placeholder="000000"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
        </View>

        <View className="mt-4">
          <Text className="text-slate-300 font-medium mb-1">Nova Senha</Text>
          <TextInput
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500"
            placeholder="Digite a nova senha"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-lg items-center mt-8 active:bg-emerald-600"
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Redefinir Senha</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 items-center mt-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-slate-400 font-medium text-base">
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
