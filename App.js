// App.js
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabaseClient';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';

import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen'
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditMedicineScreen from './src/screens/EditMedicineScreen';

import { Ionicons } from '@expo/vector-icons'; // ícones para o menu, pode trocar

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack para Dashboard + telas relacionadas
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Adicionar" component={AddMedicineScreen} />
      <Stack.Screen name="EditMedicine" component={EditMedicineScreen} />
    </Stack.Navigator>
  );
}

// TabNavigator separado
// TabNavigator separado
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

  return (
    <>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
	      <NavigationContainer>
	        <Stack.Navigator screenOptions={{ headerShown: false }}>
	          {session && session.user ? (
	            <Stack.Screen name="MainApp" component={TabNavigator} />
	          ) : (
	            <Stack.Screen name="Login" component={LoginScreen} />
	          )}
	        </Stack.Navigator>
	      </NavigationContainer>
    </>
  );
}


export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
