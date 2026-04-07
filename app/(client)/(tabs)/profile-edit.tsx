import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { auth, db } from "../../../configs/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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
        console.log("Lỗi tải:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleUpdate = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin.");
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
      
      Alert.alert("Thành công", "Thông tin đã được cập nhật.", [
        { text: "OK", onPress: () => router.push("/(client)/(tabs)/profile") }
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1BA39C" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Nút X chuyển về trang Profile */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(client)/(tabs)/profile")}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={updating}>
          {updating ? <ActivityIndicator size="small" color="#1BA39C" /> : 
            <Text style={styles.saveBtnText}>Lưu</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  saveBtnText: { color: "#1BA39C", fontWeight: "bold", fontSize: 16 },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: "#666", marginBottom: 8, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#DDD", borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#FAFAFA' }
});