import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, useColorScheme, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCredits } from '@/src/context/CreditsContext';
import { router, useLocalSearchParams } from 'expo-router';
import { CreditType } from '@/src/types';
import { cancelCreditNotifications, scheduleCreditNotifications, requestPermissions } from '@/src/services/notifications';

export default function EditCreditScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { credits, updateCredit } = useCredits();
  const { id } = useLocalSearchParams<{ id: string }>();

  const credit = credits.find(c => c.id === id);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [montant, setMontant] = useState('');
  const [type, setType] = useState<CreditType>('DETTE');
  const [dateEcheance, setDateEcheance] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (credit) {
      setNom(credit.nom);
      setPrenom(credit.prenom);
      setMontant(String(credit.montant));
      setType(credit.type);
      setDateEcheance(credit.dateEcheance);
      setDescription(credit.description || '');
    }
  }, [credit]);

  if (!credit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 16 }}>Crédit introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: '#059669', padding: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (!nom.trim() || !prenom.trim()) {
      setError('Veuillez remplir le nom et le prénom.'); return;
    }
    const amount = parseFloat(montant);
    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être un nombre supérieur à 0.'); return;
    }
    if (!dateEcheance) {
      setError("Veuillez sélectionner une date d'échéance."); return;
    }
    await cancelCreditNotifications(id);
    const granted = await requestPermissions();
    if (granted) {
      const updated = { ...credit, ...{ nom: nom.trim(), prenom: prenom.trim(), montant: amount, type, dateEcheance, description: description.trim() || undefined } };
      await scheduleCreditNotifications(updated as any);
    }
    updateCredit(id, {
      nom: nom.trim(), prenom: prenom.trim(), montant: amount,
      type, dateEcheance, description: description.trim() || undefined,
    });
    Alert.alert('✅ Modifié', `Le crédit de ${amount} MAD pour ${prenom} a été mis à jour.`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Modifier le crédit</Text>
          <View style={{ width: 22 }} />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-triangle" size={16} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: textColor }]}>Nature du crédit</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity onPress={() => setType('DETTE')}
            style={[styles.typeChip, { backgroundColor: type === 'DETTE' ? '#f43f5e20' : inputBg, borderColor: type === 'DETTE' ? '#f43f5e' : border }]}>
            <Text style={{ color: type === 'DETTE' ? '#f43f5e' : textColor, fontWeight: '700', fontSize: 13 }}>Dette</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setType('PRET')}
            style={[styles.typeChip, { backgroundColor: type === 'PRET' ? '#10b98120' : inputBg, borderColor: type === 'PRET' ? '#10b981' : border }]}>
            <Text style={{ color: type === 'PRET' ? '#10b981' : textColor, fontWeight: '700', fontSize: 13 }}>Prêt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: textColor }]}>Prénom</Text>
            <TextInput placeholderTextColor="#94a3b8" value={prenom} onChangeText={setPrenom}
              style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: textColor }]} />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: textColor }]}>Nom</Text>
            <TextInput placeholderTextColor="#94a3b8" value={nom} onChangeText={setNom}
              style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: textColor }]} />
          </View>
        </View>

        <Text style={[styles.label, { color: textColor }]}>Montant (MAD)</Text>
        <TextInput placeholderTextColor="#94a3b8" value={montant} onChangeText={setMontant} keyboardType="decimal-pad"
          style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: textColor, fontFamily: 'monospace', fontWeight: '700' }]} />

        <Text style={[styles.label, { color: textColor }]}>Date d'échéance</Text>
        <TextInput placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={dateEcheance} onChangeText={setDateEcheance}
          style={[styles.input, { backgroundColor: inputBg, borderColor: '#059669', color: textColor, fontWeight: '700' }]} />

        <Text style={[styles.label, { color: textColor }]}>Notes</Text>
        <TextInput placeholderTextColor="#94a3b8" value={description} onChangeText={setDescription} multiline numberOfLines={3}
          style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: textColor, minHeight: 70, textAlignVertical: 'top' }]} />

        <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
          <Ionicons name="save" size={18} color="#fff" />
          <Text style={styles.submitText}>Enregistrer les modifications</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '900' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f43f5e20', borderWidth: 1, borderColor: '#f43f5e', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: '#f43f5e', fontSize: 12, fontWeight: '600', flex: 1 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '500' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, marginTop: 24 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
