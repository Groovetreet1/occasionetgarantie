import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, useColorScheme, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCredits } from '@/src/context/CreditsContext';
import { formatMAD, formatDateString, getDaysRemaining } from '@/src/utils';

type FilterType = 'ALL' | 'DETTE' | 'PRET';
type SortBy = 'DATE_ECHEANCE' | 'MONTANT';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { credits, deleteCredit, togglePaye } = useCredits();

  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('DATE_ECHEANCE');
  const [sortAsc, setSortAsc] = useState(true);

  const totalDettes = credits.filter(c => !c.paye && c.type === 'DETTE').reduce((s, c) => s + c.montant, 0);
  const totalPrets = credits.filter(c => !c.paye && c.type === 'PRET').reduce((s, c) => s + c.montant, 0);
  const totalActif = totalPrets - totalDettes;
  const payeCount = credits.filter(c => c.paye).length;
  const nonPayeCount = credits.filter(c => !c.paye).length;

  const filtered = useMemo(() => {
    return credits
      .filter(c => {
        const q = searchQuery.toLowerCase();
        const matchSearch = `${c.prenom} ${c.nom} ${c.description || ''}`.toLowerCase().includes(q);
        const matchType = filterType === 'ALL' || c.type === filterType;
        return matchSearch && matchType;
      })
      .sort((a, b) => {
        const diff = sortBy === 'DATE_ECHEANCE'
          ? new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime()
          : a.montant - b.montant;
        return sortAsc ? diff : -diff;
      });
  }, [credits, filterType, searchQuery, sortBy, sortAsc]);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Supprimer', `Supprimer le crédit de ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteCredit(id) },
    ]);
  };

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>MAD Crédits</Text>
        <Text style={[styles.subtitle, { color: muted }]}>Gestion intelligente des dettes et prêts</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#0f172a', borderColor: '#059669' }]}>
            <Text style={styles.summaryLabel}>ACTIF NET</Text>
            <Text style={styles.summaryValue}>{formatMAD(totalActif)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCardSmall, { backgroundColor: isDark ? '#1e293b' : '#fef2f2', borderColor: '#f43f5e' }]}>
            <Text style={[styles.summaryLabelSmall, { color: '#f43f5e' }]}>Dettes</Text>
            <Text style={[styles.summaryValueSmall, { color: '#f43f5e' }]}>{formatMAD(totalDettes)}</Text>
          </View>
          <View style={[styles.summaryCardSmall, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#10b981' }]}>
            <Text style={[styles.summaryLabelSmall, { color: '#10b981' }]}>Prêts</Text>
            <Text style={[styles.summaryValueSmall, { color: '#10b981' }]}>{formatMAD(totalPrets)}</Text>
          </View>
        </View>

        {/* Status badges */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={[styles.statusText, { color: '#10b981' }]}>Remboursés: {payeCount}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#f43f5e20', borderColor: '#f43f5e' }]}>
            <Ionicons name="alert-circle" size={14} color="#f43f5e" />
            <Text style={[styles.statusText, { color: '#f43f5e' }]}>En cours: {nonPayeCount}</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(['ALL', 'DETTE', 'PRET'] as FilterType[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setFilterType(t)}
              style={[
                styles.filterChip,
                { backgroundColor: filterType === t ? '#059669' : isDark ? '#1e293b' : '#e2e8f0', borderColor: filterType === t ? '#059669' : border }
              ]}
            >
              <Text style={[styles.filterChipText, { color: filterType === t ? '#fff' : textColor }]}>
                {t === 'ALL' ? 'Tout' : t === 'DETTE' ? 'Dettes' : 'Prêts'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: border }]}>
          <Ionicons name="search" size={16} color={muted} />
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor={muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: textColor }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sort */}
        <TouchableOpacity
          onPress={() => { if (sortBy === 'DATE_ECHEANCE') setSortBy('MONTANT'); else { setSortBy('DATE_ECHEANCE'); setSortAsc(!sortAsc); } }}
          style={styles.sortRow}
        >
          <Text style={[styles.sortText, { color: muted }]}>
            Tri: {sortBy === 'DATE_ECHEANCE' ? 'Échéance' : 'Montant'} ({sortAsc ? '↑' : '↓'})
          </Text>
        </TouchableOpacity>

        {/* Credit List */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>DÉTAIL DES ÉCHÉANCES</Text>
        {filtered.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: border }]}>
            <Text style={{ color: muted }}>Aucune transaction trouvée.</Text>
          </View>
        ) : (
          filtered.map(c => {
            const daysLeft = getDaysRemaining(c.dateEcheance);
            const isOverdue = daysLeft < 0 && !c.paye;
            const isClose = daysLeft >= 0 && daysLeft <= 2 && !c.paye;
            return (
              <View
                key={c.id}
                style={[
                  styles.creditCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: c.paye ? (isDark ? '#334155' : '#e2e8f0') : isOverdue ? '#f43f5e' : isClose ? '#f59e0b' : border,
                    opacity: c.paye ? 0.6 : 1,
                  }
                ]}
              >
                <View style={styles.creditLeft}>
                  <View style={styles.creditNameRow}>
                    <Text style={[styles.creditName, { color: c.paye ? muted : textColor, textDecorationLine: c.paye ? 'line-through' : 'none' }]}>
                      {c.prenom} {c.nom}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: c.type === 'DETTE' ? '#f43f5e20' : '#10b98120' }]}>
                      <Text style={[styles.typeBadgeText, { color: c.type === 'DETTE' ? '#f43f5e' : '#10b981' }]}>
                        {c.type === 'DETTE' ? 'Doit' : 'Prêt'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.creditMeta}>
                    <Text style={{ color: muted, fontSize: 11 }}>{formatDateString(c.dateEcheance)}</Text>
                    {!c.paye && (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isOverdue ? '#f43f5e' : isClose ? '#f59e0b' : muted, marginLeft: 8 }}>
                        {isOverdue ? 'Retard' : isClose ? 'Alerte !' : `${daysLeft}j`}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.creditRight}>
                  <Text style={[styles.creditAmount, { color: c.paye ? muted : c.type === 'DETTE' ? '#f43f5e' : '#10b981', textDecorationLine: c.paye ? 'line-through' : 'none' }]}>
                    {c.type === 'DETTE' ? '-' : '+'}{formatMAD(c.montant)}
                  </Text>
                    <View style={styles.creditActions}>
                    <TouchableOpacity onPress={() => router.push(`/(tabs)/edit?id=${c.id}`)} style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                      <Ionicons name="pencil" size={13} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => togglePaye(c.id)} style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                      <Ionicons name={c.paye ? 'refresh' : 'checkmark'} size={14} color={c.paye ? '#10b981' : textColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(c.id, `${c.prenom} ${c.nom}`)} style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                      <Ionicons name="trash-outline" size={14} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginBottom: 20, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryCard: {
    flex: 1, borderWidth: 1, borderRadius: 16, padding: 16,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' },
  summaryValue: { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 4 },
  summaryCardSmall: {
    flex: 1, borderWidth: 1, borderRadius: 14, padding: 12,
  },
  summaryLabelSmall: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  summaryValueSmall: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500' },
  sortRow: { marginBottom: 12 },
  sortText: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  emptyBox: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
    padding: 24, alignItems: 'center',
  },
  creditCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  creditLeft: { flex: 1, marginRight: 8 },
  creditNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  creditName: { fontSize: 13, fontWeight: '700' },
  typeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: '800' },
  creditMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  creditRight: { alignItems: 'flex-end' },
  creditAmount: { fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },
  creditActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  actionBtn: { borderRadius: 8, padding: 6 },
});
