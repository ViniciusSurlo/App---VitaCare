// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { Alert } from 'react-native';
import { supabase } from './supabaseClient';

// ========================================
// CONFIGURAÇÃO GLOBAL DE NOTIFICAÇÕES
// ========================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
 * Solicita permissões de notificação ao usuário.
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Permissão de Notificação Necessária',
      'Ative as permissões de notificação para receber lembretes de medicamentos.'
    );
    return false;
  }
  return true;
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

    if (medicamento.uso_continuo) {
      // Notificação diária contínua
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${medicamento.nome}`,
          body: `Hora de tomar ${medicamento.dosagem || 'seu medicamento'}`,
          sound: true,
          priority: 'high',
          data: notificationData,
        },
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
          content: {
            title: `💊 ${medicamento.nome}`,
            body: `Hora de tomar ${medicamento.dosagem || 'seu medicamento'}`,
            sound: true,
            priority: 'high',
            data: { ...notificationData, unico: true },
          },
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

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 ${medicamento.nome} (Lembrete)`,
      body: `Hora de tomar ${medicamento.dosagem || 'seu medicamento'}`,
      sound: true,
      priority: 'high',
      data: notificationData,
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
 * Usado quando o app está em SEGUNDO PLANO e o usuário toca na notificação.
 */
export function listenToNotificationResponses() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { data } = response.notification.request.content;
    console.log('📩 Usuário interagiu com a notificação:', data);

    // Quando usuário toca na notificação, abre o modal
    if (notificationModalCallback && data.medicamentoId) {
      const medicamento = {
        id: data.medicamentoId,
        nome: data.nome,
        dosagem: data.dosagem,
        horario: data.horario,
        userId: data.userId,
      };

      // Busca outros no mesmo horário
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
};