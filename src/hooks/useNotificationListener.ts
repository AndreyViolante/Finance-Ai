import {useEffect, useRef} from 'react';
import {NativeModules, NativeEventEmitter, Alert, LogBox} from 'react-native';

LogBox.ignoreLogs(['[NotificationListener]']);
import {parseNotification} from '../services/notificationParser';
import {addCardExpense} from '../services/storage';
import {RawNotificationPayload} from '../types';

const {FinanceNotification} = NativeModules;

const emitter = FinanceNotification
  ? new NativeEventEmitter(FinanceNotification)
  : null;

export function useNotificationListener(onNewExpense?: () => void): void {
  // Stable ref — listener never re-subscribes when caller re-renders
  const callbackRef = useRef(onNewExpense);
  useEffect(() => { callbackRef.current = onNewExpense; }, [onNewExpense]);

  useEffect(() => {
    if (!FinanceNotification || !emitter) {
      console.warn('[NotificationListener] Módulo nativo não disponível — rode o build com EAS.');
      return;
    }

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
        const expense = parseNotification(payload);
        if (expense) {
          addCardExpense(expense);
          callbackRef.current?.();
        }
      },
    );

    return () => subscription.remove();
  }, []); // subscribe once; callback updates via ref
}
