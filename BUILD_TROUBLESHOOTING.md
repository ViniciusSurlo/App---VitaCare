# Troubleshooting de Build - EAS Build

## Erro: Timeout ao baixar Gradle

### Problema
```
Exception in thread "main"
java.io.IOException: Downloading from https://services.gradle.org/distributions/gradle-8.14.3-bin.zip failed: timeout (10000ms)
```

### Soluções

#### 1. Tentar Novamente (Recomendado Primeiro)
O erro pode ser temporário devido a problemas de rede no servidor EAS Build. Tente novamente:

```bash
eas build --profile preview --platform android
```

#### 2. Usar Versão Específica do Gradle
Foi configurado no `app.json` para usar Gradle 8.3, que é mais estável e pode estar em cache:

```json
"gradleVersion": "8.3"
```

#### 3. Configurações Adicionadas no eas.json
Foram adicionadas configurações para melhorar a confiabilidade:

```json
"env": {
  "GRADLE_OPTS": "-Dorg.gradle.daemon=false -Dorg.gradle.parallel=false"
}
```

#### 4. Limpar Cache e Tentar Novamente
Se o problema persistir, você pode tentar limpar o cache:

```bash
# Limpar cache local do EAS
eas build --clear-cache --profile preview --platform android
```

#### 5. Usar Build Local (Alternativa)
Se o problema persistir, você pode fazer build local:

```bash
# Gerar projeto nativo
npx expo prebuild

# Build local
cd android
./gradlew assembleRelease
```

#### 6. Verificar Status do EAS
Verifique se há problemas conhecidos com o serviço EAS Build:

```bash
eas build:list
```

### Configurações Aplicadas

1. **eas.json**: Adicionadas variáveis de ambiente para Gradle
2. **app.json**: Especificada versão do Gradle (8.3)
3. **Gradle Options**: Desabilitado daemon e paralelização para evitar problemas

### Próximos Passos

1. Tente fazer o build novamente:
   ```bash
   eas build --profile preview --platform android
   ```

2. Se o problema persistir após 2-3 tentativas, pode ser um problema temporário do serviço EAS. Aguarde alguns minutos e tente novamente.

3. Se continuar falhando, considere:
   - Verificar sua conexão de internet
   - Tentar em horário diferente (menos tráfego)
   - Usar build local como alternativa temporária

### Notas

- O timeout de 10 segundos é muito curto para downloads grandes
- O EAS Build pode ter cache do Gradle, mas às vezes precisa baixar novamente
- Versões mais antigas do Gradle (8.3) são mais estáveis e frequentemente em cache

