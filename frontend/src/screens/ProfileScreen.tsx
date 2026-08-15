import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { crossAlert } from '../utils/alertUtils';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import {
  fetchPendingInvites,
  acceptInvite,
  declineInvite,
  type PendingInviteResponse,
} from '../services/groupService';
import { fetchUserGroups } from '../services/dashboardService';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { activeGroup, setActiveGroup, setUserGroups } = useGroupStore();
  const [invites, setInvites] = useState<PendingInviteResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const pendingInvites = await fetchPendingInvites();
      setInvites(pendingInvites);
    } catch (err) {
      crossAlert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const pendingInvites = await fetchPendingInvites();
      setInvites(pendingInvites);
    } catch (err) {}
    setRefreshing(false);
  }, []);

  async function handleAccept(invite: PendingInviteResponse) {
    try {
      await acceptInvite(invite.group.id);
      crossAlert('Sucesso', 'Você agora faz parte do grupo!');
      // Remove o convite da lista local
      setInvites(prev => prev.filter(inv => inv.id !== invite.id));
      // Recarrega os grupos, pois agora ele faz parte de um novo
      const groups = await fetchUserGroups();
      setUserGroups(groups);
      // Se não tinha grupo ativo, seta o novo
      if (!activeGroup && groups.length > 0) {
        await setActiveGroup(groups[0]);
      }
    } catch (err) {
      crossAlert('Erro', 'Não foi possível aceitar o convite.');
    }
  }

  async function handleDecline(invite: PendingInviteResponse) {
    try {
      await declineInvite(invite.group.id);
      setInvites(prev => prev.filter(inv => inv.id !== invite.id));
    } catch (err) {
      crossAlert('Erro', 'Não foi possível recusar o convite.');
    }
  }

  return (
    <ScrollView 
      className="flex-1 bg-slate-900" 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* Header do Perfil */}
      <View className="bg-slate-800 pt-16 pb-8 px-6 border-b border-slate-700 items-center">
        <View className="w-20 h-20 bg-emerald-500/20 rounded-full items-center justify-center border-2 border-emerald-500 mb-4">
          <Text className="text-3xl">👤</Text>
        </View>
        <Text className="text-2xl font-bold text-white mb-1">{user?.name}</Text>
        <Text className="text-slate-400">{user?.email}</Text>
        
        {activeGroup && (
          <View className="mt-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
            <Text className="text-slate-300 text-sm">
              📂 Grupo ativo: <Text className="text-emerald-400 font-bold">{activeGroup.name}</Text>
            </Text>
          </View>
        )}
      </View>

      <View className="p-6">
        {/* Sessão: Convites Pendentes */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-white mb-4">Convites Recebidos</Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator color="#10b981" />
          ) : invites.length === 0 ? (
            <View className="bg-slate-800/50 p-6 rounded-xl border border-dashed border-slate-600 items-center">
              <Text className="text-slate-400">Você não possui convites pendentes.</Text>
            </View>
          ) : (
            invites.map(invite => (
              <View key={invite.id} className="bg-slate-800 p-4 rounded-xl border border-emerald-500/30 mb-3 flex-row items-center justify-between shadow-lg shadow-emerald-500/10">
                <View className="flex-1 mr-4">
                  <Text className="text-white font-bold mb-1">Grupo: {invite.group.name}</Text>
                  <Text className="text-slate-400 text-xs">Você foi convidado para dividir as finanças.</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity 
                    className="w-10 h-10 bg-slate-700 rounded-lg items-center justify-center"
                    onPress={() => handleDecline(invite)}
                  >
                    <Text className="text-white font-bold">✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="w-10 h-10 bg-emerald-500 rounded-lg items-center justify-center"
                    onPress={() => handleAccept(invite)}
                  >
                    <Text className="text-white font-bold">✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity 
          className="bg-red-500/10 py-4 rounded-xl items-center border border-red-500/30 mt-4"
          onPress={logout}
        >
          <Text className="text-red-400 font-bold text-base">Sair da Conta (Logout)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
