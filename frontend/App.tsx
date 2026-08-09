import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 bg-slate-900 items-center justify-center">
      <Text className="text-3xl font-bold text-white mb-2">
        Nosso Caixa 💰
      </Text>
      <Text className="text-emerald-400 font-semibold text-lg">
        Hello World com Tailwind v4!
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
