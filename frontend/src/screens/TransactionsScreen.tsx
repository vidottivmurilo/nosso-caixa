import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { fetchUserGroups, type Group } from '../services/dashboardService';
import { fetchTransactions, deleteTransaction, type Transaction } from '../services/transactionService';
import { NewTransactionModal } from '../components/NewTransactionModal';

// --- Helpers ---

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  // Garante que o timezone local seja compensado se necessário, 
  // mas como exibimos só DD/MM, uma conversão simples basta:
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// --- Componente de Item da Lista ---

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const isIncome = transaction.type === 'INCOME';
  const colorClass = isIncome ? 'text-emerald-400' : 'text-red-400';
  const icon = isIncome ? '💰' : '💸';

  return (
    <View className="bg-slate-800 p-4 rounded-xl mb-3 flex-row items-center justify-between border border-slate-700">
      <View className="flex-row items-center flex-1">
        <Text className="text-3xl mr-4">{icon}</Text>
        <View className="flex-1">
          <Text className="text-white font-bold text-base" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-slate-400 text-sm mt-1">
            {formatDate(transaction.date)}
            {transaction.category?.name ? ` • ${transaction.category.name}` : ''}
          </Text>
        </View>
      </View>

      <View className="items-end ml-2">
        <Text className={`font-bold text-lg ${colorClass}`}>
          {isIncome ? '+' : '-'}{formatBRL(transaction.amount)}
        </Text>
        
        {/* Botão de excluir discreto */}
        <TouchableOpacity 
          className="mt-2 p-1"
          onPress={() => onDelete(transaction.id)}
        >
          <Text className="text-red-500/70 text-xs font-semibold">Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Tela Principal ---

export function TransactionsScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  // 1. Pega o grupo
  useEffect(() => {
    loadGroup();
  }, []);

  async function loadGroup() {
    try {
      const groups = await fetchUserGroups();
      if (groups.length > 0) {
        setGroup(groups[0]);
      } else {
        setError('Nenhum grupo encontrado.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar o grupo.');
      setLoading(false);
    }
  }

  // 2. Busca as transações
  useEffect(() => {
    if (group) {
      loadTransactions();
    }
  }, [group, month, year]);

  async function loadTransactions() {
    if (!group) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions(group.id, month, year);
      setTransactions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar transações.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    if (!group) return;
    setRefreshing(true);
    try {
      const data = await fetchTransactions(group.id, month, year);
      setTransactions(data);
    } finally {
      setRefreshing(false);
    }
  }, [group, month, year]);

  // --- Deletar ---
  function handleDelete(id: string) {
    Alert.alert(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
              // Remove da lista localmente para resposta rápida
              setTransactions(prev => prev.filter(t => t.id !== id));
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível excluir a transação.');
            }
          }
        }
      ]
    );
  }

  // --- Navegação Mês ---
  function goToPreviousMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } 
    else { setMonth(m => m - 1); }
  }

  function goToNextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } 
    else { setMonth(m => m + 1); }
  }

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header Fixo */}
      <View className="bg-slate-800 pt-14 pb-4 px-6 border-b border-slate-700">
        <Text className="text-xl font-bold text-white mb-4">Movimentações</Text>
        
        <View className="flex-row items-center justify-center bg-slate-900 rounded-xl py-3 px-4">
          <TouchableOpacity className="px-3 py-1 active:opacity-60" onPress={goToPreviousMonth}>
            <Text className="text-emerald-400 text-xl font-bold">◀</Text>
          </TouchableOpacity>
          <Text className="text-white text-base font-semibold mx-4 min-w-[160px] text-center">
            {MESES[month - 1]} / {year}
          </Text>
          <TouchableOpacity className="px-3 py-1 active:opacity-60" onPress={goToNextMonth}>
            <Text className="text-emerald-400 text-xl font-bold">▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading / Erro */}
      {loading && !refreshing && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}

      {!loading && error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center">{error}</Text>
          <TouchableOpacity className="mt-4 bg-emerald-500 px-4 py-2 rounded" onPress={loadTransactions}>
            <Text className="text-white font-bold">Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {!loading && !error && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          renderItem={({ item }) => (
            <TransactionItem transaction={item} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-5xl mb-4">📭</Text>
              <Text className="text-slate-400 text-center">
                Nenhuma transação encontrada neste mês.
              </Text>
            </View>
          }
        />
      )}

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg shadow-black/50"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white text-3xl font-light mb-1">+</Text>
      </TouchableOpacity>

      {/* Modal */}
      {group && (
        <NewTransactionModal
          visible={modalVisible}
          groupId={group.id}
          onClose={() => setModalVisible(false)}
          onSuccess={() => {
            setModalVisible(false);
            loadTransactions(); // Recarrega a lista ao fechar
          }}
        />
      )}
    </View>
  );
}
