// src/components/NotificationModal.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../utils/ThemeContext';

const { height } = Dimensions.get('window');

export default function NotificationModal({ 
  visible, 
  medicamentos = [], 
  onTomar, 
  onAdiar, 
  onClose 
}) {
  const { theme } = useTheme();

  if (!visible || medicamentos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconBell}>🔔</Text>
            </View>
            <Text style={styles.headerTitle}>Hora do Medicamento!</Text>
            <Text style={styles.headerSubtitle}>
              {medicamentos.length === 1 
                ? '1 medicamento para tomar' 
                : `${medicamentos.length} medicamentos para tomar`}
            </Text>
          </View>

          {/* Lista de Medicamentos */}
          <ScrollView 
            style={styles.medicamentosContainer}
            showsVerticalScrollIndicator={false}
          >
            {medicamentos.map((med, index) => (
              <View 
                key={`${med.id}-${index}`}
                style={[
                  styles.medicamentoCard,
                  { 
                    backgroundColor: theme.colors.cardBackground,
                    borderColor: theme.colors.border,
                  }
                ]}
              >
                {/* Ícone do remédio */}
                <View style={[styles.pillIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.pillEmoji}>💊</Text>
                </View>

                {/* Info do Medicamento */}
                <View style={styles.medicamentoInfo}>
                  <Text style={[styles.medicamentoNome, { color: theme.colors.text }]}>
                    {med.nome}
                  </Text>
                  <Text style={[styles.medicamentoDosagem, { color: theme.colors.subText }]}>
                    {med.dosagem || 'Dosagem não informada'}
                  </Text>
                  <View style={styles.horarioContainer}>
                    <Text style={styles.horarioIcon}>🕐</Text>
                    <Text style={[styles.horarioText, { color: theme.colors.subText }]}>
                      {med.horario}
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.btnAdiar, { 
                      backgroundColor: theme.colors.cardBackground,
                      borderColor: theme.colors.border,
                    }]}
                    onPress={() => onAdiar(med)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.btnAdiarText, { color: theme.colors.subText }]}>
                      ⏰ Adiar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnTomar, { backgroundColor: theme.colors.success }]}
                    onPress={() => onTomar(med)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnTomarText}>✓ Tomar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Botão Fechar (caso queira dispensar todos) */}
          <TouchableOpacity
            style={[styles.btnFechar, { 
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border,
            }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnFecharText, { color: theme.colors.subText }]}>
              Dispensar Todos
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '90%',
    maxHeight: height * 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBell: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  medicamentosContainer: {
    maxHeight: height * 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  medicamentoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pillIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillEmoji: {
    fontSize: 28,
  },
  medicamentoInfo: {
    marginBottom: 16,
  },
  medicamentoNome: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  medicamentoDosagem: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  horarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horarioIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  horarioText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  btnAdiar: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  btnAdiarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  btnTomar: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnTomarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  btnFechar: {
    margin: 16,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  btnFecharText: {
    fontSize: 16,
    fontWeight: '600',
  },
});