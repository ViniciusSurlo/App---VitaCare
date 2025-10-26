// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../utils/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient'; // npm install expo-linear-gradient

export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });

    if (error) {
      Alert.alert('Erro no cadastro', error.message);
    } else {
      Alert.alert('✅ Sucesso', 'Conta criada com sucesso!');
      setIsLogin(true);
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Gradiente */}
        <View style={styles.headerSection}>
          <View style={[styles.logoContainer, { 
            backgroundColor: theme.colors.primary + '15',
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 8
          }]}>
            <Text style={styles.logoIcon}>💊</Text>
          </View>
          
          <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
            {isLogin ? 'Olá, bem-vindo!' : 'Criar conta'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            {isLogin ? 'Entre para gerenciar seus medicamentos' : 'Cadastre-se no VitaCare'}
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>E-mail</Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border
            }]}>
              <View style={[styles.inputIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
                <Text style={styles.inputIcon}>📧</Text>
              </View>
              <TextInput
                placeholder="seu@email.com"
                placeholderTextColor={theme.colors.subText}
                style={[styles.input, { color: theme.colors.text }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Senha</Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border
            }]}>
              <View style={[styles.inputIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
                <Text style={styles.inputIcon}>🔒</Text>
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.colors.subText}
                style={[styles.input, { color: theme.colors.text }]}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
              />
            </View>
          </View>

          {/* Botões */}
          <TouchableOpacity
            style={[styles.primaryButton, { 
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary
            }]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.subText }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { 
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border
            }]}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              {isLogin ? 'Criar nova conta' : 'Já tenho conta'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footerText, { color: theme.colors.subText }]}>
          VitaCare © 2025
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 50,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputIcon: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 24,
    marginBottom: 20,
  },
});