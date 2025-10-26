// src/utils/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './theme';

export const ThemeContext = createContext();


export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme === 'dark' ? darkTheme : lightTheme);
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('userTheme');
        if (storedTheme !== null) {
          if (storedTheme === 'dark') {
            setTheme(darkTheme);
            setIsDark(true);
          } else {
            setTheme(lightTheme);
            setIsDark(false);
          }
        } else {
          // Se não houver tema salvo, usa o tema do sistema
          setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme from AsyncStorage', error);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    try {
      await AsyncStorage.setItem('userTheme', newTheme);
      setTheme(newTheme === 'dark' ? darkTheme : lightTheme);
      setIsDark(!isDark);
    } catch (error) {
      console.error('Failed to save theme to AsyncStorage', error);
    }
  };

  const getTheme = () => isDark ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, getTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);