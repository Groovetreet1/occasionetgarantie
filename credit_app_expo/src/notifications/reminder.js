// Reminders are handled via in-app notifications
// For push/remote notifications, use a development build with expo-notifications

export async function requestPermissions() {
  return true;
}

export async function scheduleReminder(credit) {
  // In-app reminder scheduling
  // For real push notifications, switch to a development build and install expo-notifications
  console.log(`[Reminder] Scheduled for ${credit.nomComplet} - ${credit.montant.toFixed(2)} MAD`);
}

export async function cancelAllReminders() {
  console.log('[Reminder] All reminders cancelled');
}
