import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../theme/colors";

const { width } = Dimensions.get("window");

export default function SaleModal({ visible, phone, onClose }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!phone || !phone.salePrice) return null;

  const profit = phone.salePrice - phone.purchasePrice;
  const isProfit = profit >= 0;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={["#6C63FF", "#FF6584"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Vendu !</Text>
            </View>
            <Text style={styles.modelText}>{phone.model}</Text>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix d'achat</Text>
              <Text style={styles.priceValue}>{phone.purchasePrice} DHS</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix de vente</Text>
              <Text style={styles.priceValue}>{phone.salePrice} DHS</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.profitLabel}>Profit réalisé</Text>
            <Text style={[styles.profitValue, { color: isProfit ? Colors.success : Colors.error }]}>
              {isProfit ? "+" : ""}{profit.toFixed(0)} DHS
            </Text>
          </LinearGradient>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width - 48,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: 28,
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  modelText: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 12 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  priceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  priceValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  profitLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  profitValue: { fontSize: 32, fontWeight: "bold", marginTop: 4 },
  closeButton: {
    backgroundColor: Colors.surface,
    padding: 16,
    alignItems: "center",
  },
  closeText: { color: Colors.primary, fontSize: 16, fontWeight: "700" },
});
