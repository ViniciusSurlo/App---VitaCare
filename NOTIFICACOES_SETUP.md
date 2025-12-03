# Configuração de Notificações - VitaCare

## Visão Geral

Este projeto foi configurado para suportar notificações de alarme estilo nativo do Android, com suporte a:

- ✅ Notificações em foreground, background e com app fechado
- ✅ Full-screen intent (abre tela cheia quando app está em background/fechado)
- ✅ Botões de ação (Tomar/Adiar) funcionando em qualquer estado
- ✅ Vibração, som e acender tela
- ✅ Permissões Android 13+ configuradas

## Como Funciona

### 1. Plugin `withFullScreenAlarm.js`

O plugin configura:
- Permissões necessárias (USE_FULL_SCREEN_INTENT, SCHEDULE_EXACT_ALARM, etc.)
- Activity `FullScreenAlarmActivity` para tela cheia
- Layout nativo para a tela de alarme

### 2. Serviço de Notificações

O `notificationService.js` gerencia:
- Agendamento de notificações
- Criação do canal de notificação (importância MAX)
- Handlers para ações (Tomar/Adiar)
- Registro no banco de dados

### 3. Bridge de Comunicação

O `fullScreenAlarmBridge.js` conecta:
- Activity nativa (Kotlin) com JavaScript
- Eventos de ação (tomar/adiar) da tela cheia

## Configurações Importantes

### AndroidManifest.xml (gerado automaticamente)

O plugin adiciona:
- Permissão `USE_FULL_SCREEN_INTENT`
- Permissão `SCHEDULE_EXACT_ALARM`
- Permissão `POST_NOTIFICATIONS`
- Activity `FullScreenAlarmActivity` configurada para full-screen

### Canal de Notificação

O canal `alarm-channel` é criado com:
- Importância: MAX
- Vibração: [0, 250, 250, 250]
- Visibilidade: PÚBLICA (mostra na tela de bloqueio)

## Como Usar

### Agendar Notificação

```javascript
import * as notificationService from './src/services/notificationService';

await notificationService.scheduleMedicationNotifications({
  id: 'med-123',
  nome: 'Paracetamol',
  dosagem: '500mg',
  horarios: ['08:00', '20:00'],
  uso_continuo: true,
  user_id: 'user-123'
});
```

### Escutar Ações

As ações são automaticamente processadas pelos listeners configurados no `App.js`.

## Build e Deploy

### Pré-requisitos

1. Expo SDK 54+
2. React Native 0.81+
3. Android SDK 35 (compileSdkVersion)

### Build

```bash
# Desenvolvimento
eas build --profile development --platform android

# Preview (APK)
eas build --profile preview --platform android

# Produção (AAB)
eas build --profile production --platform android
```

### Permissões no Android

As seguintes permissões são adicionadas automaticamente:
- `USE_FULL_SCREEN_INTENT` - Para full-screen intent
- `SCHEDULE_EXACT_ALARM` - Para alarmes exatos (Android 12+)
- `POST_NOTIFICATIONS` - Para notificações (Android 13+)
- `VIBRATE` - Para vibração
- `WAKE_LOCK` - Para acender tela

## Troubleshooting

### Notificações não aparecem

1. Verifique se as permissões foram concedidas
2. Verifique se o canal de notificação foi criado
3. Verifique os logs do Android (adb logcat)

### Full-screen não funciona

1. Verifique se a permissão `USE_FULL_SCREEN_INTENT` está no AndroidManifest
2. Verifique se a Activity está configurada corretamente
3. Verifique se o canal tem importância MAX

### Botões não funcionam em background

1. Verifique se os listeners estão configurados no `App.js`
2. Verifique se o `fullScreenAlarmBridge.js` está importado
3. Verifique os logs para erros

## Estrutura de Arquivos

```
plugins/
  └── withFullScreenAlarm.js          # Plugin de configuração nativa

src/services/
  ├── notificationService.js          # Serviço principal de notificações
  └── fullScreenAlarmBridge.js       # Bridge entre nativo e JS

android/app/src/main/
  ├── java/com/seuapp/vitacare/
  │   └── FullScreenAlarmActivity.kt # Activity nativa
  └── res/layout/
      └── activity_full_screen_alarm.xml # Layout da tela cheia
```

## Notas Importantes

1. O `expo-notifications` não suporta `fullScreenIntent` diretamente. A solução usa uma Activity nativa que é chamada quando a notificação é exibida.

2. Para Android 12+, a permissão `SCHEDULE_EXACT_ALARM` pode precisar ser solicitada em runtime em alguns casos.

3. O full-screen intent funciona melhor quando o app está em background ou fechado. Em foreground, o modal é exibido.

4. As ações (Tomar/Adiar) funcionam através de:
   - Botões na notificação (quando disponível)
   - Botões na Activity full-screen
   - Handlers em background através dos listeners

## Próximos Passos

Para melhorar ainda mais:
1. Adicionar suporte a ícones personalizados
2. Adicionar sons customizados
3. Melhorar a UI da tela full-screen
4. Adicionar suporte a múltiplos medicamentos na mesma notificação

