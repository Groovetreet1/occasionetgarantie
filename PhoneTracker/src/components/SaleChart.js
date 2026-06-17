import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../theme/colors";

export default function SaleChart({ phones }) {
  if (phones.length === 0) return null;

  const stock = phones.filter((p) => !p.salePrice).reduce((s, p) => s + p.purchasePrice, 0);
  const profit = phones.filter((p) => p.salePrice).reduce((s, p) => s + (p.salePrice - p.purchasePrice), 0);
  const ventes = phones.filter((p) => p.salePrice).reduce((s, p) => s + p.salePrice, 0);
  const maxVal = Math.max(stock, Math.abs(profit), ventes, 1);

  const Bar = ({ label, value, color }) => (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${(Math.abs(value) / maxVal) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value.toFixed(0)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistiques</Text>
      <View style={styles.chartBox}>
        <Bar label="Stock" value={stock} color="#6C63FF" />
        <Bar label="Profit" value={profit} color="#00C9A7" />
        <Bar label="Ventes" value={ventes} color="#FF6584" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: { fontSize: 15, fontWeight: "700", color: Colors.text },
  chartBox: { marginTop: 12, gap: 10 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 50, fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 9,
    overflow: "hidden",
  },
  barFill: { height: 18, borderRadius: 9, minWidth: 4 },
  barValue: { width: 55, fontSize: 12, fontWeight: "700", color: Colors.text, textAlign: "right" },
});
