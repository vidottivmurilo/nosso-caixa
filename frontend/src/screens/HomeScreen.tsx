import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import {
  fetchUserGroups,
  fetchDashboardSummary,
  type Group,
  type DashboardSummary,
} from '../services/dashboardService';
import { UpdateSavingsModal } from '../components/UpdateSavingsModal';

// --- Helpers ---

/** Array com nomes dos meses em PT-BR para exibir no seletor */
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Formata um número para moeda brasileira: R$ 1.234,56 */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// --- Componente de Card Financeiro ---

interface FinanceCardProps {
  icon: string;
  label: string;
  value: number;
  colorClass: string;
}

function FinanceCard({ icon, label, value, colorClass }: FinanceCardProps) {
  return (
    <View className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
      <View className="flex-row items-center mb-2">
        <Text className="text-2xl mr-2">{icon}</Text>
        <Text className="text-slate-400 text-sm font-medium">{label}</Text>
      </View>
      <Text className={`text-2xl font-bold ${colorClass}`}>
        {formatBRL(value)}
      </Text>
    </View>
  );
}

// --- Tela Principal (Dashboard) ---

export function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { activeGroup, setActiveGroup, setUserGroups, loadPersistedGroupId } = useGroupStore();

  // Estado do seletor de mês/ano (inicializa com o mês e ano atuais)
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // getMonth() é 0-indexed
  const [year, setYear] = useState(now.getFullYear());

  // Estado dos dados do Dashboard
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- Busca inicial: carrega todos os grupos e define o ativo ---
  useEffect(() => {
    loadPersistedGroupId().then(() => loadGroups());
  }, []);

  async function loadGroups() {
    try {
      setError(null);
      const groups = await fetchUserGroups();
      setUserGroups(groups);

      if (groups.length === 0) {
        setError('Você ainda não faz parte de nenhum grupo.');
        await setActiveGroup(null);
        setLoading(false);
        return;
      }

      // Lê o estado atual diretamente do store (evita closure stale)
      const currentState = useGroupStore.getState();

      // Se não tem grupo ativo, define um
      if (!currentState.activeGroup) {
        const storedGroup = groups.find(g => g.id === currentState.persistedGroupId);
        await setActiveGroup(storedGroup || groups[0]);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao buscar seus grupos.';
      setError(message);
      setLoading(false);
    }
  }

  // --- Sempre que o grupo ativo, mês ou ano mudar, busca o summary ---
  useEffect(() => {
    if (activeGroup) {
      loadSummary();
    }
  }, [activeGroup, month, year]);

  async function loadSummary() {
    if (!activeGroup) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardSummary(activeGroup.id, month, year);
      setSummary(data);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao carregar o dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // --- Pull-to-refresh ---
  const onRefresh = useCallback(async () => {
    if (!activeGroup) return;
    setRefreshing(true);
    try {
      const data = await fetchDashboardSummary(activeGroup.id, month, year);
      setSummary(data);
    } catch {
      // Silenciosamente falha no refresh
    } finally {
      setRefreshing(false);
    }
  }, [activeGroup, month, year]);

  // --- Navegação entre meses ---
  function goToPreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  // --- Render ---

  return (
    <View className="flex-1 bg-slate-900">
      {/* ===== HEADER ===== */}
      <View className="bg-slate-800 pt-14 pb-6 px-6 border-b border-slate-700">
        {/* Linha superior: saudação + logout */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </Text>
            {activeGroup && (
              <Text className="text-slate-400 text-sm mt-1">
                📂 {activeGroup.name}
              </Text>
            )}
          </View>

          <TouchableOpacity
            className="bg-slate-700 px-4 py-2 rounded-lg active:bg-slate-600"
            onPress={logout}
          >
            <Text className="text-red-400 font-semibold text-sm">Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Seletor de Mês/Ano */}
        <View className="flex-row items-center justify-center mt-4 bg-slate-900 rounded-xl py-3 px-4">
          <TouchableOpacity
            className="px-3 py-1 active:opacity-60"
            onPress={goToPreviousMonth}
          >
            <Text className="text-emerald-400 text-xl font-bold">◀</Text>
          </TouchableOpacity>

          <Text className="text-white text-base font-semibold mx-4 min-w-[160px] text-center">
            {MESES[month - 1]} / {year}
          </Text>

          <TouchableOpacity
            className="px-3 py-1 active:opacity-60"
            onPress={goToNextMonth}
          >
            <Text className="text-emerald-400 text-xl font-bold">▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== CONTEÚDO ===== */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {/* Estado: Loading */}
        {loading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-slate-400 mt-4 text-sm">
              Carregando seu dashboard...
            </Text>
          </View>
        )}

        {/* Estado: Erro */}
        {!loading && error && (
          <View className="items-center justify-center py-20 px-4">
            <Text className="text-4xl mb-4">⚠️</Text>
            <Text className="text-red-400 text-center text-base font-medium">
              {error}
            </Text>
            <TouchableOpacity
              className="mt-6 bg-emerald-500 px-6 py-3 rounded-lg active:bg-emerald-600"
              onPress={() => activeGroup ? loadSummary() : loadGroups()}
            >
              <Text className="text-white font-bold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estado: Dados carregados com sucesso */}
        {!loading && !error && summary && (
          <>
            <FinanceCard
              icon="💰"
              label="Entradas"
              value={summary.total_income}
              colorClass="text-emerald-400"
            />

            <FinanceCard
              icon="💸"
              label="Saídas"
              value={summary.total_expenses}
              colorClass="text-red-400"
            />

            <FinanceCard
              icon="📊"
              label="Saldo do Mês"
              value={summary.balance}
              colorClass={summary.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />

            <View className="flex-row gap-4 mb-8">
              <TouchableOpacity 
                className="flex-1 bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10 active:bg-emerald-500/30"
                onPress={() => setModalVisible(true)}
              >
                <Text className="text-emerald-300 font-semibold mb-1">🏦 Caixinha</Text>
                <Text className="text-emerald-400 font-bold text-xl">
                  {formatBRL(summary.savings_amount)}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeGroup && summary && (
          <UpdateSavingsModal
            visible={modalVisible}
            groupId={activeGroup.id}
            currentAmount={summary.savings_amount}
            onClose={() => setModalVisible(false)}
            onSuccess={(newAmount) => {
              // Atualiza o valor localmente para refletir imediatamente sem precisar buscar do backend
              setSummary({
                ...summary,
                savings_amount: newAmount
              });
              setModalVisible(false);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}
