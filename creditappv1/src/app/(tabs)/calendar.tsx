import { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCredits } from '@/src/context/CreditsContext';
import { formatMAD, formatDateString, getDaysRemaining } from '@/src/utils';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function CalendarScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { credits } = useCredits();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const daysInMonth = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;
    const total = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const dateStr = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const creditsOnDate = (day: number | null) => {
    if (!day) return [];
    return credits.filter(c => c.dateEcheance === dateStr(day));
  };

  const selectedCredits = selected ? credits.filter(c => c.dateEcheance === selected) : [];

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: textColor }]}>Échéancier</Text>

        {/* Month Navigator */}
        <View style={[styles.monthNav, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: textColor }]}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Day names */}
        <View style={styles.dayNamesRow}>
          {DAYS.map(d => (
            <Text key={d} style={[styles.dayName, { color: muted }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={[styles.calendarGrid, { backgroundColor: cardBg, borderColor: border }]}>
          {daysInMonth.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={styles.dayCell} />;
            const ds = dateStr(day);
            const dueCredits = creditsOnDate(day);
            const isToday = ds === today;
            const isSelected = ds === selected;
            return (
              <TouchableOpacity
                key={ds}
                onPress={() => setSelected(ds === selected ? null : ds)}
                style={[
                  styles.dayCell,
                  isToday && { backgroundColor: '#059669' },
                  isSelected && !isToday && { backgroundColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1, borderColor: '#059669' },
                ]}
              >
                <Text style={[styles.dayNumber, { color: isToday ? '#fff' : textColor }]}>
                  {day}
                </Text>
                {dueCredits.length > 0 && (
                  <View style={styles.dots}>
                    {dueCredits.slice(0, 3).map(c => (
                      <View
                        key={c.id}
                        style={[
                          styles.dot,
                          { backgroundColor: c.paye ? muted : c.type === 'DETTE' ? '#f43f5e' : '#10b981' }
                        ]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected date details */}
        {selected && (
          <View style={[styles.selectedDetail, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.detailTitle, { color: textColor }]}>
              Échéances du {formatDateString(selected)}
            </Text>
            {selectedCredits.length === 0 ? (
              <Text style={{ color: muted, fontSize: 13, marginTop: 8 }}>Aucune échéance à cette date.</Text>
            ) : (
              selectedCredits.map(c => (
                <View key={c.id} style={[styles.detailRow, { borderColor: border }]}>
                  <View>
                    <Text style={[styles.detailName, { color: textColor }]}>{c.prenom} {c.nom}</Text>
                    <Text style={{ color: muted, fontSize: 11 }}>{c.type === 'DETTE' ? 'Dette' : 'Prêt'}{c.paye ? ' - Remboursé' : ''}</Text>
                  </View>
                  <Text style={[styles.detailAmount, { color: c.type === 'DETTE' ? '#f43f5e' : '#10b981' }]}>
                    {c.type === 'DETTE' ? '-' : '+'}{formatMAD(c.montant)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 16 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12,
  },
  navBtn: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: '700' },
  dayNamesRow: {
    flexDirection: 'row', marginBottom: 4, paddingHorizontal: 4,
  },
  dayName: {
    flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderWidth: 1, borderRadius: 16, padding: 4, marginBottom: 16,
  },
  dayCell: {
    width: '14.28%', aspectRatio: 1, justifyContent: 'center',
    alignItems: 'center', borderRadius: 10,
  },
  dayNumber: { fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  selectedDetail: {
    borderWidth: 1, borderRadius: 14, padding: 16,
  },
  detailTitle: { fontSize: 13, fontWeight: '700' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderTopWidth: 1, paddingVertical: 10, marginTop: 8,
  },
  detailName: { fontSize: 14, fontWeight: '600' },
  detailAmount: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
});
