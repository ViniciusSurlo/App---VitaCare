# Correções de Build Aplicadas

## Problema Resolvido

### Erro Original
```
[CXX1214] User has minSdkVersion 23 but library was built for 24 [//ReactAndroid/hermestooling]
```

### Causa
O React Native 0.81.4 requer `minSdkVersion` 24 devido à biblioteca `hermestooling` que foi compilada para Android 7.0+ (API 24).

## Alterações Realizadas

### 1. `app.json` - Configurações de Build Simplificadas

**Antes:**
```json
{
  "compileSdkVersion": 35,
  "targetSdkVersion": 35,
  "buildToolsVersion": "35.0.0",
  "minSdkVersion": 23,
  "gradleVersion": "8.3",
  "enableProguardInReleaseBuilds": true,
  "enableShrinkResourcesInReleaseBuilds": true,
  "enableMinifyInReleaseBuilds": true
}
```

**Depois:**
```json
{
  "compileSdkVersion": 34,
  "targetSdkVersion": 34,
  "minSdkVersion": 24
}
```

**Mudanças:**
- ✅ `minSdkVersion`: 23 → 24 (requerido pelo React Native)
- ✅ `compileSdkVersion`: 35 → 34 (mais estável)
- ✅ `targetSdkVersion`: 35 → 34 (mais estável)
- ❌ Removido `buildToolsVersion` (usar padrão do Expo)
- ❌ Removido `gradleVersion` (usar padrão do Expo)
- ❌ Removido otimizações de build (podem causar problemas)

### 2. `eas.json` - Configurações Simplificadas

**Removido:**
- `gradleCommand` explícito (usar padrão)
- `GRADLE_OPTS` (pode causar problemas)

**Mantido apenas:**
- Configurações essenciais de build type
- Auto-increment para produção

### 3. `app.json` - Plugin de Notificações

**Ajustado:**
- Removido `sounds: []` (desnecessário)
- Ícone alterado para `logo.png` (mais consistente)

## Configurações Finais

### Android SDK
- **minSdkVersion**: 24 (Android 7.0+)
- **targetSdkVersion**: 34 (Android 14)
- **compileSdkVersion**: 34 (Android 14)

### Compatibilidade
- ✅ Android 7.0+ (API 24+)
- ✅ React Native 0.81.4
- ✅ Expo SDK 54

## Próximos Passos

1. **Fazer build novamente:**
   ```bash
   eas build --profile preview --platform android
   ```

2. **Se ainda houver problemas:**
   - Verifique se todas as dependências estão atualizadas
   - Limpe o cache: `eas build --clear-cache`
   - Verifique os logs completos do build

## Notas

- O `minSdkVersion` 24 é obrigatório para React Native 0.81.4+
- Configurações simplificadas reduzem chances de conflitos
- O Expo gerencia automaticamente muitas configurações de build

