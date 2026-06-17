import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllCredits } from '../database/database';
import CreditCard from '../components/CreditCard';

export default function CalendarScreen({ navigation }) {
  const [credits, setCredits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useFocusEffect(useCallback(() => {
    loadCredits();
  }, []));

  const loadCredits = async () => {
    const all = await getAllCredits();
    setCredits(all);
  };

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const getEventsForDate = (day) => {
    const dateStart = new Date(currentYear, currentMonth, day).getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return credits.filter((c) => {
      return c.dateEcheance >= dateStart && c.dateEcheance < dateEnd && !c.estPaye;
    });
  };

  const selectedEvents = credits.filter((c) => {
    const d = new Date(selectedDate);
    const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return c.dateEcheance >= dateStart && c.dateEcheance < dateEnd;
  });

  const isSelectedDay = (day) => {
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentMonth &&
           selectedDate.getFullYear() === currentYear;
  };

  const calendarDays = [];
  const today = new Date();

  // Empty cells before first day
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    calendarDays.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const events = getEventsForDate(day);
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const selected = isSelectedDay(day);

    calendarDays.push(
      <TouchableOpacity
        key={day}
        style={[styles.dayCell, selected && styles.daySelected]}
        onPress={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
      >
        <Text style={[styles.dayNumber, isToday && styles.dayToday, selected && styles.daySelectedText]}>
          {day}
        </Text>
        {events.length > 0 && (
          <View style={[styles.dot, selected && styles.dotSelected]} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.nightBlue, COLORS.nightBlueLight]} style={styles.header}>
        <Text style={styles.title}>Calendrier</Text>
      </LinearGradient>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
          } else setCurrentMonth(currentMonth - 1);
        }}>
          <Text style={styles.navArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={() => {
          if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
          } else setCurrentMonth(currentMonth + 1);
        }}>
          <Text style={styles.navArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={styles.weekRow}>
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((d) => (
          <View key={d} style={styles.dayCell}>
            <Text style={styles.weekDay}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays}
      </View>

      {/* Events for selected day */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          Événements du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <FlatList
        data={selectedEvents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CreditCard
            credit={item}
            onPress={(c) => navigation.navigate('Detail', { creditId: c.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.noEvents}>
            <Text style={styles.noEventsText}>Aucune échéance ce jour</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff',
  },
  navArrow: { fontSize: 22, color: COLORS.nightBlue, padding: 8 },
  monthTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  weekRow: { flexDirection: 'row', backgroundColor: '#fff', paddingBottom: 4 },
  weekDay: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#fff', paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dayCell: {
    width: '14.28%', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6,
  },
  dayNumber: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  dayToday: { color: COLORS.emerald, fontWeight: '700' },
  daySelected: { backgroundColor: COLORS.nightBlue, borderRadius: 20, paddingVertical: 6 },
  daySelectedText: { color: '#fff', fontWeight: '700' },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.overdueRed, marginTop: 2,
  },
  dotSelected: { backgroundColor: '#fff' },
  eventsSection: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  eventsTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  noEvents: { padding: 24, alignItems: 'center' },
  noEventsText: { fontSize: 14, color: '#9CA3AF' },
});
