# Sistema de Notificações - Estilo Mensagem

## Visão Geral

O sistema de notificações foi simplificado para funcionar como aplicativos de mensagem, com notificações padrão que incluem botões de ação (Tomar/Adiar).

## Funcionalidades

### ✅ Notificações Estilo Mensagem
- Notificações padrão do sistema com botões de ação
- Funciona em foreground, background e com app fechado
- Botões "Tomar" e "Adiar" visíveis na notificação
- Vibração e som configurados

### ✅ Botões de Ação
- **Tomar**: Registra no banco de dados e encerra notificação
- **Adiar**: Reagenda para 5 minutos depois
- Funcionam mesmo com app fechado (headless mode)

### ✅ Modal em Foreground
- Quando o app está ativo, um modal customizado é exibido
- Quando o app está em background/fechado, a notificação padrão é exibida

## Configurações

### Canal de Notificação
- **Nome**: "Lembretes de Medicamento"
- **Importância**: HIGH (estilo mensagem)
- **Vibração**: [0, 250, 250, 250]
- **Visibilidade**: Pública (mostra na tela de bloqueio)

### Permissões Android
- `SCHEDULE_EXACT_ALARM` - Para alarmes exatos
- `POST_NOTIFICATIONS` - Para notificações (Android 13+)
- `VIBRATE` - Para vibração

## Como Funciona

### Agendamento
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

### Handlers Automáticos
Os handlers estão configurados no `App.js` e processam automaticamente:
- Notificações recebidas em foreground (abre modal)
- Ações dos botões (Tomar/Adiar) em qualquer estado
- Toque na notificação (abre modal se app ativo)

## Estrutura

```
src/services/
  └── notificationService.js    # Serviço principal de notificações

App.js                           # Configuração de listeners
```

## Diferenças da Versão Anterior

### ❌ Removido
- Full-screen intent
- Activity nativa FullScreenAlarmActivity
- Plugin withFullScreenAlarm.js
- Permissão USE_FULL_SCREEN_INTENT
- Permissão WAKE_LOCK
- Bridge fullScreenAlarmBridge.js

### ✅ Mantido
- Notificações com botões de ação
- Modal em foreground
- Handlers em background
- Registro no banco de dados
- Reagendamento ao adiar

## Build

O build agora é mais simples, sem dependências de código nativo customizado:

```bash
eas build --profile preview --platform android
```

## Troubleshooting

### Botões não aparecem na notificação
1. Verifique se a categoria 'medication-alarm' foi criada
2. Verifique se o canal 'medication-channel' foi criado
3. Verifique os logs: `adb logcat | grep -i notification`

### Ações não funcionam em background
1. Verifique se os listeners estão configurados no App.js
2. Verifique os logs para erros
3. Teste em dispositivo físico (emulador pode ter limitações)

### Notificações não aparecem
1. Verifique permissões do app
2. Verifique se o canal foi criado
3. Verifique configurações de notificação do dispositivo

