import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { crossAlert } from '../utils/alertUtils';
import { createGroup } from '../services/groupService';

interface NewGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newGroupId?: string) => void;
}

export function NewGroupModal({ visible, onClose, onSuccess }: NewGroupModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      crossAlert('Atenção', 'Digite um nome para o grupo.');
      return;
    }

    try {
      setLoading(true);
      const newGroup = await createGroup(name.trim());
      setName('');
      onSuccess(newGroup.id);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao criar grupo.';
      crossAlert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center px-6">
        <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <Text className="text-xl font-bold text-white mb-2">Novo Grupo</Text>
          <Text className="text-slate-400 text-sm mb-6">
            Crie um novo espaço para organizar suas finanças (ex: Pessoal, Viagem, República).
          </Text>

          <View className="mb-6">
            <Text className="text-slate-300 font-semibold mb-2">Nome do Grupo</Text>
            <TextInput
              className="bg-slate-900 border border-slate-700 text-white p-4 rounded-xl text-base"
              placeholder="Ex: Minhas Contas"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 items-center justify-center rounded-xl bg-slate-700"
              onPress={() => {
                setName('');
                onClose();
              }}
              disabled={loading}
            >
              <Text className="text-slate-300 font-semibold">Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 items-center justify-center rounded-xl bg-emerald-500"
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold">Criar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
