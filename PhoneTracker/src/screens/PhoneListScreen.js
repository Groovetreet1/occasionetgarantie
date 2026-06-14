import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Image,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { getAllPhones, exportToCSV, exportToPDF } from "../database/database";
import Colors from "../theme/colors";
import SaleChart from "../components/SaleChart";

const { width } = Dimensions.get("window");

const PAGE_SIZE = 5;

export default function PhoneListScreen({ navigation }) {
  const [phones, setPhones] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | stock | vendus

  const loadPhones = useCallback(() => {
    const data = getAllPhones();
    setPhones(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPhones();
    }, [loadPhones])
  );

  function onRefresh() {
    setRefreshing(true);
    loadPhones();
    setRefreshing(false);
  }

  function getRelicat(phone) {
    if (!phone.salePrice) return null;
    return phone.salePrice - phone.purchasePrice;
  }

  function getPhotos(item) {
  try { return item.photos ? JSON.parse(item.photos) : []; } catch(e) { return []; }
}

function renderPhone({ item }) {
    const relicat = getRelicat(item);
    const isSold = !!item.salePrice;
    const phonePhotos = getPhotos(item);
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("PhoneDetail", { phoneId: item.id })
        }
      >
        <View style={[styles.card, isSold && styles.cardSold]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: isSold ? Colors.accentLight : Colors.primaryLight }]}>
                <Text style={[styles.iconText, { color: isSold ? Colors.accent : Colors.primary }]}>
                  {isSold ? "S" : "P"}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.modelText} numberOfLines={1}>{item.model}</Text>
                <Text style={styles.dateText}>
                  {isSold ? "Vendu" : "Ajouté"} le {item.createdAt?.split("T")[0] || "—"}
                </Text>
              </View>
            </View>
            {relicat !== null && (
              <View style={[styles.relicatBadge, { backgroundColor: relicat >= 0 ? Colors.successLight : Colors.accentLight }]}>
                <Text style={[styles.relicatBadgeText, { color: relicat >= 0 ? Colors.success : Colors.error }]}>
                  {relicat >= 0 ? "+" : ""}{relicat.toFixed(0)}
                </Text>
              </View>
            )}
          </View>
          {phonePhotos.length > 0 && (
            <View style={styles.cardPhotoRow}>
              {phonePhotos.slice(0, 3).map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.cardThumb} />
              ))}
              {phonePhotos.length > 3 && <Text style={styles.morePhotos}>+{phonePhotos.length - 3}</Text>}
            </View>
          )}
          <View style={styles.cardBottom}>
            <View style={styles.priceChip}>
              <Text style={styles.priceChipLabel}>Achat</Text>
              <Text style={styles.priceChipValue}>{item.purchasePrice} DHS</Text>
            </View>
            {isSold && (
              <View style={[styles.priceChip, { backgroundColor: Colors.successLight }]}>
                <Text style={styles.priceChipLabel}>Vente</Text>
                <Text style={[styles.priceChipValue, { color: Colors.success }]}>
                  {item.salePrice} DHS
                </Text>
              </View>
            )}
            {!isSold && (
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>En stock</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function stockValue(list) {
    return list.filter((p) => !p.salePrice).reduce((sum, p) => sum + p.purchasePrice, 0);
  }

  function totalProfit(list) {
    return list.filter((p) => p.salePrice).reduce((sum, p) => sum + (p.salePrice - p.purchasePrice), 0);
  }

  function totalRecovered(list) {
    return list.filter((p) => p.salePrice).reduce((sum, p) => sum + p.salePrice, 0);
  }

  const filteredPhones = phones.filter((p) => {
    const matchesSearch = p.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "stock" && !p.salePrice) ||
      (filterStatus === "vendus" && p.salePrice);
    return matchesSearch && matchesFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filteredPhones.length / PAGE_SIZE));
  const paginatedPhones = filteredPhones.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Occasion&garantie</Text>
            <Text style={styles.headerSub}>{filteredPhones.length} sur {phones.length} téléphone{phones.length !== 1 ? "s" : ""} · Page {currentPage}/{totalPages}</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(true)}>
            <Text style={styles.menuBtnText}>☰</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={paginatedPhones}
        renderItem={renderPhone}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un modèle..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
              />
            </View>
            <View style={styles.filterRow}>
              {[
                { key: "all", label: "Tous" },
                { key: "stock", label: "En stock" },
                { key: "vendus", label: "Vendus" },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterBtn, filterStatus === f.key && styles.filterBtnActive]}
                  onPress={() => { setFilterStatus(f.key); setCurrentPage(1); }}
                >
                  <Text style={[styles.filterBtnText, filterStatus === f.key && styles.filterBtnTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.summaryRow}>
              <LinearGradient
                colors={["#6C63FF", "#8B83FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryLabel}>En stock</Text>
                <Text style={styles.summaryValue}>{stockValue(phones).toFixed(0)}</Text>
                <Text style={styles.summaryUnit}>DHS</Text>
              </LinearGradient>
              <LinearGradient
                colors={["#00C9A7", "#00E5BF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryLabel}>Profit</Text>
                <Text style={styles.summaryValue}>
                  {totalProfit(phones) >= 0 ? "+" : ""}{totalProfit(phones).toFixed(0)}
                </Text>
                <Text style={styles.summaryUnit}>DHS</Text>
              </LinearGradient>
              <LinearGradient
                colors={["#FF6584", "#FF8FA3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryLabel}>Ventes</Text>
                <Text style={styles.summaryValue}>{totalRecovered(phones).toFixed(0)}</Text>
                <Text style={styles.summaryUnit}>DHS</Text>
              </LinearGradient>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyText}>Aucun téléphone</Text>
            <Text style={styles.emptySubtext}>Appuyez sur le menu ☰ pour ajouter</Text>
          </View>
        }
        ListFooterComponent={phones.length > PAGE_SIZE ? (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
              disabled={currentPage === 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>‹ Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Next ›</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.menuModal}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate("AddPhone"); }}>
              <Text style={styles.menuIcon}>➕</Text>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Ajouter un article</Text>
              <Text style={styles.menuItemSub}>Nouveau téléphone en stock</Text>
            </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate("RecentItems"); }}>
              <Text style={styles.menuIcon}>📋</Text>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Derniers articles</Text>
                <Text style={styles.menuItemSub}>Liste complète des téléphones</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              setShowMenu(false);
              try {
                const result = await exportToCSV();
                if (result) Alert.alert("Export CSV", result);
              } catch (e) { Alert.alert("Erreur", e.message); }
            }}>
              <Text style={styles.menuIcon}>📄</Text>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Export CSV</Text>
                <Text style={styles.menuItemSub}>Tableau de données (.csv)</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              setShowMenu(false);
              try {
                const result = await exportToPDF();
                if (result) Alert.alert("Export PDF", result);
              } catch (e) { Alert.alert("Erreur", e.message); }
            }}>
              <Text style={styles.menuIcon}>📑</Text>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Export PDF</Text>
                <Text style={styles.menuItemSub}>Facture récapitulative (.pdf)</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 2 },
  menuBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuBtnText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  summaryLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  summaryUnit: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: -2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardSold: { opacity: 0.85 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: { fontSize: 16, fontWeight: "bold" },
  cardInfo: { flex: 1 },
  modelText: { fontSize: 16, fontWeight: "700", color: Colors.text },
  dateText: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  relicatBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relicatBadgeText: { fontSize: 13, fontWeight: "bold" },
  cardPhotoRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  cardThumb: { width: 48, height: 48, borderRadius: 8 },
  morePhotos: { fontSize: 12, color: Colors.textSecondary, alignSelf: "center" },
  cardBottom: { flexDirection: "row", gap: 8 },
  priceChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
  },
  priceChipLabel: { fontSize: 10, color: Colors.textSecondary },
  priceChipValue: { fontSize: 13, fontWeight: "700", color: Colors.text },
  stockBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  stockText: { fontSize: 11, fontWeight: "700", color: Colors.warning },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: Colors.textSecondary, fontWeight: "600" },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  menuIcon: { fontSize: 24, marginRight: 14, width: 32, textAlign: "center" },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 16, fontWeight: "600", color: Colors.text },
  menuItemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.text },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.gradientStart, borderColor: Colors.gradientStart },
  filterBtnText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  filterBtnTextActive: { color: "#fff" },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  pageBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  pageBtnTextDisabled: { color: Colors.textSecondary },
  pageInfo: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
});
