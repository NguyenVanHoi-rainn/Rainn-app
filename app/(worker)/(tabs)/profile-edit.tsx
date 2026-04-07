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

const CATEGORIES = ["Sửa chữa", "Dọn dẹp", "Chăm sóc", "Công nghệ", "Học tập", "Vận chuyển", "Thú cưng"];

export default function ProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // States thông tin
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cccd, setCccd] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]); // Lưu mảng các skill
  const [bio, setBio] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (auth.currentUser) {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullName(data.fullName || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
            setBio(data.bio || "");
            
            if (data.workerInfo) {
              setCccd(data.workerInfo.cccd || "");
              // Kiểm tra nếu mainSkill là mảng thì set, nếu là string thì đưa vào mảng
              const skills = data.workerInfo.mainSkill;
              setSelectedSkills(Array.isArray(skills) ? skills : skills ? [skills] : []);
            }
          }
        } else {
          router.replace("/login");
        }
      } catch (error) {
        console.error("Lỗi tải thông tin:", error);
      } finally {
        setLoading(false); // Đảm bảo tắt xoay kể cả khi lỗi
      }
    };
    loadUserData();
  }, []);

  // Hàm xử lý chọn/bỏ chọn skill
  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName)); // Bỏ chọn
    } else {
      setSelectedSkills([...selectedSkills, skillName]); // Thêm vào mảng
    }
  };

  const handleUpdate = async () => {
    if (!fullName.trim() || !phone.trim() || selectedSkills.length === 0) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ Họ tên, SĐT và chọn ít nhất 1 chuyên môn.");
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", auth.currentUser?.uid!);
      await updateDoc(userRef, {
        fullName: fullName,
        phone: phone,
        address: address,
        bio: bio,
        "workerInfo.mainSkill": selectedSkills, // Lưu mảng xuống Firestore
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert("Thành công", "Hồ sơ đã được cập nhật.", [
        { text: "OK", onPress: () => router.push("/(worker)/(tabs)/profile") }
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể cập nhật: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1BA39C" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(worker)/(tabs)/profile")}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={updating}>
          {updating ? <ActivityIndicator size="small" color="#1BA39C" /> : 
            <Text style={styles.saveBtnText}>Lưu</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <Text style={styles.sectionLabel}>Chuyên môn (Chọn 1 hoặc nhiều)</Text>
          <View style={styles.inputGroup}>
            <View style={styles.skillGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.chip, selectedSkills.includes(cat) && styles.chipActive]} 
                  onPress={() => toggleSkill(cat)}
                >
                  <Text style={[styles.chipText, selectedSkills.includes(cat) && styles.chipTextActive]}>
                    {cat} {selectedSkills.includes(cat) && "✓"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới thiệu bản thân</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <View style={{ height: 50 }} />
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
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#1BA39C', marginBottom: 15, marginTop: 10, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: "#666", marginBottom: 8, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#EEE", borderRadius: 12, padding: 12, fontSize: 16, color: "#333", backgroundColor: '#FAFAFA' },
  disabledInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5' },
  textArea: { height: 100, paddingTop: 12 },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1BA39C', borderColor: '#1BA39C' },
  chipText: { color: '#666', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
});