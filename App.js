// App.js - VERSÃO COMPATÍVEL COM SEU PROJETO
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabaseClient';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import * as notificationService from './src/services/notificationService';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditMedicineScreen from './src/screens/EditMedicineScreen';
import NotificationModal from './src/components/NotificationModal';

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack para Dashboard + telas relacionadas
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Adicionar" component={AddMedicineScreen} />
      <Stack.Screen name="EditMedicine" component={EditMedicineScreen} />
    </Stack.Navigator>
  );
}

// TabNavigator
function TabNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 60,
          backgroundColor: theme.colors.cardBackground,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Configurações') iconName = focused ? 'settings' : 'settings-outline';
          else if (route.name === 'Adicionar') iconName = focused ? 'add-circle' : 'add-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subText,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Adicionar" component={AddMedicineScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Configurações" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const [session, setSession] = useState(null);
  
  // Estados para o modal de notificação
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [medicamentosParaTomar, setMedicamentosParaTomar] = useState([]);

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

  // Configura os listeners de notificação
  useEffect(() => {
    notificationService.setNotificationModalCallback((medicamentos) => {
      setMedicamentosParaTomar(medicamentos);
      setNotificationModalVisible(true);
    });

    const notificationListener = notificationService.listenToNotifications();
    const responseListener = notificationService.listenToNotificationResponses();

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Handler: Usuário clicou em "Tomar"
  const handleTomar = async (medicamento) => {
    await notificationService.registerMedicationTaken(medicamento);
    
    const novosmed = medicamentosParaTomar.filter(med => med.id !== medicamento.id);
    
    if (novosmed.length === 0) {
      setNotificationModalVisible(false);
      setMedicamentosParaTomar([]);
    } else {
      setMedicamentosParaTomar(novosmed);
    }
  };

  // Handler: Usuário clicou em "Adiar"
  const handleAdiar = async (medicamento) => {
    await notificationService.snoozeNotification(medicamento);
    
    const novosmed = medicamentosParaTomar.filter(med => med.id !== medicamento.id);
    
    if (novosmed.length === 0) {
      setNotificationModalVisible(false);
      setMedicamentosParaTomar([]);
    } else {
      setMedicamentosParaTomar(novosmed);
    }
  };

  // Handler: Fechar modal
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
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session && session.user ? (
            <Stack.Screen name="MainApp" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>

      {/* Modal de Notificação - Sempre renderizado */}
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

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}