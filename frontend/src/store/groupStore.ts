import { create } from 'zustand';
import { Group } from '../services/dashboardService';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface GroupState {
  activeGroup: Group | null;
  userGroups: Group[];
  setActiveGroup: (group: Group | null) => Promise<void>;
  setUserGroups: (groups: Group[]) => void;
  // Apenas guardamos o ID persistido para usar quando a lista de grupos for carregada
  persistedGroupId: string | null;
  loadPersistedGroupId: () => Promise<void>;
}

const setItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const useGroupStore = create<GroupState>((set) => ({
  activeGroup: null,
  userGroups: [],
  persistedGroupId: null,
  
  setActiveGroup: async (group) => {
    if (group) {
      await setItem('active_group_id', group.id);
    } else {
      if (Platform.OS === 'web') localStorage.removeItem('active_group_id');
      else await SecureStore.deleteItemAsync('active_group_id');
    }
    set({ activeGroup: group });
  },

  setUserGroups: (groups) => {
    set({ userGroups: groups });
  },

  loadPersistedGroupId: async () => {
    try {
      const storedId = await getItem('active_group_id');
      if (storedId) {
        set({ persistedGroupId: storedId });
      }
    } catch (e) {
      console.error('Failed to load persisted group ID', e);
    }
  }
}));
