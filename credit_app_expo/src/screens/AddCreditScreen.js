import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { insertCredit } from '../database/database';
import { scheduleReminder } from '../notifications/reminder';

export default function AddCreditScreen({ navigation }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [montant, setMontant] = useState('');
  const [dateEcheance, setDateEcheance] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nom.trim() || !prenom.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et le prénom');
      return;
    }
    const montantNum = parseFloat(montant.replace(',', '.'));
    if (isNaN(montantNum) || montantNum <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }

    setSaving(true);
    try {
      const credit = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        montant: montantNum,
        dateEcheance: dateEcheance.getTime(),
        dateCreation: Date.now(),
        estPaye: false,
        dateRappel: dateEcheance.getTime() - 2 * 24 * 60 * 60 * 1000,
      };
      const id = await insertCredit(credit);

      // Schedule notification
      try {
        await scheduleReminder({ ...credit, id });
      } catch (e) {
        console.log('Notification scheduling failed:', e);
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.nightBlue, COLORS.nightBlueLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau crédit</Text>
      </LinearGradient>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du débiteur</Text>

          <View style={styles.nameRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Ex: Benali"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.halfInput}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={prenom}
                onChangeText={setPrenom}
                placeholder="Ex: Ahmed"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Text style={styles.label}>Montant</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={montant}
              onChangeText={setMontant}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>MAD</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date d'échéance</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>
              {dateEcheance.toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateEcheance}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDateEcheance(selectedDate);
              }}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Enregistrement...' : 'Enregistrer le crédit'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  form: { flex: 1, padding: 16 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  nameRow: { flexDirection: 'row', marginBottom: 12 },
  halfInput: { flex: 1 },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    backgroundColor: '#F9FAFB', color: COLORS.textPrimary,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountInput: { flex: 1 },
  currency: { fontSize: 16, fontWeight: '700', color: COLORS.nightBlue, marginLeft: 10 },
  dateBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  dateText: { fontSize: 16, color: COLORS.textPrimary },
  dateIcon: { fontSize: 20 },
  saveBtn: {
    backgroundColor: COLORS.nightBlue, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: COLORS.nightBlue, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
