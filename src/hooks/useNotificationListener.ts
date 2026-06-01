import {useEffect} from 'react';
import {NativeModules, NativeEventEmitter, Alert, Linking} from 'react-native';
import {parseNotification} from '../services/notificationParser';
import {addCardExpense} from '../services/storage';
import {RawNotificationPayload} from '../types';

const {FinanceNotification} = NativeModules;
const emitter = new NativeEventEmitter(FinanceNotification);

/**
 * Registers the notification listener on mount.
 * - Checks if the NotificationListenerService permission is granted.
 * - If not, prompts the user to enable it in system settings.
 * - Parses incoming bank notifications and persists them.
 *
 * @param onNewExpense optional callback fired after each successfully parsed expense
 */
export function useNotificationListener(onNewExpense?: () => void): void {
  useEffect(() => {
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
