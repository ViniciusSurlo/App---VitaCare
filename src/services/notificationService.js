import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { Alert } from 'react-native';

// Configura comportamento das notificações em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

/**
 * Agenda notificações de acordo com o tipo de uso do medicamento.
 */
export async function scheduleMedicationNotifications(medicamento) {
  const permissionsGranted = await requestNotificationPermissions();
  if (!permissionsGranted) return;

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

    if (medicamento.uso_continuo) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: medicamento.nome,
          body: 'Está na hora de tomar seu remédio!',
          sound: true,
          data: { medicamentoId: medicamento.id, horario },
        },
        trigger: {
          hour: scheduledTime.hour(),
          minute: scheduledTime.minute(),
          repeats: true,
        },
      });
      console.log(`🔁 Notificação diária contínua agendada para ${medicamento.nome} às ${horario} (ID: ${identifier})`);
    } else {
      let current = moment(scheduledTime);
      while (current.isSameOrBefore(endDate)) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: medicamento.nome,
            body: 'Está na hora de tomar seu remédio!',
            sound: true,
            data: { medicamentoId: medicamento.id, horario, unico: true },
          },
          trigger: current.toDate(),
        });
        console.log(`⏳ Notificação única agendada para ${medicamento.nome} em ${current.format('DD/MM HH:mm')} (ID: ${identifier})`);
        current = current.add(1, 'day');
      }
    }
  }
}

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

/**
 * Listener de notificações recebidas.
 * Retorna a subscription para remover depois se necessário.
 */
export function listenToNotifications() {
  return Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notificação recebida:', notification);
  });
}

/**
 * Listener de respostas do usuário às notificações.
 * Retorna a subscription para remover depois se necessário.
 */
export function listenToNotificationResponses() {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;
    console.log('📩 Usuário interagiu com a notificação:', data);
  });
}
