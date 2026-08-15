import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { FixedExpensesScreen } from '../screens/FixedExpensesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GroupsScreen } from '../screens/GroupsScreen';

const Tab = createBottomTabNavigator();

export function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a', // slate-900
          borderTopColor: '#334155', // slate-700
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#34d399', // emerald-400
        tabBarInactiveTintColor: '#94a3b8', // slate-400
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{
          tabBarIcon: () => null, // Opcional: Adicione ícones se desejar (ex: Ionicons)
          tabBarLabel: 'Resumo',
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: 'Transações',
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }
        }}
      />
      <Tab.Screen 
        name="FixedExpenses" 
        component={FixedExpensesScreen}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: 'Assinaturas',
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: 'Meu Perfil',
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: 'Grupos',
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }
        }}
      />
    </Tab.Navigator>
  );
}
