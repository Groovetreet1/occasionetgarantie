import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { getPhoneById, updatePhone, deletePhone, savePhoto } from "../database/database";
import Colors from "../theme/colors";
import SaleModal from "../components/SaleModal";

export default function PhoneDetailScreen({ route, navigation }) {
  const { phoneId } = route.params;
  const [model, setModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [phone, setPhone] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [justSold, setJustSold] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    const p = getPhoneById(phoneId);
    if (p) {
      setPhone(p);
      setModel(p.model);
      setPurchasePrice(p.purchasePrice.toString());
      setSalePrice(p.salePrice ? p.salePrice.toString() : "");
      setNotes(p.notes || "");
      setPhotos(p.photos ? JSON.parse(p.photos) : []);
    }
  }, [phoneId]);

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission", "Autorisation d'accès à la caméra requise.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const saved = await savePhoto(result.assets[0].uri);
        setPhotos([...photos, saved]);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer la photo: " + e.message);
    }
  }

  async function pickFromGallery() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission", "Autorisation d'accès à la galerie requise.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const savedUris = await Promise.all(result.assets.map((a) => savePhoto(a.uri)));
        setPhotos([...photos, ...savedUris]);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer la photo: " + e.message);
    }
  }

  function handleUpdate() {
    try {
      if (!model.trim()) {
        Alert.alert("Erreur", "Veuillez entrer le modèle.");
        return;
      }
      if (!purchasePrice || isNaN(parseFloat(purchasePrice))) {
        Alert.alert("Erreur", "Prix d'achat invalide.");
        return;
      }
      const sp = salePrice ? parseFloat(salePrice) : null;
      updatePhone(
        phoneId,
        model.trim(),
        parseFloat(purchasePrice),
        sp,
        notes.trim(),
        photos
      );
      const updated = getPhoneById(phoneId);
      if (!updated) {
        Alert.alert("Erreur", "Téléphone introuvable après sauvegarde.");
        return;
      }
      setPhone(updated);
      if (sp && !phone?.salePrice) {
        setJustSold(updated);
        setShowSaleModal(true);
      } else {
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer: " + e.message);
    }
  }

  function handleDelete() {
    Alert.alert("Confirmer", "Supprimer ce téléphone ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          deletePhone(phoneId);
          navigation.goBack();
        },
      },
    ]);
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  const relicat =
    phone && phone.salePrice
      ? (phone.salePrice - phone.purchasePrice).toFixed(2)
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {relicat !== null && (
          <LinearGradient
            colors={
              parseFloat(relicat) >= 0
                ? ["#00C9A7", "#00E5BF"]
                : ["#FF6584", "#FF8FA3"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.relicatBanner}
          >
            <Text style={styles.relicatLabel}>Profit réalisé</Text>
            <Text style={styles.relicatValue}>
              {parseFloat(relicat) >= 0 ? "+" : ""}
              {relicat} DHS
            </Text>
          </LinearGradient>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Modèle du téléphone</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Prix d'achat (DHS)</Text>
          <TextInput
            style={styles.input}
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            keyboardType="decimal-pad"
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Prix de vente (DHS)</Text>
          <TextInput
            style={[
              styles.input,
              salePrice ? { borderColor: Colors.success, borderWidth: 2 } : null,
            ]}
            placeholder="Saisir le prix de vente"
            value={salePrice}
            onChangeText={setSalePrice}
            keyboardType="decimal-pad"
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Photos ({photos.length})
          </Text>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoContainer}>
                  <TouchableOpacity onPress={() => { setViewerIndex(i); setShowViewer(true); }}>
                    <Image source={{ uri }} style={styles.photo} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                    <Text style={styles.removePhotoText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          {photos.length === 0 && (
            <Text style={styles.noPhotos}>Aucune photo</Text>
          )}
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnText}>📷 Prendre photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
              <Text style={styles.photoBtnText}>🖼️ Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={handleUpdate}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.updateButton}
          >
            <Text style={styles.updateButtonText}>Enregistrer</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Supprimer ce téléphone</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showViewer} transparent animationType="fade" onRequestClose={() => setShowViewer(false)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setShowViewer(false)}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <Image source={{ uri: photos[viewerIndex] }} style={styles.viewerImage} resizeMode="contain" />
          )}
          {photos.length > 1 && (
            <View style={styles.viewerNav}>
              <TouchableOpacity style={styles.viewerNavBtn} onPress={() => setViewerIndex(Math.max(0, viewerIndex - 1))}>
                <Text style={styles.viewerNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.viewerCounter}>{viewerIndex + 1} / {photos.length}</Text>
              <TouchableOpacity style={styles.viewerNavBtn} onPress={() => setViewerIndex(Math.min(photos.length - 1, viewerIndex + 1))}>
                <Text style={styles.viewerNavText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <SaleModal
        visible={showSaleModal}
        phone={justSold}
        onClose={() => {
          setShowSaleModal(false);
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  relicatBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  relicatLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 4 },
  relicatValue: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  notesInput: { height: 80, textAlignVertical: "top" },
  photoStrip: { marginBottom: 12 },
  photoContainer: { position: "relative", marginRight: 8 },
  photo: { width: 120, height: 120, borderRadius: 12 },
  removePhoto: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  removePhotoText: { color: "#fff", fontSize: 14, fontWeight: "bold", marginTop: -1 },
  noPhotos: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12, textAlign: "center" },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoBtnText: { fontSize: 13, color: Colors.text, fontWeight: "600" },
  updateButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.gradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  updateButtonText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  deleteButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  deleteButtonText: { color: Colors.accent, fontSize: 15, fontWeight: "600" },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCloseText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  viewerImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.7,
  },
  viewerNav: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 50,
  },
  viewerNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerNavText: { color: "#fff", fontSize: 28, fontWeight: "bold", marginTop: -2 },
  viewerCounter: { color: "#fff", fontSize: 14, marginHorizontal: 24 },
});
