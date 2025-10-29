// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../utils/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [medicamentosCount, setMedicamentosCount] = useState(0);
  const [registrosCount, setRegistrosCount] = useState(0);

  useEffect(() => {
    getUserAndProfile();
  }, []);

  async function getUserAndProfile() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError;
      setUser(user);
      setUserEmail(user.email || '');

      const { data: usuarios, error: profileError } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      if (usuarios && usuarios.length > 0) {
        const usuario = usuarios[0];
        setProfile(usuario);
        setUserName(usuario.nome);
        setNewUserName(usuario.nome);
      } else {
        const fallbackNome = user.email?.split('@')[0] || 'Usuário';
        const { data: novoUsuario, error: insertError } = await supabase
          .from('usuarios')
          .insert([{ user_id: user.id, nome: fallbackNome, email: user.email }])
          .select()
          .maybeSingle();

        if (insertError) throw insertError;
        setProfile(novoUsuario);
        setUserName(novoUsuario.nome);
        setNewUserName(novoUsuario.nome);
      }

      // Buscar estatísticas
      const { data: meds } = await supabase
        .from('medicamentos')
        .select('id')
        .eq('user_id', user.id);
      setMedicamentosCount(meds?.length || 0);

      const { data: uso } = await supabase
        .from('uso_medicamento')
        .select('id')
        .eq('user_id', user.id);
      setRegistrosCount(uso?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error.message);
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário.');
    }
  }

  async function handleUpdateName() {
    if (!newUserName || newUserName === userName || !profile) {
      setIsEditing(false);
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ nome: newUserName })
      .eq('id', profile.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o nome: ' + error.message);
    } else {
      setUserName(newUserName);
      setProfile({ ...profile, nome: newUserName });
      setIsEditing(false);
      Alert.alert('✅ Sucesso', 'Nome atualizado!');
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Erro', error.message);
          },
        },
      ]
    );
  }

  if (!user || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.subText }]}>
            Carregando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Perfil</Text>
        </View>

        {/* Avatar e Info */}
        <View style={styles.profileSection}>
          <View style={[styles.avatarLarge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarLargeText}>{userName.charAt(0)}</Text>
          </View>

          {isEditing ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={[
                  styles.profileNameInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.cardBackground,
                  },
                ]}
                value={newUserName}
                onChangeText={setNewUserName}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleUpdateName}
                style={[styles.saveButton, { backgroundColor: theme.colors.success }]}
              >
                <Text style={styles.saveButtonText}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.nameDisplay}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>{userName}</Text>
              <Text style={[styles.editIcon, { color: theme.colors.primary }]}>✎</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.profileEmail, { color: theme.colors.subText }]}>{userEmail}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={[styles.statIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={styles.statIcon}>💊</Text>
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {medicamentosCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.subText }]}>
              Medicamentos
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={[styles.statIconBg, { backgroundColor: theme.colors.success + '15' }]}>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {registrosCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.subText }]}>
              Registros
            </Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.subText }]}>CONTA</Text>

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={styles.menuIcon}>⚙️</Text>
              </View>
              <Text style={[styles.menuLabel, { color: theme.colors.text }]}>
                Configurações
              </Text>
            </View>
            <Text style={[styles.menuArrow, { color: theme.colors.subText }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Text style={styles.menuIcon}>📊</Text>
              </View>
              <Text style={[styles.menuLabel, { color: theme.colors.text }]}>
                Dashboard
              </Text>
            </View>
            <Text style={[styles.menuArrow, { color: theme.colors.subText }]}>›</Text>
          </TouchableOpacity>
        </View>

      {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: theme.colors.danger + '0' }]}>
                <Text style={[styles.menuIcon, { color: theme.colors.danger }]}>➜</Text>
              </View>
              <Text style={[styles.dangerLabel, { color: theme.colors.danger }]}>
                Sair da conta
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarLargeText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  profileNameInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    padding: 10,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 200,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  editIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  saveButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 28,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 32,
    fontWeight: '300',
  },
  dangerSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
});