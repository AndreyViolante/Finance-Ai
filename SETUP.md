# FinanceAI — Setup Guide

## Pré-requisitos

- Node.js 18+
- JDK 17+
- Android Studio + SDK (API 26+)
- React Native CLI: `npm install -g react-native-cli`

## 1. Instalar dependências

```bash
cd FinanceAI
npm install
```

## 2. Configurar API Key

```bash
cp .env.example .env
# Edite .env e insira sua ANTHROPIC_API_KEY
```

## 3. Configuração do `react-native-config`

No `android/app/build.gradle`, adicione no topo:

```groovy
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

## 4. Linking automático

```bash
npx react-native-config link  # se necessário
```

## 5. Rodar no Android

```bash
npx react-native run-android
```

## 6. Habilitar permissão de Notificações

1. Abra o app
2. O app vai perguntar: toque em **"Abrir configurações"**
3. Em **Configurações → Apps → Acesso especial a apps → Acesso a notificações**
4. Habilite **FinanceAI**

A partir daí o `FinanceNotificationService` já está escutando automaticamente.

## Arquitetura

```
Notificação de banco
       ↓
FinanceNotificationService.java   ← Android NotificationListenerService
       ↓
NotificationEventEmitter.java     ← Ponte Java → JS (DeviceEventEmitter)
       ↓
useNotificationListener.ts        ← Hook React Native
       ↓
notificationParser.ts             ← Regex extrai valor + estabelecimento
       ↓
storage.ts (MMKV)                 ← Persiste CardExpense
       ↓
DashboardScreen / StatementScreen ← Exibe + permite edição
       ↓
claudeService.ts                  ← Envia contexto para Claude API
       ↓
Diagnóstico no Dashboard
```

## Bancos suportados (detecção automática)

| App | Package |
|-----|---------|
| Nubank | com.nu.production |
| Itaú | br.com.itau |
| Bradesco | br.com.bradesco |
| Banco do Brasil | br.com.bb.android |
| Santander | br.com.santander.benfico |
| Inter | br.com.inter |
| C6 Bank | com.c6bank.app |
| PicPay | com.picpay |
| PagBank | com.pagbank |

Para adicionar outros bancos: edite `BANK_PACKAGES` em `FinanceNotificationService.java`.
