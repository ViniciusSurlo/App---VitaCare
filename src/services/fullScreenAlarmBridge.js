// src/services/fullScreenAlarmBridge.js
import { NativeEventEmitter, DeviceEventEmitter, Platform } from 'react-native';

/**
 * Adiciona um listener para as ações de alarme (Tomar/Adiar) vindas da Activity FullScreen.
 * A Activity nativa envia eventos através do DeviceEventEmitter do React Native.
 * 
 * @param {function} callback - Função a ser chamada com o payload { action: 'tomar'|'adiar', medicamento: {...} }
 * @returns {object} - O objeto de subscrição para remover o listener.
 */
export function addAlarmActionListener(callback) {
    // O nome do evento deve ser o mesmo definido no código nativo (FullScreenAlarmActivity.kt)
    const EVENT_ALARM_ACTION = "onAlarmAction";
    
    // Usa DeviceEventEmitter que é o padrão do React Native para eventos nativos
    // A Activity nativa usa RCTDeviceEventEmitter que é o mesmo que DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener(EVENT_ALARM_ACTION, (payload) => {
        console.log('🚨 Evento de alarme recebido:', payload);
        
        // Normaliza o payload para garantir compatibilidade
        const normalizedPayload = {
            action: payload.action,
            medicamento: payload.medicamento || payload.medication || {},
        };
        
        callback(normalizedPayload);
    });
    
    return subscription;
}
