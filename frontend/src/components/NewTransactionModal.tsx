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
  ScrollView,
  Alert,
} from 'react-native';
import { parseTransactionWithAi } from '../services/aiService';
import { createTransaction, createInstallment, fetchCategories, type Category } from '../services/transactionService';

interface Props {
  visible: boolean;
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTransactionModal({ visible, groupId, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'AI' | 'MANUAL'>('AI');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Campos Modo IA
  const [aiPrompt, setAiPrompt] = useState('');

  // Campos Modo Manual
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [date, setDate] = useState(''); // Simplificado, usaria um DatePicker em prod

  useEffect(() => {
    if (visible) {
      loadCategories();
      resetForm();
    }
  }, [visible]);

  async function loadCategories() {
    try {
      const data = await fetchCategories();
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    } catch {
      // Falha silenciosa ou log
    }
  }

  function resetForm() {
    setAiPrompt('');
    setDescription('');
    setAmount('');
    setType('EXPENSE');
    setIsInstallment(false);
    setInstallmentsCount('2');
    setMode('AI');
    setDate(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  }

  // --- Envio IA ---
  async function handleAiSubmit() {
    if (!aiPrompt.trim()) return;
    try {
      setLoading(true);
      await parseTransactionWithAi(aiPrompt, groupId);
      // Se a IA processou e já salvou no backend (como vimos no controller)
      Alert.alert('Sucesso', 'Transação registrada com Inteligência Artificial!');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'A Inteligência Artificial não conseguiu entender sua frase.');
    } finally {
      setLoading(false);
    }
  }

  // --- Envio Manual ---
  async function handleManualSubmit() {
    if (!description || !amount || !categoryId || !date) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Atenção', 'Valor inválido.');
      return;
    }

    try {
      setLoading(true);
      const isoDate = new Date(date).toISOString();

      if (isInstallment) {
        const count = parseInt(installmentsCount, 10);
        if (isNaN(count) || count < 2) {
          Alert.alert('Atenção', 'Número de parcelas inválido.');
          setLoading(false);
          return;
        }
        await createInstallment({
          group_id: groupId,
          category_id: categoryId,
          total_amount: numericAmount,
          installments_count: count,
          start_date: isoDate,
          description,
        });
      } else {
        await createTransaction({
          group_id: groupId,
          category_id: categoryId,
          amount: numericAmount,
          type,
          description,
          date: isoDate,
        });
      }

      Alert.alert('Sucesso', 'Transação registrada com sucesso!');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="bg-slate-900 rounded-t-3xl border-t border-slate-700 overflow-hidden"
          style={{ maxHeight: '90%' }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-slate-800">
            <Text className="text-xl font-bold text-white">Nova Movimentação</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-slate-400 font-bold text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Abas */}
          <View className="flex-row mx-6 mt-4 bg-slate-800 rounded-lg p-1">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-md items-center ${mode === 'AI' ? 'bg-emerald-500' : ''}`}
              onPress={() => setMode('AI')}
            >
              <Text className={`font-bold ${mode === 'AI' ? 'text-white' : 'text-slate-400'}`}>✨ Assistente IA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-md items-center ${mode === 'MANUAL' ? 'bg-emerald-500' : ''}`}
              onPress={() => setMode('MANUAL')}
            >
              <Text className={`font-bold ${mode === 'MANUAL' ? 'text-white' : 'text-slate-400'}`}>✍️ Manual</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* MODO IA */}
            {mode === 'AI' && (
              <View>
                <Text className="text-slate-300 text-base mb-4 text-center">
                  Digite ou fale como foi o gasto e eu organizo tudo para você.
                </Text>
                
                <View className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
                  <TextInput
                    className="text-white text-lg min-h-[100px]"
                    placeholder="Ex: Comprei pizza ontem por 60 conto no crédito parcelado em 2x..."
                    placeholderTextColor="#64748b"
                    multiline
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  className={`py-4 rounded-xl items-center ${loading || !aiPrompt.trim() ? 'bg-emerald-500/50' : 'bg-emerald-500'}`}
                  onPress={handleAiSubmit}
                  disabled={loading || !aiPrompt.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-lg">Processar Mágica ✨</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* MODO MANUAL */}
            {mode === 'MANUAL' && (
              <View>
                {/* Tipo */}
                <View className="flex-row mb-4 bg-slate-800 rounded-lg p-1">
                  <TouchableOpacity
                    className={`flex-1 py-2 rounded-md items-center ${type === 'EXPENSE' ? 'bg-red-500' : ''}`}
                    onPress={() => setType('EXPENSE')}
                  >
                    <Text className={`font-bold ${type === 'EXPENSE' ? 'text-white' : 'text-slate-400'}`}>Saída</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-2 rounded-md items-center ${type === 'INCOME' ? 'bg-emerald-500' : ''}`}
                    onPress={() => setType('INCOME')}
                  >
                    <Text className={`font-bold ${type === 'INCOME' ? 'text-white' : 'text-slate-400'}`}>Entrada</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-slate-400 mb-1">Descrição</Text>
                <TextInput
                  className="bg-slate-800 text-white p-4 rounded-xl mb-4"
                  placeholder="Ex: Conta de Luz"
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                />

                <Text className="text-slate-400 mb-1">Valor (R$)</Text>
                <TextInput
                  className="bg-slate-800 text-white p-4 rounded-xl mb-4"
                  placeholder="0,00"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                {/* Select de Categoria Simples (em React Native real usaríamos um Picker) */}
                <Text className="text-slate-400 mb-1">Categoria (ID - temporário até criarmos um Picker visual)</Text>
                <View className="flex-row flex-wrap mb-4">
                  {categories.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      className={`mr-2 mb-2 px-3 py-1 rounded-full border ${categoryId === c.id ? 'bg-slate-700 border-emerald-500' : 'border-slate-700'}`}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text className={categoryId === c.id ? 'text-emerald-400' : 'text-slate-400'}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className="text-slate-400 mb-1">Data (YYYY-MM-DD)</Text>
                <TextInput
                  className="bg-slate-800 text-white p-4 rounded-xl mb-4"
                  value={date}
                  onChangeText={setDate}
                />

                {type === 'EXPENSE' && (
                  <View className="flex-row items-center justify-between mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <Text className="text-white">É parcelado?</Text>
                    <TouchableOpacity
                      className={`w-6 h-6 rounded border ${isInstallment ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}
                      onPress={() => setIsInstallment(!isInstallment)}
                    >
                      {isInstallment && <Text className="text-white text-center text-xs">✓</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {isInstallment && type === 'EXPENSE' && (
                  <View className="mb-4">
                    <Text className="text-slate-400 mb-1">Número de Parcelas</Text>
                    <TextInput
                      className="bg-slate-800 text-white p-4 rounded-xl"
                      keyboardType="numeric"
                      value={installmentsCount}
                      onChangeText={setInstallmentsCount}
                    />
                  </View>
                )}

                <TouchableOpacity
                  className="bg-emerald-500 py-4 rounded-xl items-center mt-4"
                  onPress={handleManualSubmit}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Salvar Manualmente</Text>}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
