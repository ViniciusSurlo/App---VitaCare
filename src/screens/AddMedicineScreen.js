// src/screens/AddMedicineScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../utils/ThemeContext';
import { scheduleMedicationNotifications } from '../services/notificationService';

export default function AddMedicineScreen({ navigation, route }) {
  const { theme } = useTheme();

  const [nome, setNome] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [usoContinuo, setUsoContinuo] = useState(false);
  const [duracao, setDuracao] = useState('');
  const [horarios, setHorarios] = useState([]);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());

  useEffect(() => {
    if (route.params?.scannedText) {
      const text = route.params.scannedText;
      const nomeMatch = text.match(/([A-Za-zÀ-ú\s]+)\s(\d+)(mg|g|ml|mcg)/i);
      if (nomeMatch) {
        setNome(nomeMatch[1].trim());
        setDosagem(nomeMatch[2] + nomeMatch[3].trim());
      } else {
        setNome(text.trim());
      }
    }
  }, [route.params?.scannedText]);

  const handleAddHorario = () => setShowPicker(true);

  const onChangeTime = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedTime = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (!horarios.includes(formattedTime)) {
        setHorarios([...horarios, formattedTime]);
      }
    }
  };

  const handleRemoveHorario = (hora) => {
    setHorarios(horarios.filter((h) => h !== hora));
  };

  const handleSave = async () => {
    if (!nome || !dosagem || !quantidade) {
      Alert.alert('Atenção', 'Preencha nome, dosagem e quantidade.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    const { data, error } = await supabase.from('medicamentos').insert({
      nome,
      dosagem,
      quantidade: parseInt(quantidade),
      uso_continuo: usoContinuo,
      duracao_tratamento: usoContinuo ? null : parseInt(duracao),
      horarios,
      user_id: user.id,
    }).select();

    if (error) {
      Alert.alert('Erro ao salvar', error.message);
    } else {
      // Agenda as notificações para o medicamento recém-adicionado
      if (data && data.length > 0) {
        await scheduleMedicationNotifications(data[0]);
      }
      Alert.alert('✅ Sucesso', 'Medicamento adicionado!');
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.colors.cardBackground }]}
          >
            <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Adicionar Medicamento
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nome do medicamento
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.inputIcon}>💊</Text>
                </View>
                <TextInput
                  placeholder="Ex: Paracetamol"
                  placeholderTextColor={theme.colors.subText}
                  style={[styles.input, { color: theme.colors.text }]}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>
            </View>

            {/* Dosagem */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Dosagem</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.inputIcon}>📋</Text>
                </View>
                <TextInput
                  placeholder="Ex: 500mg"
                  placeholderTextColor={theme.colors.subText}
                  style={[styles.input, { color: theme.colors.text }]}
                  value={dosagem}
                  onChangeText={setDosagem}
                />
              </View>
            </View>

            {/* Quantidade */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Quantidade</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.inputIcon}>📦</Text>
                </View>
                <TextInput
                  placeholder="Ex: 30 comprimidos"
                  placeholderTextColor={theme.colors.subText}
                  style={[styles.input, { color: theme.colors.text }]}
                  keyboardType="numeric"
                  value={quantidade}
                  onChangeText={setQuantidade}
                />
              </View>
            </View>

            {/* Uso Contínuo */}
            <TouchableOpacity
              style={[
                styles.switchCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: usoContinuo ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setUsoContinuo(!usoContinuo)}
              activeOpacity={0.7}
            >
              <View style={styles.switchContent}>
                <View
                  style={[
                    styles.switchIconBg,
                    { backgroundColor: theme.colors.primary + '15' },
                  ]}
                >
                  <Text style={styles.switchIcon}>🔄</Text>
                </View>
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                    Uso contínuo
                  </Text>
                  <Text style={[styles.switchSubLabel, { color: theme.colors.subText }]}>
                    Medicamento de uso prolongado
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: usoContinuo
                      ? theme.colors.primary
                      : theme.colors.cardBackground,
                    borderColor: usoContinuo ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                {usoContinuo && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            {/* Duração do Tratamento */}
            {!usoContinuo && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Duração do tratamento (dias)
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.colors.cardBackground,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Text style={styles.inputIcon}>📅</Text>
                  </View>
                  <TextInput
                    placeholder="Ex: 7 dias"
                    placeholderTextColor={theme.colors.subText}
                    style={[styles.input, { color: theme.colors.text }]}
                    keyboardType="numeric"
                    value={duracao}
                    onChangeText={setDuracao}
                  />
                </View>
              </View>
            )}

            {/* Horários */}
            <View style={styles.horariosSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Horários de uso</Text>

              <TouchableOpacity
                style={[
                  styles.addHorarioButton,
                  {
                    backgroundColor: theme.colors.primary + '10',
                    borderColor: theme.colors.primary + '30',
                  },
                ]}
                onPress={handleAddHorario}
              >
                <View
                  style={[
                    styles.addHorarioIcon,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={styles.addHorarioIconText}>+</Text>
                </View>
                <Text style={[styles.addHorarioText, { color: theme.colors.primary }]}>
                  Adicionar horário
                </Text>
              </TouchableOpacity>

              {horarios.length > 0 ? (
                <View style={styles.horariosList}>
                  {horarios.map((hora, index) => (
                    <View
                      key={index}
                      style={[
                        styles.horarioChip,
                        {
                          backgroundColor: theme.colors.cardBackground,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.horarioChipIcon}>🕐</Text>
                      <Text style={[styles.horarioChipText, { color: theme.colors.text }]}>
                        {hora}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveHorario(hora)}
                        style={styles.removeChipButton}
                      >
                        <Text style={styles.removeChipIcon}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyHorarios,
                    { backgroundColor: theme.colors.cardBackground },
                  ]}
                >
                  <Text style={styles.emptyHorariosIcon}>🕐</Text>
                  <Text style={[styles.emptyHorariosText, { color: theme.colors.subText }]}>
                    Nenhum horário adicionado
                  </Text>
                </View>
              )}

              {showPicker && (
                <DateTimePicker
                  value={pickerTime}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={onChangeTime}
                />
              )}
            </View>
          </View>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                },
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Salvar Medicamento</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: {
    fontSize: 26,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
  iconBg: {
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
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  switchIcon: {
    fontSize: 24,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchSubLabel: {
    fontSize: 13,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  horariosSection: {
    marginBottom: 20,
  },
  addHorarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addHorarioIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addHorarioIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  addHorarioText: {
    fontSize: 16,
    fontWeight: '700',
  },
  horariosList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  horarioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  horarioChipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  horarioChipText: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  removeChipButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeChipIcon: {
    fontSize: 22,
    color: '#999',
    fontWeight: '300',
  },
  emptyHorarios: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyHorariosIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyHorariosText: {
    fontSize: 15,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  saveButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});