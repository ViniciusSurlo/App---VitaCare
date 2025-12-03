import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import * as Notifications from 'expo-notifications';
import App from './App';

// Configura o handler de notificações para funcionar em background/killed state
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Registra o componente principal
registerRootComponent(App);
