// App.js - versão otimizada
import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './src/services/supabaseClient';
import * as notificationService from './src/services/notificationService';
import { addAlarmActionListener } from './src/services/fullScreenAlarmBridge'; // ADICIONADO: Bridge para o alarme fullscreen
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';

// Telas
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditMedicineScreen from './src/screens/EditMedicineScreen';
import NotificationModal from './src/components/NotificationModal';
import MedicamentosScreen from './src/screens/MedicamentosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// 📦 Stack interno do Dashboard
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Adicionar" component={AddMedicineScreen} />
      <Stack.Screen name="EditMedicine" component={EditMedicineScreen} />
      <Stack.Screen name="Medicamentos" component={MedicamentosScreen} />
    </Stack.Navigator>
  );
}


// 🧭 Navegação principal por abas (com safe area inferior garantida)
function TabNavigator() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.cardBackground,
            borderTopColor: theme.colors.border,
            height: Platform.OS === 'ios' ? 80 : 70,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10, // 🔒 evita sobreposição nos gestos
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Adicionar') iconName = focused ? 'add-circle' : 'add-circle-outline';
            else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
            else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.subText,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardStack} />
        <Tab.Screen name="Adicionar" component={AddMedicineScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      </SafeAreaView>
  );
}


// 🌙 Conteúdo principal (controla sessão e modal)
function AppContent() {
  const { theme } = useTheme();
  const [session, setSession] = useState(null);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [medicamentosParaTomar, setMedicamentosParaTomar] = useState([]);

  // 🔐 Controle de sessão do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  // 🔔 Notificações
  useEffect(() => {
    notificationService.setNotificationModalCallback((medicamentos) => {
      setMedicamentosParaTomar(medicamentos);
      setNotificationModalVisible(true);
    });

    const notificationListener = notificationService.listenToNotifications();
    const responseListener = notificationService.listenToNotificationResponses();
    
    // ADICIONADO: Listener para as ações do alarme fullscreen (Android)
    const alarmActionListener = addAlarmActionListener(async (payload) => {
      console.log('🚨 Ação do Alarme FullScreen recebida:', payload);
      const { action, medicamento } = payload;
      
      // O medicamento vem como um objeto simples, precisa ser mapeado para o formato esperado
      const med = {
        id: medicamento.medicamentoId,
        nome: medicamento.nome,
        dosagem: medicamento.dosagem,
        horario: medicamento.horario,
        userId: medicamento.userId,
      };

      if (action === 'tomar') {
        await notificationService.registerMedicationTaken(med);
        // Opcional: Cancelar notificações pendentes relacionadas
        // Como a Activity fecha, a notificação de sistema deve ser dispensada automaticamente.
      } else if (action === 'adiar') {
        await notificationService.snoozeNotification(med);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
      alarmActionListener.remove(); // Limpa o listener do alarme
    };
  }, []);

  // Handlers
  const handleTomar = async (medicamento) => {
    await notificationService.registerMedicationTaken(medicamento);
    const novos = medicamentosParaTomar.filter(med => med.id !== medicamento.id);
    if (novos.length === 0) {
      setNotificationModalVisible(false);
      setMedicamentosParaTomar([]);
    } else setMedicamentosParaTomar(novos);
  };

  const handleAdiar = async (medicamento) => {
    await notificationService.snoozeNotification(medicamento);
    const novos = medicamentosParaTomar.filter(med => med.id !== medicamento.id);
    if (novos.length === 0) {
      setNotificationModalVisible(false);
      setMedicamentosParaTomar([]);
    } else setMedicamentosParaTomar(novos);
  };

  const handleCloseModal = () => {
    setNotificationModalVisible(false);
    setMedicamentosParaTomar([]);
  };

  return (
    <>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session && session.user ? (
              <Stack.Screen name="MainApp" component={TabNavigator} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>

      {/* Modal de Notificação */}
      <NotificationModal
        visible={notificationModalVisible}
        medicamentos={medicamentosParaTomar}
        onTomar={handleTomar}
        onAdiar={handleAdiar}
        onClose={handleCloseModal}
      />
    </>
  );
}


// 🌍 App principal
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
