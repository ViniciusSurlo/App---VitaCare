// src/screens/SettingsScreen.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.colors.cardBackground }]}
        >
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.primary + '15',
                borderColor: theme.colors.primary + '30',
              },
            ]}
          >
            <Text style={styles.infoIcon}>💊</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>VitaCare</Text>
              <Text style={[styles.infoSubtitle, { color: theme.colors.text }]}>
                Seu gerenciador de medicamentos
              </Text>
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.subText }]}>APARÊNCIA</Text>

            <TouchableOpacity
              style={[
                styles.settingCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconBg,
                    { backgroundColor: theme.colors.primary + '15' },
                  ]}
                >
                  <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Modo Escuro
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.subText }]}>
                    {isDark ? 'Ativado' : 'Desativado'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggle,
                  {
                    backgroundColor: isDark ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: isDark ? 22 : 2 }],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.subText }]}>SOBRE</Text>

            <View
              style={[
                styles.aboutCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: theme.colors.subText }]}>Versão</Text>
                <Text style={[styles.aboutValue, { color: theme.colors.text }]}>1.0.0</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: theme.colors.subText }]}>
                  Desenvolvido por
                </Text>
                <Text style={[styles.aboutValue, { color: theme.colors.text }]}>VitaCare Team</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: theme.colors.subText }]}>Ano</Text>
                <Text style={[styles.aboutValue, { color: theme.colors.text }]}>2025</Text>
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                },
              ]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Voltar ao Dashboard</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footerText, { color: theme.colors.subText }]}>
            VitaCare © 2025
          </Text>
        </View>
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
  content: {
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  infoIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  actionButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 32,
    marginBottom: 40,
  },
});