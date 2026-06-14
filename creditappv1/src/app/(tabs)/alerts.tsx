import { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCredits } from '@/src/context/CreditsContext';
import { formatMAD, formatDateString, getDaysRemaining } from '@/src/utils';
import { scheduleCreditNotifications, requestPermissions } from '@/src/services/notifications';

export default function AlertsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { credits } = useCredits();
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const alerts = useMemo(() => {
    const result: any[] = [];
    credits.forEach(c => {
      if (c.paye) return;
      const daysLeft = getDaysRemaining(c.dateEcheance);
      const label = `${c.prenom} ${c.nom}`;
      if (daysLeft === 0) {
        result.push({ id: `j-${c.id}`, creditId: c.id, title: "Échéance Aujourd'hui !", message: `Le crédit de ${formatMAD(c.montant)} pour ${label} est arrivé à échéance.`, type: 'error', daysLeft, credit: c });
      } else if (daysLeft > 0 && daysLeft <= 2) {
        result.push({ id: `48h-${c.id}`, creditId: c.id, title: 'Alerte 48h !', message: `Le remboursement de ${formatMAD(c.montant)} pour ${label} expire dans ${daysLeft} jour(s).`, type: 'warning', daysLeft, credit: c });
      }
    });
    return result;
  }, [credits]);

  const showPopup = (title: string, message: string) => {
    setPopup({ title, message });
  };

  const scheduleNow = async (credit: any) => {
    const granted = await requestPermissions();
    if (!granted) {
      showPopup('Permission requise', 'Activez les notifications dans les paramètres.');
      return;
    }
    await scheduleCreditNotifications(credit);
    showPopup('✅ Notification planifiée', `Rappel programmé pour le crédit de ${credit.prenom}.`);
  };

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: textColor }]}>Alertes & Rappels</Text>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#10b981' }]}>
          <Ionicons name="notifications" size={16} color="#10b981" />
          <Text style={styles.infoText}>
            Notifications push réelles programmées 48h avant et le jour J.
          </Text>
        </View>

        {alerts.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: border }]}>
            <Ionicons name="checkmark-circle" size={40} color="#10b981" />
            <Text style={[styles.emptyText, { color: muted }]}>Aucun rappel critique.</Text>
          </View>
        ) : (
          alerts.map(alert => (
            <View key={alert.id} style={[styles.alertCard, { backgroundColor: alert.type === 'error' ? '#f43f5e15' : '#f59e0b15', borderColor: alert.type === 'error' ? '#f43f5e' : '#f59e0b' }]}>
              <View style={styles.alertHeader}>
                <View style={styles.alertTitleRow}>
                  <Ionicons name={alert.type === 'error' ? 'warning' : 'alarm'} size={18} color={alert.type === 'error' ? '#f43f5e' : '#f59e0b'} />
                  <Text style={[styles.alertTitle, { color: alert.type === 'error' ? '#f43f5e' : '#f59e0b' }]}>{alert.title}</Text>
                </View>
                <View style={[styles.alertBadge, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
                  <Text style={{ color: muted, fontSize: 9, fontWeight: '700' }}>{alert.daysLeft === 0 ? 'JOUR J' : '48H AVANT'}</Text>
                </View>
              </View>
              <Text style={[styles.alertMessage, { color: isDark ? '#e2e8f0' : '#475569' }]}>{alert.message}</Text>
              <View style={styles.popupBtnRow}>
                <TouchableOpacity onPress={() => scheduleNow(alert.credit)} style={[styles.triggerBtn, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: border }]}>
                  <Ionicons name="notifications" size={12} color="#059669" />
                  <Text style={{ color: '#059669', fontSize: 10, fontWeight: '700' }}>Programmer la notif</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showPopup(alert.title, alert.message)} style={[styles.triggerBtn, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: border }]}>
                  <Ionicons name="eye" size={12} color={textColor} />
                  <Text style={{ color: textColor, fontSize: 10, fontWeight: '600' }}>Aperçu</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity onPress={async () => { const g = await requestPermissions(); showPopup(g ? '✅ Permissions OK' : '⚠️ Permissions refusées', g ? 'Les notifications sont activées.' : 'Activez-les dans les paramètres.'); }} style={styles.testBtn}>
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.testBtnText}>Tester les notifications</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Popup Modal */}
      <Modal visible={!!popup} transparent animationType="fade" onRequestClose={() => setPopup(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={[styles.modalIcon, { backgroundColor: '#05966920' }]}>
              <Ionicons name={popup?.title?.includes('✅') ? 'checkmark-circle' : 'notifications'} size={32} color="#059669" />
            </View>
            <Text style={[styles.modalTitle, { color: textColor }]}>{popup?.title}</Text>
            <Text style={[styles.modalMsg, { color: muted }]}>{popup?.message}</Text>
            <TouchableOpacity onPress={() => setPopup(null)} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText: { color: '#10b981', fontSize: 12, fontWeight: '500', flex: 1 },
  emptyBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 13, textAlign: 'center' },
  alertCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertTitle: { fontSize: 14, fontWeight: '800' },
  alertBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  alertMessage: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  popupBtnRow: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end' },
  triggerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  testBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox: { borderRadius: 20, padding: 28, alignItems: 'center', width: '100%', maxWidth: 320 },
  modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  modalMsg: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 10 },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
