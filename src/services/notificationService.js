// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { Alert, Platform, AppState } from 'react-native';
import { supabase } from './supabaseClient';

// ========================================
// CONFIGURAÇÃO GLOBAL DE NOTIFICAÇÕES
// ========================================
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Se o app estiver em foreground, o modal é aberto automaticamente
    // Se estiver em background/quit, a notificação padrão com botões é exibida
    return {
      shouldShowAlert: true, // Sempre mostra a notificação
      shouldPlaySound: true, // Sempre toca o som
      shouldSetBadge: true,
    };
  },
});

// Configuração do canal de notificação estilo mensagem
// Este canal deve ser criado antes de agendar a primeira notificação
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-channel', {
      name: 'Lembretes de Medicamento',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

// ========================================
// VARIÁVEL GLOBAL PARA ARMAZENAR O CALLBACK DO MODAL
// ========================================
let notificationModalCallback = null;

/**
 * Define o callback que será chamado quando uma notificação precisar ser exibida
 * Este callback deve abrir o NotificationModal
 */
export function setNotificationModalCallback(callback) {
  notificationModalCallback = callback;
}

// ========================================
// PERMISSÕES
// ========================================
/**
 * Solicita permissões de notificação ao usuário (incluindo Android 13+).
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permissão de Notificação Necessária',
        'Ative as permissões de notificação nas configurações do app para receber lembretes de medicamentos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => {
            if (Platform.OS === 'android') {
              // No Android, o usuário precisa ir manualmente às configurações
              // ou usar Linking.openSettings() se tiver a permissão
            }
          }},
        ]
      );
      return false;
    }

    // Verifica permissões específicas do Android 13+
    if (Platform.OS === 'android') {
      const androidPermissions = await Notifications.getPermissionsAsync();
      // As permissões USE_FULL_SCREEN_INTENT e SCHEDULE_EXACT_ALARM
      // são declaradas no AndroidManifest e não precisam de solicitação em runtime
      // exceto SCHEDULE_EXACT_ALARM que pode precisar de solicitação no Android 12+
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao solicitar permissões:', error);
    return false;
  }
}

// ========================================
// AGENDAMENTO DE NOTIFICAÇÕES
// ========================================
/**
 * Agenda notificações de acordo com o tipo de uso do medicamento.
 * Notificações agora incluem dados completos do medicamento para exibição no modal.
 */
export async function scheduleMedicationNotifications(medicamento) {
  const permissionsGranted = await requestNotificationPermissions();
  if (!permissionsGranted) return;

  // Cancela notificações anteriores deste medicamento
  await cancelMedicationNotifications(medicamento.id);

  if (!medicamento.horarios || medicamento.horarios.length === 0) {
    console.log(`⚠️ Medicamento ${medicamento.nome} não possui horários definidos.`);
    return;
  }

  const now = moment();

  // ADICIONADO: Configura o canal antes de agendar
  await setupNotificationChannel();
  let endDate = null;

  if (!medicamento.uso_continuo && medicamento.duracao_tratamento > 0) {
    endDate = moment().add(medicamento.duracao_tratamento, 'days');
  }

  for (const horario of medicamento.horarios) {
    const [hour, minute] = horario.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) continue;

    let scheduledTime = moment().hour(hour).minute(minute).second(0);
    if (scheduledTime.isBefore(now)) scheduledTime = scheduledTime.add(1, 'day');

    // Dados completos do medicamento para o modal
    const notificationData = {
      medicamentoId: medicamento.id,
      nome: medicamento.nome,
      dosagem: medicamento.dosagem || 'Não informado',
      horario: horario,
      userId: medicamento.user_id,
    };

    // ADICIONADO: Ações de notificação (Botões Tomar e Adiar)
    const notificationActions = [
      {
        identifier: 'tomar',
        buttonTitle: 'Tomar',
        options: {
          opensApp: false, // Não abre o app, apenas executa a ação
        },
      },
      {
        identifier: 'adiar',
        buttonTitle: 'Adiar 5 min',
        options: {
          opensApp: false, // Não abre o app, apenas executa a ação
        },
      },
    ];

    // Define a categoria para as ações
    await Notifications.setNotificationCategoryAsync('medication-alarm', notificationActions);

    const notificationContent = {
      title: `💊 ${medicamento.nome}`,
      body: `Hora de tomar ${medicamento.dosagem || 'seu medicamento'}`,
      sound: true,
      priority: 'high',
      data: notificationData,
      categoryIdentifier: 'medication-alarm',
      android: {
        channelId: 'medication-channel',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
    };

    if (medicamento.uso_continuo) {
      // Notificação diária contínua
      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          hour: scheduledTime.hour(),
          minute: scheduledTime.minute(),
          repeats: true,
        },
      });
      console.log(`📅 Notificação diária contínua agendada para ${medicamento.nome} às ${horario} (ID: ${identifier})`);
    } else {
      // Notificações únicas até o fim do tratamento
      let current = moment(scheduledTime);
      while (current.isSameOrBefore(endDate)) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: { ...notificationContent, data: { ...notificationData, unico: true } },
          trigger: current.toDate(),
        });
        console.log(`⏳ Notificação única agendada para ${medicamento.nome} em ${current.format('DD/MM HH:mm')} (ID: ${identifier})`);
        current = current.add(1, 'day');
      }
    }
  }
}

// ========================================
// CANCELAMENTO DE NOTIFICAÇÕES
// ========================================
/**
 * Cancela todas as notificações agendadas para um medicamento específico.
 */
export async function cancelMedicationNotifications(medicamentoId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const notificationsToCancel = scheduled.filter(
    notification => notification.content.data?.medicamentoId === medicamentoId
  );

  for (const notification of notificationsToCancel) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    console.log(`❌ Notificação cancelada (ID: ${notification.identifier}) para medicamento ${medicamentoId}`);
  }
}

/**
 * Cancela todas as notificações do app.
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('🧹 Todas as notificações agendadas foram canceladas.');
}

// ========================================
// FUNÇÃO PARA ADIAR NOTIFICAÇÃO (5 MINUTOS)
// ========================================
/**
 * Reagenda uma notificação para 5 minutos depois.
 */
export async function snoozeNotification(medicamento) {
  const snoozeTime = moment().add(5, 'minutes');
  
  const notificationData = {
    medicamentoId: medicamento.id,
    nome: medicamento.nome,
    dosagem: medicamento.dosagem,
    horario: medicamento.horario,
    userId: medicamento.userId,
    snoozed: true,
  };

  // Configura o canal antes de agendar
  await setupNotificationChannel();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 ${medicamento.nome} (Lembrete)`,
      body: `Hora de tomar ${medicamento.dosagem || 'seu medicamento'}`,
      sound: true,
      priority: 'high',
      data: notificationData,
      categoryIdentifier: 'medication-alarm',
      android: {
        channelId: 'medication-channel',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
    },
    trigger: snoozeTime.toDate(),
  });

  console.log(`⏰ Notificação adiada para ${medicamento.nome} - ${snoozeTime.format('HH:mm')} (ID: ${identifier})`);
  return identifier;
}

// ========================================
// REGISTRAR TOMADA NO BANCO DE DADOS
// ========================================
/**
 * Registra no banco que o medicamento foi tomado.
 */
export async function registerMedicationTaken(medicamento) {
  try {
    // Busca o user_id da sessão atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return false;
    }

    const { data, error } = await supabase
      .from('uso_medicamento')
      .insert([
        {
          medicamento_id: medicamento.id,
          user_id: user.id, // Usa o user_id da sessão (auth.users)
          data_uso: new Date().toISOString(),
          quantidade_usada: null, // Pode adicionar quantidade se quiser
          observacoes: `Tomado via notificação às ${moment().format('HH:mm')}`,
        },
      ]);

    if (error) {
      console.error('❌ Erro ao registrar tomada:', error);
      return false;
    }

    console.log(`✅ Tomada registrada para ${medicamento.nome} às ${moment().format('HH:mm')}`);
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado ao registrar:', err);
    return false;
  }
}

// ========================================
// BUSCAR MEDICAMENTOS AGENDADOS PARA UM HORÁRIO
// ========================================
/**
 * Busca todos os medicamentos que devem ser tomados em um horário específico.
 * Usado para agrupar múltiplos medicamentos no mesmo modal.
 */
export async function getMedicationsForTime(userId, horario) {
  try {
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('user_id', userId)
      .contains('horarios', [horario]);

    if (error) {
      console.error('❌ Erro ao buscar medicamentos:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return [];
  }
}

// ========================================
// LISTENERS DE NOTIFICAÇÕES
// ========================================
/**
 * Listener que intercepta notificações recebidas em PRIMEIRO PLANO.
 * Quando uma notificação chega, abre o modal ao invés de mostrar banner.
 */
export function listenToNotifications() {
  return Notifications.addNotificationReceivedListener(async (notification) => {
    console.log('🔔 Notificação recebida em primeiro plano:', notification);

    const { data } = notification.request.content;
    
    // Se houver callback definido, chama o modal
    if (notificationModalCallback && data.medicamentoId) {
      const medicamento = {
        id: data.medicamentoId,
        nome: data.nome,
        dosagem: data.dosagem,
        horario: data.horario,
        userId: data.userId,
      };

      // Busca outros medicamentos no mesmo horário para agrupar
      const medicamentosNoMesmoHorario = await getMedicationsForTime(
        data.userId,
        data.horario
      );

      // Abre o modal com todos os medicamentos daquele horário
      if (medicamentosNoMesmoHorario.length > 0) {
        notificationModalCallback(medicamentosNoMesmoHorario.map(med => ({
          id: med.id,
          nome: med.nome,
          dosagem: med.dosagem,
          horario: data.horario,
          userId: data.userId,
        })));
      } else {
        // Se não encontrou no banco, usa só o da notificação
        notificationModalCallback([medicamento]);
      }
    }
  });
}

/**
 * Listener de respostas do usuário às notificações.
 * Usado quando o app está em SEGUNDO PLANO/FECHADO e o usuário interage com a notificação.
 * IMPORTANTE: Este handler funciona mesmo quando o app está fechado (headless mode).
 */
export function listenToNotificationResponses() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { data } = response.notification.request.content;
    const actionIdentifier = response.actionIdentifier;
    const appState = AppState.currentState;
    
    console.log('📩 Usuário interagiu com a notificação:', {
      data,
      action: actionIdentifier,
      appState,
    });

    const medicamento = {
      id: data.medicamentoId,
      nome: data.nome,
      dosagem: data.dosagem,
      horario: data.horario,
      userId: data.userId,
    };

    // Handler para ação "Tomar" - funciona em qualquer estado do app
    if (actionIdentifier === 'tomar') {
      try {
        await registerMedicationTaken(medicamento);
        // Cancela a notificação que gerou a resposta
        await Notifications.dismissNotificationAsync(response.notification.request.identifier);
        console.log('✅ Medicamento registrado como tomado (via notificação)');
      } catch (error) {
        console.error('❌ Erro ao processar ação "Tomar":', error);
      }
      return;
    }

    // Handler para ação "Adiar" - funciona em qualquer estado do app
    if (actionIdentifier === 'adiar') {
      try {
        await snoozeNotification(medicamento);
        // Cancela a notificação que gerou a resposta
        await Notifications.dismissNotificationAsync(response.notification.request.identifier);
        console.log('⏰ Medicamento adiado (via notificação)');
      } catch (error) {
        console.error('❌ Erro ao processar ação "Adiar":', error);
      }
      return;
    }

    // Se o usuário tocou na notificação (ação padrão)
    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // Abre o modal se o app estiver ativo
      if (appState === 'active' && notificationModalCallback && data.medicamentoId) {
        try {
          // Busca outros medicamentos no mesmo horário
          const medicamentosNoMesmoHorario = await getMedicationsForTime(
            data.userId,
            data.horario
          );

          if (medicamentosNoMesmoHorario.length > 0) {
            notificationModalCallback(medicamentosNoMesmoHorario.map(med => ({
              id: med.id,
              nome: med.nome,
              dosagem: med.dosagem,
              horario: data.horario,
              userId: data.userId,
            })));
          } else {
            notificationModalCallback([medicamento]);
          }
        } catch (error) {
          console.error('❌ Erro ao abrir modal:', error);
        }
      } else {
        // Se o app estiver em background/fechado, apenas registra o log
        console.log('📱 App em background/fechado - notificação exibida');
      }
    }
  });
}

// ========================================
// FUNÇÕES AUXILIARES EXPORTADAS
// ========================================
export default {
  requestNotificationPermissions,
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  cancelAllNotifications,
  snoozeNotification,
  registerMedicationTaken,
  getMedicationsForTime,
  listenToNotifications,
  listenToNotificationResponses,
  setNotificationModalCallback,
  setupNotificationChannel, // EXPORTADO
};