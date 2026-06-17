import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { addPhone, savePhoto } from "../database/database";
import Colors from "../theme/colors";

export default function AddPhoneScreen({ navigation }) {
  const [model, setModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);

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

  function handleSave() {
    try {
      if (!model.trim()) {
        Alert.alert("Erreur", "Veuillez entrer le modèle du téléphone.");
        return;
      }
      if (!purchasePrice || isNaN(parseFloat(purchasePrice))) {
        Alert.alert("Erreur", "Veuillez entrer un prix d'achat valide.");
        return;
      }
      const price = parseFloat(purchasePrice);
      addPhone(model.trim(), price, notes.trim(), photos);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter le téléphone: " + e.message);
    }
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Nouveau téléphone</Text>

          <Text style={styles.label}>Modèle *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: iPhone 15 Pro Max"
            value={model}
            onChangeText={setModel}
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Prix d'achat (DHS) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1000"
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            keyboardType="decimal-pad"
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes optionnelles..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoContainer}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                    <Text style={styles.removePhotoText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
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

        <TouchableOpacity activeOpacity={0.9} onPress={handleSave}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Ajouter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 16,
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "bold", color: Colors.text, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12, alignSelf: "flex-start" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    width: "100%",
  },
  notesInput: { height: 80, textAlignVertical: "top" },
  photoStrip: { marginBottom: 12 },
  photoContainer: { position: "relative", marginRight: 8 },
  photo: { width: 100, height: 100, borderRadius: 12 },
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
  photoButtons: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
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
  saveButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: Colors.gradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
