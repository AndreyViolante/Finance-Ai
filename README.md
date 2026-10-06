# 💰 FinanceAI

Aplicativo Android de finanças pessoais que captura automaticamente gastos via notificações bancárias do Santander.

---

## ✨ Funcionalidades

- **Captura automática** de gastos via notificações do Santander (cartões configurados no .env)
- **Dashboard** com resumo financeiro: renda, despesas fixas, gastos no cartão e saldo livre
- **Meta de economia** mensal com barra de progresso (verde / amarelo / vermelho)
- **Extrato** com lista de gastos, edição e remoção
- **Lançamento manual** de gastos como fallback
- **Perfil** com renda mensal e despesas fixas recorrentes
- **Armazenamento local** com MMKV — sem dados na nuvem

---

## 📱 Telas

| Dashboard | Extrato | Perfil |
|-----------|---------|--------|
| Totais, meta e saldo livre | Lista de gastos do cartão | Renda e despesas fixas |

---

## 🛠️ Stack

| Tecnologia | Versão |
|-----------|--------|
| React Native | 0.74.5 |
| Expo SDK | 51 |
| react-native-mmkv | 2.12.2 |
| EAS Build | Cloud |
| Android NotificationListenerService | Java |

---

## 🚀 Rodando o projeto

### Pré-requisitos

- Node.js 18+
- Expo CLI
- Conta EAS (`eas login`)
- Android com modo desenvolvedor ativado

### Instalação

```bash
git clone https://github.com/AndreyViolante/Finance-Ai.git
cd Finance-Ai
npm install
```

### Configuração

Copie o `.env.example` para `.env` e informe os finais dos cartões do Santander que o app deve capturar:

```bash
EXPO_PUBLIC_SANTANDER_CARDS=1234,5678
```

O `.env` não vai para o git. Em builds na nuvem do EAS, cadastre a mesma variável no projeto
(`eas env:create`). Sem cartões configurados, todas as notificações do Santander são capturadas.

### Build de desenvolvimento

```bash
eas build --platform android --profile development
```

Instale o APK gerado no celular, escaneie o QR code com o Expo Go ou o Dev Client.

### Iniciar Metro

```bash
npx expo start --tunnel
```

---

## 🔔 Permissão de Notificações

Após instalar o app, vá em:

**Configurações → Aplicativos → Acesso especial → Acesso a notificações → FinanceAI → Ativar**

Ou o próprio app abre essa tela automaticamente.

---

## 📂 Estrutura

```
src/
  screens/
    DashboardScreen.tsx   # Resumo financeiro e meta
    StatementScreen.tsx   # Extrato e lançamento manual
    ProfileScreen.tsx     # Renda e despesas fixas
  services/
    storage.ts            # MMKV — leitura/escrita local
    notificationParser.ts # Extrai valor e loja da notificação
  hooks/
    useNotificationListener.ts  # Bridge com módulo nativo
  types/
    index.ts              # Interfaces TypeScript

android-src/notification/
  FinanceNotificationService.java  # Escuta notificações do sistema
  NotificationEventEmitter.java    # Envia eventos para o RN
  NotificationModule.java          # Módulo nativo exposto ao JS
  NotificationPackage.java         # Registra o módulo

plugins/
  withNotificationListener.js      # Config plugin Expo
```

---

## 🔒 Segurança

- Nenhuma chave de API no repositório
- `.env` está no `.gitignore`
- Dados ficam 100% no dispositivo (MMKV local)
- Repositório privado

---

## 📄 Licença

Projeto pessoal — uso privado.
