import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { fetchUserGroups, type Group } from '../services/dashboardService';
import {
  fetchPendingInvites,
  acceptInvite,
  declineInvite,
  sendInvite,
  type PendingInviteResponse,
} from '../services/groupService';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [invites, setInvites] = useState<PendingInviteResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const groups = await fetchUserGroups();
      if (groups.length > 0) {
        setActiveGroup(groups[0]);
      }
      
      const pendingInvites = await fetchPendingInvites();
      setInvites(pendingInvites);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const groups = await fetchUserGroups();
      if (groups.length > 0) setActiveGroup(groups[0]);
      
      const pendingInvites = await fetchPendingInvites();
      setInvites(pendingInvites);
    } catch (err) {}
    setRefreshing(false);
  }, []);

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !activeGroup) return;
    
    // Basic email validation
    if (!inviteEmail.includes('@')) {
      Alert.alert('Atenção', 'E-mail inválido.');
      return;
    }

    try {
      setIsSending(true);
      await sendInvite(activeGroup.id, inviteEmail.trim());
      Alert.alert('Sucesso', 'Convite enviado com sucesso!');
      setInviteEmail('');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível enviar o convite.');
    } finally {
      setIsSending(false);
    }
  }

  async function handleAccept(inviteId: string) {
    try {
      await acceptInvite(inviteId);
      Alert.alert('Sucesso', 'Você agora faz parte do grupo!');
      // Atualiza a lista removendo o convite aceito
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      // Recarrega os grupos, pois agora ele faz parte de um novo
      const groups = await fetchUserGroups();
      if (groups.length > 0) setActiveGroup(groups[0]);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível aceitar o convite.');
    }
  }

  async function handleDecline(inviteId: string) {
    try {
      await declineInvite(inviteId);
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível recusar o convite.');
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
      </View>

      <View className="p-6">
        {/* Sessão: Convidar Parceiro(a) */}
        <View className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6 shadow-lg shadow-black/50">
          <Text className="text-lg font-bold text-white mb-2">Convidar Parceiro(a)</Text>
          <Text className="text-slate-400 text-sm mb-4">
            Envie um convite para o e-mail de quem vai dividir o grupo "{activeGroup?.name || 'Seu Grupo'}" com você.
          </Text>
          
          <View className="flex-row items-center gap-3">
            <TextInput
              className="flex-1 bg-slate-900 text-white p-4 rounded-xl border border-slate-700"
              placeholder="email@exemplo.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <TouchableOpacity 
              className={`w-14 h-14 rounded-xl items-center justify-center ${!inviteEmail.trim() ? 'bg-slate-700' : 'bg-emerald-500 shadow-lg shadow-emerald-500/30'}`}
              disabled={!inviteEmail.trim() || isSending}
              onPress={handleSendInvite}
            >
              {isSending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-xl">↗</Text>}
            </TouchableOpacity>
          </View>
        </View>

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
                    onPress={() => handleDecline(invite.id)}
                  >
                    <Text className="text-white font-bold">✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="w-10 h-10 bg-emerald-500 rounded-lg items-center justify-center"
                    onPress={() => handleAccept(invite.id)}
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
