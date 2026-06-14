import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllPhones } from "../database/database";
import Colors from "../theme/colors";

export default function RecentItemsScreen({ navigation }) {
  const [phones, setPhones] = useState([]);

  const load = useCallback(() => setPhones(getAllPhones()), []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function renderRow({ item, index }) {
    const profit = item.salePrice ? item.salePrice - item.purchasePrice : null;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("PhoneDetail", { phoneId: item.id })}
        style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
      >
        <Text style={[styles.td, styles.colNum]}>{index + 1}</Text>
        <Text style={[styles.td, styles.colModel]} numberOfLines={1}>{item.model}</Text>
        <Text style={[styles.td, styles.colPrice]}>{item.purchasePrice.toFixed(0)}</Text>
        <Text style={[styles.td, styles.colPrice]}>{item.salePrice ? item.salePrice.toFixed(0) : "—"}</Text>
        <Text style={[styles.td, styles.colProfit, { color: profit !== null ? (profit >= 0 ? Colors.success : Colors.error) : Colors.textSecondary }]}>
          {profit !== null ? (profit >= 0 ? "+" : "") + profit.toFixed(0) : "—"}
        </Text>
        <Text style={[styles.td, styles.colDate]}>{(item.createdAt || "").split("T")[0]?.slice(5) || "—"}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colNum]}>#</Text>
        <Text style={[styles.th, styles.colModel]}>Modèle</Text>
        <Text style={[styles.th, styles.colPrice]}>Achat</Text>
        <Text style={[styles.th, styles.colPrice]}>Vente</Text>
        <Text style={[styles.th, styles.colProfit]}>Profit</Text>
        <Text style={[styles.th, styles.colDate]}>Date</Text>
      </View>
      <FlatList
        data={phones}
        renderItem={renderRow}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyText}>Aucun article</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: Colors.gradientStart,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  th: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  tableRowAlt: { backgroundColor: Colors.surfaceAlt },
  td: { fontSize: 12, color: Colors.text },
  colNum: { width: 28, fontWeight: "600" },
  colModel: { flex: 2.5 },
  colPrice: { flex: 1.2, textAlign: "right" },
  colProfit: { flex: 1.2, textAlign: "right", fontWeight: "600" },
  colDate: { flex: 1, textAlign: "right" },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: Colors.textSecondary, fontWeight: "600" },
});
