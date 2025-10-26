// src/screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { cancelMedicationNotifications } from '../services/notificationService';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [medicamentos, setMedicamentos] = useState([]);
  const [historicoUso, setHistoricoUso] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (isFocused) {
      fetchData();
      updateGreeting();
    }
  }, [isFocused]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia!');
    else if (hour < 18) setGreeting('Boa tarde!');
    else setGreeting('Boa noite!');
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const name = user.email?.split('@')[0] || 'Usuário';
    setUserName(name.charAt(0).toUpperCase() + name.slice(1));

    const { data: meds, error: medsError } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!medsError) setMedicamentos(meds || []);

    const { data: uso, error: usoError } = await supabase
      .from('uso_medicamento')
      .select(`
        id,
        data_uso,
        medicamento_id,
        medicamentos:medicamento_id(nome)
      `)
      .eq('user_id', user.id)
      .order('data_uso', { ascending: false})
      .limit(5);

    if (!usoError) {
      const historicoFormatado = uso.map(item => ({
        id: item.id,
        nome: item.medicamentos?.nome || 'Medicamento',
        dataHora: new Date(item.data_uso).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      setHistoricoUso(historicoFormatado);
    }

    setLoading(false);
  };

  const handleTakeMedicine = async (medicamento) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('uso_medicamento').insert({
      medicamento_id: medicamento.id,
      user_id: user.id,
      quantidade_usada: 1
    });

    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      Alert.alert('✅ Registrado', `${medicamento.nome} foi marcado como tomado.`);
      fetchData();
    }
  };

  const handleDelete = async (medicamento) => {
    Alert.alert(
      'Excluir medicamento', 
      `Deseja realmente excluir "${medicamento.nome}"? Todas as notificações agendadas serão canceladas.`, 
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('medicamentos').delete().eq('id', medicamento.id);
            if (!error) {
              await cancelMedicationNotifications(medicamento.id);
              fetchData();
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingText, { color: theme.colors.subText }]}>{greeting}</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{userName}</Text>
          </View>
          
          <TouchableOpacity style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, { 
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.primary
        }]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{medicamentos.length}</Text>
            <Text style={styles.statLabel}>Medicamentos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{historicoUso.length}</Text>
            <Text style={styles.statLabel}>Registros Hoje</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.success }]}
            onPress={() => navigation.navigate('AddMedicine')}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionIconText}>+</Text>
            </View>
            <Text style={styles.quickActionText}>Adicionar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionIconText}>⚙️</Text>
            </View>
            <Text style={styles.quickActionText}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.danger }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionIconText}>🚪</Text>
            </View>
            <Text style={styles.quickActionText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Medicamentos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Meus Medicamentos</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionLink, { color: theme.colors.primary }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {medicamentos.length > 0 ? (
            medicamentos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.medicineCard, { 
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border
                }]}
                onPress={() => navigation.navigate('EditMedicine', { medicine: item })}
                activeOpacity={0.7}
              >
                <View style={styles.medicineCardContent}>
                  <View style={[styles.medicineIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Text style={styles.medicineIcon}>💊</Text>
                  </View>
                  
                  <View style={styles.medicineInfo}>
                    <Text style={[styles.medicineName, { color: theme.colors.text }]}>{item.nome}</Text>
                    <Text style={[styles.medicineDosage, { color: theme.colors.subText }]}>
                      {item.dosagem || 'Sem dosagem'}
                    </Text>
                    {item.horarios && item.horarios.length > 0 && (
                      <Text style={[styles.medicineSchedule, { color: theme.colors.primary }]}>
                        🕐 {item.horarios.join(' • ')}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.medicineActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
                    onPress={() => handleTakeMedicine(item)}
                  >
                    <Text style={styles.actionBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.danger + '20' }]}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.actionBtnIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={[styles.emptyText, { color: theme.colors.subText }]}>
                Nenhum medicamento cadastrado
              </Text>
            </View>
          )}
        </View>

        {/* Histórico */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Histórico Recente</Text>
          
          {historicoUso.length > 0 ? (
            historicoUso.map((item) => (
              <View
                key={item.id}
                style={[styles.historyCard, { 
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border
                }]}
              >
                <View style={[styles.historyIconBg, { backgroundColor: theme.colors.success + '20' }]}>
                  <Text style={styles.historyIcon}>✓</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: theme.colors.text }]}>{item.nome}</Text>
                  <Text style={[styles.historyTime, { color: theme.colors.subText }]}>{item.dataHora}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: theme.colors.subText }]}>
                Nenhum registro ainda
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#fff',
    opacity: 0.3,
    marginHorizontal: 24,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  medicineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medicineCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicineIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  medicineIcon: {
    fontSize: 28,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 14,
    marginBottom: 4,
  },
  medicineSchedule: {
    fontSize: 13,
    fontWeight: '600',
  },
  medicineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  actionBtnIcon: {
    fontSize: 20,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 13,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});