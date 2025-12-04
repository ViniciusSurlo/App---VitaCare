import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';
import App from './App';

// ========================================
// CONFIGURAÇÃO GLOBAL DE NOTIFICAÇÕES
// ========================================
// Handler que funciona em foreground, background e killed state
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Sempre mostra a notificação, mesmo em foreground
    // Os botões de ação funcionarão através do listener de resposta
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// ========================================
// REGISTRO DO APP
// ========================================
registerRootComponent(App);
