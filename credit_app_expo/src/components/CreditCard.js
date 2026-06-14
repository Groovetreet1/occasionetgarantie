import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

export default function CreditCard({ credit, onPress }) {
  const isOverdue = !credit.estPaye && credit.dateEcheance < Date.now();
  const dateStr = new Date(credit.dateEcheance).toLocaleDateString('fr-FR');

  return (
    <TouchableOpacity
      style={[styles.card, isOverdue && styles.cardOverdue]}
      onPress={() => onPress?.(credit)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: credit.estPaye
                ? '#00C85320'
                : isOverdue
                ? '#FF174420'
                : '#FF980020',
            },
          ]}
        >
          <Text style={[styles.iconText, { color: credit.estPaye ? COLORS.paidGreen : isOverdue ? COLORS.overdueRed : COLORS.pendingOrange }]}>
            {credit.prenom[0]}{credit.nom[0]}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{credit.nomComplet}</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Échéance: </Text>
          <Text style={[styles.dateValue, isOverdue && styles.dateOverdue]}>{dateStr}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: credit.estPaye ? COLORS.paidGreen : COLORS.nightBlue }]}>
          {credit.montant.toFixed(2)}
        </Text>
        <Text style={styles.currency}>MAD</Text>
        <View style={[styles.badge, {
          backgroundColor: credit.estPaye ? '#00C85320' : isOverdue ? '#FF174420' : '#FF980020',
        }]}>
          <Text style={[styles.badgeText, {
            color: credit.estPaye ? COLORS.paidGreen : isOverdue ? COLORS.overdueRed : COLORS.pendingOrange,
          }]}>
            {credit.estPaye ? 'Payé' : isOverdue ? 'Retard' : 'En cours'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.overdueRed,
  },
  iconContainer: { marginRight: 12 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontSize: 12, color: COLORS.textSecondary },
  dateValue: { fontSize: 12, color: COLORS.textSecondary },
  dateOverdue: { color: COLORS.overdueRed, fontWeight: '600' },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: '700' },
  currency: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
