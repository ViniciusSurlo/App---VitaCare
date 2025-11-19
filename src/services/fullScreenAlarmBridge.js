// src/services/fullScreenAlarmBridge.js
import { NativeEventEmitter, NativeModules } from 'react-native';

// O nome do módulo nativo é o nome do pacote (com.vitacare.alarm)
// mas como estamos usando o DeviceEventEmitter do ReactContext,
// não precisamos de um módulo nativo específico para o JS.
// Apenas o listener de eventos é necessário.

const FullScreenAlarmEmitter = new NativeEventEmitter(NativeModules.DeviceEventManager);

/**
 * Adiciona um listener para as ações de alarme (Tomar/Adiar) vindas da Activity FullScreen.
 * @param {function} callback - Função a ser chamada com o payload { action: 'tomar'|'adiar', medicamento: {...} }
 * @returns {object} - O objeto de subscrição.
 */
export function addAlarmActionListener(callback) {
    // O nome do evento deve ser o mesmo definido no código nativo (FullScreenAlarmActivity.kt)
    const EVENT_ALARM_ACTION = "onAlarmAction";
    return FullScreenAlarmEmitter.addListener(EVENT_ALARM_ACTION, callback);
}
