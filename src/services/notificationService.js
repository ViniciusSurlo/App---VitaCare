// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { Alert, Platform, AppState, Linking } from 'react-native';
import { supabase } from './supabaseClient';

// ========================================
// CONFIGURAÇÃO GLOBAL DE NOTIFICAÇÕES
// ========================================
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Sempre mostra a notificação, mesmo em foreground
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let categoriesRegistered = false;
let channelSetup = false;
let notificationModalCallback = null;

// ========================================
// CONFIGURAÇÃO DO CANAL DE NOTIFICAÇÃO ANDROID
// ========================================
/**
 * Configura o canal de notificação com importância MAXIMA.
 * Deve ser chamado antes de agendar qualquer notificação.
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android' && !channelSetup) {
    try {
      await Notifications.setNotificationChannelAsync('medication-channel', {
        name: 'Lembretes de Medicamento',
        importance: Notifications.AndroidImportance.MAX, // MAX para garantir prioridade máxima
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        showBadge: true,
        description: 'Notificações de lembretes de medicamentos com ações rápidas',
      });
      channelSetup = true;
      console.log('✅ Canal de notificação configurado com importância MAX');
    } catch (error) {
      console.error('❌ Erro ao configurar canal:', error);
      // Tenta novamente mesmo se der erro (pode ser canal duplicado)
      channelSetup = true;
    }
  }
}

// ========================================
// REGISTRO DE CATEGORIAS DE NOTIFICAÇÃO
// ========================================
/**
 * Registra as categorias de notificação com ações (Tomar/Adiar).
 * Deve ser chamado ANTES de agendar qualquer notificação.
 * IMPORTANTE: As categorias precisam ser registradas apenas UMA VEZ.
 */
export async function registerNotificationCategories() {
  if (categoriesRegistered) {
    return; // Já registrado, não precisa registrar novamente
  }

  try {
    // Define as ações da notificação
    const actions = [
      {
        identifier: 'tomar',
        buttonTitle: 'Tomar',
        options: {
          opensApp: false, // Não abre o app, apenas executa a ação
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'adiar',
        buttonTitle: 'Adiar 5 min',
        options: {
          opensApp: false, // Não abre o app, apenas executa a ação
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ];

    // Registra a categoria
    await Notifications.setNotificationCategoryAsync('medication-alarm', actions);
    categoriesRegistered = true;
    console.log('✅ Categorias de notificação registradas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao registrar categorias:', error);
    // Tenta continuar mesmo com erro (pode ser categoria já existente)
    categoriesRegistered = true;
  }
}

// ========================================
// CALLBACK DO MODAL
// ========================================
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
 * IMPORTANTE: No Android 13+, POST_NOTIFICATIONS precisa ser solicitada em runtime.
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
        android: {
          // Android 13+ requer permissão explícita
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
          { 
            text: 'Abrir Configurações', 
            onPress: async () => {
              try {
                await Linking.openSettings();
              } catch (error) {
                console.error('Erro ao abrir configurações:', error);
              }
            }
          },
        ]
      );
      return false;
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
 * IMPORTANTE: Garante que canal e categorias estejam configurados antes de agendar.
 */
export async function scheduleMedicationNotifications(medicamento) {
  try {
    // 1. Solicita permissões
    const permissionsGranted = await requestNotificationPermissions();
    if (!permissionsGranted) {
      console.warn('⚠️ Permissões de notificação não concedidas');
      return;
    }

    // 2. Configura canal e categorias ANTES de agendar
    await setupNotificationChannel();
    await registerNotificationCategories();

    // 3. Cancela notificações anteriores deste medicamento
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

      // Dados completos do medicamento
      const notificationData = {
        medicamentoId: medicamento.id,
        nome: medicamento.nome,
        dosagem: medicamento.dosagem || 'Não informado',
        horario: horario,
        userId: medicamento.user_id,
      };

      // Conteúdo da notificação com categoria e ações
      const notificationContent = {
        title: medicamento.nome, // Título = nome do medicamento
        body: medicamento.dosagem ? `Tomar ${medicamento.dosagem}` : `Horário: ${horario}`, // Corpo = instrução ou horário
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX, // Prioridade máxima
        data: notificationData,
        categoryIdentifier: 'medication-alarm', // Categoria com botões Tomar/Adiar
        android: {
          channelId: 'medication-channel',
          priority: Notifications.AndroidNotificationPriority.MAX, // Prioridade máxima
          vibrate: [0, 250, 250, 250], // Vibração
          sound: 'default',
          autoCancel: true,
          ongoing: false,
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
        console.log(`✅ Notificação diária agendada: ${medicamento.nome} às ${horario} (ID: ${identifier})`);
      } else {
        // Notificações únicas até o fim do tratamento
        let current = moment(scheduledTime);
        while (current.isSameOrBefore(endDate)) {
          const identifier = await Notifications.scheduleNotificationAsync({
            content: { ...notificationContent, data: { ...notificationData, unico: true } },
            trigger: current.toDate(),
          });
          console.log(`✅ Notificação única agendada: ${medicamento.nome} em ${current.format('DD/MM HH:mm')} (ID: ${identifier})`);
          current = current.add(1, 'day');
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao agendar notificações:', error);
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
 * IMPORTANTE: Garante que canal e categorias estejam configurados.
 */
export async function snoozeNotification(medicamento) {
  try {
    // Garante que canal e categorias estão configurados
    await setupNotificationChannel();
    await registerNotificationCategories();

    const snoozeTime = moment().add(5, 'minutes');
    
    const notificationData = {
      medicamentoId: medicamento.id || medicamento.medicamentoId,
      nome: medicamento.nome,
      dosagem: medicamento.dosagem || 'Não informado',
      horario: medicamento.horario || moment().format('HH:mm'),
      userId: medicamento.userId || medicamento.user_id,
      snoozed: true,
    };

    const notificationContent = {
      title: medicamento.nome,
      body: medicamento.dosagem ? `Tomar ${medicamento.dosagem}` : `Lembrete - ${snoozeTime.format('HH:mm')}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: notificationData,
      categoryIdentifier: 'medication-alarm',
      android: {
        channelId: 'medication-channel',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        sound: 'default',
        autoCancel: true,
      },
    };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: snoozeTime.toDate(),
    });

    console.log(`⏰ Notificação adiada: ${medicamento.nome} para ${snoozeTime.format('HH:mm')} (ID: ${identifier})`);
    return identifier;
  } catch (error) {
    console.error('❌ Erro ao adiar notificação:', error);
    return null;
  }
}

// ========================================
// REGISTRAR TOMADA NO BANCO DE DADOS
// ========================================
/**
 * Registra no banco que o medicamento foi tomado.
 * Funciona mesmo quando o app está em background ou fechado.
 */
export async function registerMedicationTaken(medicamento) {
  try {
    // Busca o user_id da sessão atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Usuário não autenticado:', authError);
      return false;
    }

    const medicamentoId = medicamento.id || medicamento.medicamentoId;
    if (!medicamentoId) {
      console.error('❌ ID do medicamento não encontrado');
      return false;
    }

    const { data, error } = await supabase
      .from('uso_medicamento')
      .insert([
        {
          medicamento_id: medicamentoId,
          user_id: user.id,
          data_uso: new Date().toISOString(),
          quantidade_usada: 1,
          observacoes: `Tomado via notificação às ${moment().format('HH:mm')}`,
        },
      ]);

    if (error) {
      console.error('❌ Erro ao registrar tomada:', error);
      return false;
    }

    console.log(`✅ Tomada registrada: ${medicamento.nome} às ${moment().format('HH:mm')}`);
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
 * IMPORTANTE: Este handler funciona mesmo quando o app está fechado (headless mode).
 * Processa ações dos botões "Tomar" e "Adiar" em qualquer estado do app.
 */
export function listenToNotificationResponses() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    try {
      const { data } = response.notification.request.content;
      const actionIdentifier = response.actionIdentifier;
      const notificationId = response.notification.request.identifier;
      
      console.log('📩 Resposta de notificação recebida:', {
        actionIdentifier,
        medicamento: data.nome,
        notificationId,
      });

      // Prepara objeto do medicamento
      const medicamento = {
        id: data.medicamentoId,
        medicamentoId: data.medicamentoId,
        nome: data.nome,
        dosagem: data.dosagem,
        horario: data.horario,
        userId: data.userId,
        user_id: data.userId,
      };

      // Handler para ação "Tomar"
      if (actionIdentifier === 'tomar') {
        console.log('✅ Processando ação TOMAR para:', medicamento.nome);
        
        // Registra no banco de dados
        const success = await registerMedicationTaken(medicamento);
        
        if (success) {
          // Encerra a notificação
          try {
            await Notifications.dismissNotificationAsync(notificationId);
            console.log('✅ Notificação encerrada após registro');
          } catch (dismissError) {
            console.warn('⚠️ Erro ao encerrar notificação (não crítico):', dismissError);
          }
        }
        return;
      }

      // Handler para ação "Adiar"
      if (actionIdentifier === 'adiar') {
        console.log('⏰ Processando ação ADIAR para:', medicamento.nome);
        
        // Reagenda para 5 minutos depois
        const snoozeId = await snoozeNotification(medicamento);
        
        if (snoozeId) {
          // Encerra a notificação atual
          try {
            await Notifications.dismissNotificationAsync(notificationId);
            console.log('✅ Notificação atual encerrada, nova agendada');
          } catch (dismissError) {
            console.warn('⚠️ Erro ao encerrar notificação (não crítico):', dismissError);
          }
        }
        return;
      }

      // Se o usuário tocou na notificação (ação padrão)
      if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        const appState = AppState.currentState;
        
        // Abre o modal apenas se o app estiver ativo e houver callback
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
          console.log('📱 App em background/fechado - ação padrão ignorada');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta de notificação:', error);
    }
  });
}

// ========================================
// INICIALIZAÇÃO DO SISTEMA DE NOTIFICAÇÕES
// ========================================
/**
 * Inicializa o sistema de notificações.
 * Deve ser chamado uma vez no início do app para garantir que tudo esteja configurado.
 */
export async function initializeNotifications() {
  try {
    console.log('🔔 Inicializando sistema de notificações...');
    
    // Configura canal Android
    await setupNotificationChannel();
    
    // Registra categorias
    await registerNotificationCategories();
    
    // Solicita permissões
    await requestNotificationPermissions();
    
    console.log('✅ Sistema de notificações inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar notificações:', error);
  }
}

// ========================================
// FUNÇÕES AUXILIARES EXPORTADAS
// ========================================
export default {
  initializeNotifications,
  requestNotificationPermissions,
  setupNotificationChannel,
  registerNotificationCategories,
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