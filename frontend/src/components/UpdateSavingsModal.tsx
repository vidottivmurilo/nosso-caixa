import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { updateSavings } from '../services/dashboardService';

interface Props {
  visible: boolean;
  groupId: string;
  currentAmount: number;
  onClose: () => void;
  onSuccess: (newAmount: number) => void;
}

export function UpdateSavingsModal({ visible, groupId, currentAmount, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount(currentAmount.toString());
    }
  }, [visible, currentAmount]);

  async function handleSave() {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount < 0) {
      Alert.alert('Atenção', 'Valor inválido.');
      return;
    }

    try {
      setLoading(true);
      await updateSavings(groupId, numericAmount);
      Alert.alert('Sucesso', 'Valor da Caixinha atualizado!');
      onSuccess(numericAmount);
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível atualizar a caixinha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl"
        >
          <Text className="text-xl font-bold text-emerald-400 mb-2 text-center">🏦 Caixinha do Grupo</Text>
          <Text className="text-slate-400 text-center mb-6">
            Atualize o saldo total da reserva de emergência.
          </Text>

          <View className="mb-6 relative justify-center">
            <Text className="absolute left-4 text-slate-400 text-xl font-bold z-10 top-[18px]">R$</Text>
            <TextInput
              className="bg-slate-800 text-white text-2xl font-bold p-4 pl-12 rounded-xl text-center border border-slate-700"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#475569"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 py-4 rounded-xl items-center border border-slate-700"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="text-slate-300 font-bold text-base">Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-emerald-500 py-4 rounded-xl items-center shadow-lg shadow-emerald-500/30"
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
