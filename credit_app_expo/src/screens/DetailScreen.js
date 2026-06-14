import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { getCreditById, marquerPaye, deleteCredit } from '../database/database';

export default function DetailScreen({ route, navigation }) {
  const { creditId } = route.params;
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadCredit();
  }, [creditId]));

  const loadCredit = async () => {
    setLoading(true);
    const c = await getCreditById(creditId);
    setCredit(c);
    setLoading(false);
  };

  const handleMarkPaid = () => {
    Alert.alert(
      'Marquer comme payé',
      `Confirmer le paiement de ${credit.montant.toFixed(2)} MAD par ${credit.nomComplet} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await marquerPaye(creditId);
            loadCredit();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      `Supprimer ce crédit avec ${credit?.nomComplet} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCredit(creditId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.nightBlue} />
      </View>
    );
  }

  if (!credit) {
    return (
      <View style={styles.loading}>
        <Text>Crédit introuvable</Text>
      </View>
    );
  }

  const isOverdue = !credit.estPaye && credit.dateEcheance < Date.now();
  const dateCreation = new Date(credit.dateCreation).toLocaleDateString('fr-FR');
  const dateEcheance = new Date(credit.dateEcheance).toLocaleDateString('fr-FR');

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.nightBlue, COLORS.nightBlueLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + montant */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatar, {
            backgroundColor: credit.estPaye ? '#00C85320' : isOverdue ? '#FF174420' : '#00C85320',
          }]}>
            <Text style={[styles.avatarText, {
              color: credit.estPaye ? COLORS.paidGreen : isOverdue ? COLORS.overdueRed : COLORS.emerald,
            }]}>
              {credit.prenom[0]}{credit.nom[0]}
            </Text>
          </View>
          <Text style={styles.fullName}>{credit.nomComplet}</Text>
          <Text style={[styles.amount, {
            color: credit.estPaye ? COLORS.paidGreen : isOverdue ? COLORS.overdueRed : COLORS.nightBlue,
          }]}>
            {credit.montant.toFixed(2)} MAD
          </Text>
          <View style={[styles.statusBadge, {
            backgroundColor: credit.estPaye ? '#00C85320' : isOverdue ? '#FF174420' : '#FF980020',
          }]}>
            <Text style={[styles.statusText, {
              color: credit.estPaye ? COLORS.paidGreen : isOverdue ? COLORS.overdueRed : COLORS.pendingOrange,
            }]}>
              {credit.estPaye ? '✓ Payé' : isOverdue ? '⚠ En retard' : '◷ En cours'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <DetailRow icon="📅" label="Date de création" value={dateCreation} />
          <View style={styles.divider} />
          <DetailRow icon="⏰" label="Date d'échéance" value={dateEcheance} />
          <View style={styles.divider} />
          <DetailRow icon="💰" label="Montant" value={`${credit.montant.toFixed(2)} MAD`} />
        </View>

        {/* Action button */}
        {!credit.estPaye && (
          <TouchableOpacity style={styles.payBtn} onPress={handleMarkPaid}>
            <Text style={styles.payBtnText}>✓ Marquer comme payé</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={detailRowStyles.row}>
      <Text style={detailRowStyles.icon}>{icon}</Text>
      <View style={detailRowStyles.textContainer}>
        <Text style={detailRowStyles.label}>{label}</Text>
        <Text style={detailRowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  icon: { fontSize: 22, marginRight: 12 },
  textContainer: { flex: 1 },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  backBtn: {},
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  deleteBtn: { padding: 4 },
  deleteText: { fontSize: 20 },
  content: { padding: 16, paddingBottom: 40 },
  avatarCard: {
    alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  fullName: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  amount: { fontSize: 32, fontWeight: '700', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: '600' },
  detailCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  payBtn: {
    backgroundColor: COLORS.paidGreen, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', shadowColor: COLORS.paidGreen, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
