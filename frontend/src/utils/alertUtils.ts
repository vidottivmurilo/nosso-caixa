import { Alert, Platform } from 'react-native';

/**
 * Exibe um alerta simples (informativo) que funciona tanto na Web quanto no celular.
 * Na Web, usa window.alert(). No celular, usa Alert.alert().
 */
export function crossAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Exibe um diálogo de confirmação (Sim/Não) que funciona tanto na Web quanto no celular.
 * Na Web, usa window.confirm(). No celular, usa Alert.alert() com botões.
 * Retorna true se o usuário confirmou, false se cancelou.
 */
export function crossConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Confirmar', onPress: () => resolve(true) },
      ]);
    }
  });
}
