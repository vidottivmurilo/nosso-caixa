import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { fetchUserGroups, type Group } from '../services/dashboardService';
import { 
  fetchFixedExpenses, 
  createFixedExpense, 
  generateMonthExpenses, 
  deleteFixedExpense, 
  type FixedExpense 
} from '../services/fixedExpenseService';
import { fetchCategories, type Category } from '../services/transactionService';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function FixedExpensesScreen() {
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const groups = await fetchUserGroups();
      if (groups.length > 0) {
        const firstGroup = groups[0];
        setGroup(firstGroup);
        await loadExpenses(firstGroup.id);
      } else {
        setError('Nenhum grupo encontrado.');
      }
    } catch (err: any) {
      setError('Erro ao carregar dados iniciais.');
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses(groupId: string) {
    try {
      const data = await fetchFixedExpenses(groupId);
      setExpenses(data);
    } catch {
      // silencioso
    }
  }

  const onRefresh = useCallback(async () => {
    if (!group) return;
    setRefreshing(true);
    await loadExpenses(group.id);
    setRefreshing(false);
  }, [group]);

  // --- Ação Principal: Gerar Mês ---
  async function handleGenerateMonth() {
    if (!group) return;
    Alert.alert(
      'Gerar Contas do Mês',
      'Isso vai criar as transações no seu histórico para todas as contas listadas abaixo. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Gerar', 
          onPress: async () => {
            try {
              setLoading(true);
              const now = new Date();
              await generateMonthExpenses(group.id, now.getMonth() + 1, now.getFullYear());
              Alert.alert('Sucesso', 'As contas fixas foram lançadas nas suas Transações!');
            } catch (err) {
              Alert.alert('Erro', 'Falha ao gerar as contas do mês.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  // --- Deletar ---
  function handleDelete(id: string) {
    Alert.alert('Excluir Conta', 'Remover esta assinatura/conta fixa?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFixedExpense(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        }
      }
    ]);
  }

  // --- Modal Cadastro ---
  async function openModal() {
    setModalVisible(true);
    if (categories.length === 0) {
      try {
        const data = await fetchCategories();
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      } catch (err) {}
    }
  }

  async function handleSaveNew() {
    if (!group || !description || !amount || !dayOfMonth || !categoryId) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    
    const numericAmount = parseFloat(amount.replace(',', '.'));
    const day = parseInt(dayOfMonth, 10);

    if (isNaN(numericAmount) || isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Atenção', 'Valores inválidos.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createFixedExpense({
        group_id: group.id,
        category_id: categoryId,
        amount: numericAmount,
        day_of_month: day,
        type,
        description
      });
      setModalVisible(false);
      setDescription('');
      setAmount('');
      setDayOfMonth('');
      await loadExpenses(group.id);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="bg-slate-800 pt-14 pb-6 px-6 border-b border-slate-700">
        <Text className="text-xl font-bold text-white mb-2">Despesas Fixas</Text>
        <Text className="text-slate-400">Gerencie assinaturas e contas que se repetem todo mês.</Text>
        
        <TouchableOpacity 
          className="mt-6 bg-emerald-500 py-3 rounded-xl items-center flex-row justify-center"
          onPress={handleGenerateMonth}
        >
          <Text className="text-white font-bold text-base ml-2">⚡ Gerar Folha deste Mês</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          renderItem={({ item }) => (
            <View className="bg-slate-800 p-4 rounded-xl mb-3 flex-row items-center justify-between border border-slate-700">
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{item.description}</Text>
                <Text className="text-slate-400 text-sm mt-1">Dia {item.day_of_month} • {item.category?.name}</Text>
              </View>
              <View className="items-end">
                <Text className={`font-bold text-lg ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatBRL(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="mt-2 p-1">
                  <Text className="text-red-500/70 text-xs font-semibold">Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-slate-400 text-center">Nenhuma conta fixa cadastrada.</Text>
            </View>
          }
        />
      )}

      {/* FAB Nova Conta */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg shadow-black/50"
        onPress={openModal}
      >
        <Text className="text-white text-3xl font-light mb-1">+</Text>
      </TouchableOpacity>

      {/* Modal Cadastro */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-700" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between mb-4">
              <Text className="text-xl font-bold text-white">Nova Assinatura/Conta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text className="text-slate-400 font-bold text-lg">✕</Text></TouchableOpacity>
            </View>
            
            <ScrollView>
              <View className="flex-row mb-4 bg-slate-800 rounded-lg p-1">
                <TouchableOpacity className={`flex-1 py-2 rounded-md items-center ${type === 'EXPENSE' ? 'bg-red-500' : ''}`} onPress={() => setType('EXPENSE')}>
                  <Text className={`font-bold ${type === 'EXPENSE' ? 'text-white' : 'text-slate-400'}`}>Conta (Saída)</Text>
                </TouchableOpacity>
                <TouchableOpacity className={`flex-1 py-2 rounded-md items-center ${type === 'INCOME' ? 'bg-emerald-500' : ''}`} onPress={() => setType('INCOME')}>
                  <Text className={`font-bold ${type === 'INCOME' ? 'text-white' : 'text-slate-400'}`}>Renda Fixa</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-slate-400 mb-1">Descrição</Text>
              <TextInput className="bg-slate-800 text-white p-4 rounded-xl mb-4" placeholder="Ex: Conta de Luz" placeholderTextColor="#64748b" value={description} onChangeText={setDescription} />

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-slate-400 mb-1">Valor</Text>
                  <TextInput className="bg-slate-800 text-white p-4 rounded-xl" placeholder="0,00" keyboardType="numeric" placeholderTextColor="#64748b" value={amount} onChangeText={setAmount} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 mb-1">Dia do Vencimento</Text>
                  <TextInput className="bg-slate-800 text-white p-4 rounded-xl" placeholder="Ex: 5" keyboardType="numeric" placeholderTextColor="#64748b" value={dayOfMonth} onChangeText={setDayOfMonth} />
                </View>
              </View>

              <Text className="text-slate-400 mb-1">Categoria (ID provisório)</Text>
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

              <TouchableOpacity className="bg-emerald-500 py-4 rounded-xl items-center mt-4 mb-6" onPress={handleSaveNew} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Salvar Assinatura</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
