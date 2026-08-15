import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useGroupStore } from '../store/groupStore';
import { fetchUserGroups, type Group } from '../services/dashboardService';
import { sendInvite } from '../services/groupService';
import { NewGroupModal } from '../components/NewGroupModal';
import { crossAlert, crossConfirm } from '../utils/alertUtils';

export function GroupsScreen() {
  const { activeGroup, setActiveGroup, userGroups, setUserGroups } = useGroupStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);

  // Estado para o convite (só aparece se o usuário for OWNER do grupo ativo)
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoading(true);
      setError(null);
      const groups = await fetchUserGroups();
      setUserGroups(groups);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar seus grupos.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const groups = await fetchUserGroups();
      setUserGroups(groups);
    } finally {
      setRefreshing(false);
    }
  }, [setUserGroups]);

  async function handleSwitchGroup(group: Group) {
    if (activeGroup?.id === group.id) return;

    const confirmed = await crossConfirm(
      'Mudar Grupo',
      `Deseja mudar para o grupo "${group.name}"?`
    );

    if (confirmed) {
      await setActiveGroup(group);
      crossAlert('Sucesso', 'Grupo alterado. Os dados foram atualizados.');
    }
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !activeGroup) return;
    
    if (!inviteEmail.includes('@')) {
      crossAlert('Atenção', 'E-mail inválido.');
      return;
    }

    try {
      setIsSending(true);
      await sendInvite(activeGroup.id, inviteEmail.trim());
      crossAlert('Sucesso', 'Convite enviado com sucesso!');
      setInviteEmail('');
    } catch (err: any) {
      crossAlert('Erro', err.response?.data?.error || 'Não foi possível enviar o convite.');
    } finally {
      setIsSending(false);
    }
  }

  // Verifica se o usuário é OWNER do grupo ativo
  const isOwnerOfActiveGroup = activeGroup?.my_role === 'OWNER';

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="bg-slate-800 pt-14 pb-6 px-6 border-b border-slate-700">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-white mb-1">Meus Grupos</Text>
            <Text className="text-slate-400 text-sm">Organize e gerencie seus espaços.</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="mt-6 bg-emerald-500 py-3 rounded-xl items-center flex-row justify-center"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white font-bold text-base ml-2">+ Criar Novo Grupo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center text-base mb-4">{error}</Text>
          <TouchableOpacity className="bg-emerald-500 px-6 py-2 rounded-lg" onPress={loadGroups}>
            <Text className="text-white font-bold">Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={userGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          ListHeaderComponent={
            // Seção de Convidar — só aparece se o grupo ativo existir E o usuário for OWNER
            isOwnerOfActiveGroup ? (
              <View className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6 shadow-lg shadow-black/50">
                <Text className="text-lg font-bold text-white mb-2">Convidar Parceiro(a)</Text>
                <Text className="text-slate-400 text-sm mb-4">
                  Envie um convite para o e-mail de quem vai dividir o grupo "{activeGroup?.name}" com você.
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
            ) : null
          }
          renderItem={({ item }) => {
            const isActive = activeGroup?.id === item.id;
            
            return (
              <View className={`bg-slate-800 p-5 rounded-2xl mb-4 border ${isActive ? 'border-emerald-500' : 'border-slate-700'}`}>
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-white mb-1">{item.name}</Text>
                    <Text className="text-slate-400 text-xs uppercase font-semibold">
                      Papel: {item.my_role === 'OWNER' ? 'Dono' : 'Membro'}
                    </Text>
                  </View>
                  {isActive && (
                    <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      <Text className="text-emerald-400 text-xs font-bold">Atual</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  className={`py-3 rounded-xl items-center ${isActive ? 'bg-slate-700 opacity-50' : 'bg-slate-700 active:bg-slate-600'}`}
                  onPress={() => handleSwitchGroup(item)}
                  disabled={isActive}
                >
                  <Text className={isActive ? "text-slate-400 font-semibold" : "text-white font-bold"}>
                    {isActive ? 'Selecionado' : 'Usar este grupo'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-5xl mb-4">📂</Text>
              <Text className="text-slate-400 text-center">Nenhum grupo encontrado.</Text>
            </View>
          }
        />
      )}

      {/* Modal Novo Grupo */}
      <NewGroupModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={async () => {
          setModalVisible(false);
          // Recarrega a lista do servidor para ter os dados completos (inclusive my_role)
          try {
            const freshGroups = await fetchUserGroups();
            setUserGroups(freshGroups);
          } catch (e) {
            // silencioso
          }
        }}
      />
    </View>
  );
}
