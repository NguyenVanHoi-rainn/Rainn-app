import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function ClientProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (auth.currentUser) {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullName(data.fullName || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
          }
        }
      } catch (error) {
        console.log("Lỗi tải thông tin:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleUpdate = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ Họ tên và Số điện thoại.");
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", auth.currentUser?.uid!);
      await updateDoc(userRef, {
        fullName,
        phone,
        address,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Thành công", "Thông tin hồ sơ đã được cập nhật.", [
        { text: "Đồng ý", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể cập nhật: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1BA39C" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* StatusBar giúp nội dung tràn viền nhưng vẫn rõ ràng */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header tối ưu né camera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#1BA39C" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Nhập số điện thoại"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={4}
              placeholder="Nhập địa chỉ của bạn"
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.noteText}>* Thông tin bắt buộc</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header được căn chỉnh né camera nốt ruồi
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 15 : 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  headerBtn: {
    minWidth: 45,
    alignItems: "center",
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  saveBtnText: { color: "#1BA39C", fontWeight: "bold", fontSize: 17 },

  form: { padding: 20 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 14, color: "#666", marginBottom: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    color: "#333",
  },
  textArea: {
    height: 100,
  },
  noteText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: -10,
    marginBottom: 30,
  },
});
