import {useEffect} from 'react';
import {NativeModules, NativeEventEmitter, Alert} from 'react-native';
import {parseNotification} from '../services/notificationParser';
import {addCardExpense} from '../services/storage';
import {RawNotificationPayload} from '../types';

const {FinanceNotification} = NativeModules;

// Guard: módulo nativo só existe no Dev Build com o plugin compilado
const emitter = FinanceNotification
  ? new NativeEventEmitter(FinanceNotification)
  : null;

export function useNotificationListener(onNewExpense?: () => void): void {
  useEffect(() => {
    if (!FinanceNotification || !emitter) {
      console.warn('[NotificationListener] Módulo nativo não disponível — rode o build com EAS.');
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const enabled: boolean =
          await FinanceNotification.isNotificationListenerEnabled();

        if (!enabled) {
          Alert.alert(
            'Permissão necessária',
            'Para capturar gastos automaticamente, habilite o acesso a notificações para o FinanceAI.',
            [
              {text: 'Agora não', style: 'cancel'},
              {
                text: 'Abrir configurações',
                onPress: () =>
                  FinanceNotification.openNotificationListenerSettings(),
              },
            ],
          );
        }
      } catch (err) {
        console.warn('[NotificationListener] Permission check failed:', err);
      }
    }

    init();

    const subscription = emitter.addListener(
      'onBankNotification',
      (payload: RawNotificationPayload) => {
        if (!mounted) return;
        const expense = parseNotification(payload);
        if (expense) {
          addCardExpense(expense);
          onNewExpense?.();
        }
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [onNewExpense]);
}
