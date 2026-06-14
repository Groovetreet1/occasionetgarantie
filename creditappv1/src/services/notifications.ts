import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Credit } from '@/src/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('credits_reminder', {
      name: 'Rappels crédits',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  return true;
}

function toMillis(dateStr: string, hour: number, minute: number): number {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export async function scheduleCreditNotifications(credit: Credit) {
  const now = Date.now();
  const label = `${credit.prenom} ${credit.nom}`;
  const echeanceMs = toMillis(credit.dateEcheance, 9, 0);

  // Jour J (09:00)
  if (echeanceMs > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔴 Échéance aujourd\'hui !',
        body: `Le crédit de ${credit.montant} MAD pour ${label} est arrivé à échéance.`,
        data: { creditId: credit.id, type: 'JOUR_J' },
      },
      trigger: { date: new Date(echeanceMs), channelId: 'credits_reminder' },
    });
  }

  // 48h avant
  const pre48hMs = echeanceMs - 2 * 24 * 60 * 60 * 1000;
  if (pre48hMs > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Alerte 48h avant !',
        body: `Le remboursement de ${credit.montant} MAD pour ${label} expire dans 2 jours.`,
        data: { creditId: credit.id, type: 'PRE_48H' },
      },
      trigger: { date: new Date(pre48hMs), channelId: 'credits_reminder' },
    });
  }
}

export async function cancelCreditNotifications(creditId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled
    .filter(n => n.content.data?.creditId === creditId)
    .map(n => n.identifier);
  if (toCancel.length > 0) {
    await Notifications.cancelScheduledNotificationAsync(toCancel[0]);
    if (toCancel.length > 1) {
      const remaining = toCancel.slice(1);
      for (const id of remaining) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
  }
}
