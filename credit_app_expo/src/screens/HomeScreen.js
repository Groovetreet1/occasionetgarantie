import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getEnCoursCredits, getStats, deleteCredit, getPayesCredits } from '../database/database';
import CreditCard from '../components/CreditCard';
import StatCard from '../components/StatCard';
import PieChart from '../components/PieChart';
import EmptyState from '../components/EmptyState';

export default function HomeScreen({ navigation }) {
  const [credits, setCredits] = useState([]);
  const [stats, setStats] = useState({ totalEnCours: 0, totalPaye: 0, nbEnCours: 0, nbPaye: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('en_cours'); // 'en_cours' or 'payes'

  const loadData = useCallback(async () => {
    const list = filter === 'payes' ? await getPayesCredits() : await getEnCoursCredits();
    const s = await getStats();
    setCredits(list);
    setStats(s);
  }, [filter]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (credit) => {
    Alert.alert(
      'Supprimer',
      `Supprimer le crédit avec ${credit.nomComplet} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCredit(credit.id);
            loadData();
          },
        },
      ]
    );
  };

  const chartData = credits.reduce((acc, c) => {
    const key = c.nomComplet;
    const existing = acc.find((i) => i.label === key);
    if (existing) existing.value += c.montant;
    else acc.push({ label: key, value: c.montant });
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.nightBlue, COLORS.nightBlueLight]}
        style={styles.header}
      >
        <Text style={styles.greeting}>Maîtresse des Crédits</Text>
        <Text style={styles.title}>MAD Crédits</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="En cours"
            value={`${stats.totalEnCours.toFixed(0)} MAD`}
            color={COLORS.emerald}
          />
          <View style={{ width: 10 }} />
          <StatCard
            label="Payés"
            value={`${stats.totalPaye.toFixed(0)} MAD`}
            color={COLORS.teal}
          />
        </View>
        <View style={styles.countsRow}>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{stats.nbEnCours}</Text>
            <Text style={styles.countLabel}>en cours</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{stats.nbPaye}</Text>
            <Text style={styles.countLabel}>payés</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Pie chart */}
      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Répartition</Text>
          <PieChart data={chartData} />
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'en_cours' && styles.filterActive]}
          onPress={() => setFilter('en_cours')}
        >
          <Text style={[styles.filterText, filter === 'en_cours' && styles.filterTextActive]}>En cours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'payes' && styles.filterActive]}
          onPress={() => setFilter('payes')}
        >
          <Text style={[styles.filterText, filter === 'payes' && styles.filterTextActive]}>Payés</Text>
        </TouchableOpacity>
      </View>

      {/* Credit list */}
      <FlatList
        data={credits}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CreditCard
            credit={item}
            onPress={(c) => navigation.navigate('Detail', { creditId: c.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title={filter === 'payes' ? 'Aucun crédit payé' : 'Aucun crédit en cours'}
            subtitle="Ajoutez votre premier crédit avec le bouton +"
          />
        }
        contentContainerStyle={credits.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCredit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row' },
  countsRow: { flexDirection: 'row', marginTop: 10, gap: 12 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  countNumber: { fontSize: 16, fontWeight: '700', color: '#fff', marginRight: 4 },
  countLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  chartContainer: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  filterRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#E8EAF6', borderRadius: 12, padding: 3,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  filterActive: { backgroundColor: '#fff' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  filterTextActive: { color: COLORS.nightBlue, fontWeight: '600' },
  list: { paddingBottom: 100, paddingTop: 8 },
  emptyList: { flexGrow: 1 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.nightBlue,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', marginTop: -2 },
});
