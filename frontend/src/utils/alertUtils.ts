import { Alert, Platform } from 'react-native';

/**
 * Exibe um alerta simples (informativo) que funciona tanto na Web quanto no celular.
 * Aceita botões customizados (no celular) para navegação automática.
 */
export function crossAlert(title: string, message: string, buttons?: any[]) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    
    // Simula o clique no botão principal caso exista para que a navegação funcione na Web também
    if (buttons && buttons.length > 0) {
      const mainButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
      if (mainButton && mainButton.onPress) {
        mainButton.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
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
