// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabaseClient';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
// Importa as funções de notificação
import { requestNotificationPermissions, listenToNotifications } from './src/services/notificationService';

// Telas principais
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditMedicineScreen from './src/screens/EditMedicineScreen'; // Assumindo que esta tela existe ou será criada

const Stack = createNativeStackNavigator();

function AppContent() {
  const [session, setSession] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Solicita permissões de notificação e configura o listener ao iniciar o app
    requestNotificationPermissions();
    listenToNotifications();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription?.unsubscribe();
      // TODO: Considerar cancelar listeners de notificação se o componente for desmontado
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {session && session.user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AddMedicine" component={AddMedicineScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditMedicine" component={EditMedicineScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}