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
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function WorkerProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // States danh mục động từ Admin
  const [categories, setCategories] = useState<any[]>([]);

  // States thông tin user
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. LẤY DANH MỤC TỪ ADMIN (Collection: categories)
        const catSnap = await getDocs(collection(db, "categories"));
        const catList = catSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.data().title, // Hội check lại field name trong DB nhé
        }));
        setCategories(catList);

        // 2. LẤY THÔNG TIN USER HIỆN TẠI
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
              const skills = data.workerInfo.mainSkill;
              setSelectedSkills(
                Array.isArray(skills) ? skills : skills ? [skills] : [],
              );
            }
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        Alert.alert("Lỗi", "Không thể tải danh mục dịch vụ.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleUpdate = async () => {
    if (!fullName.trim() || !phone.trim() || selectedSkills.length === 0) {
      Alert.alert(
        "Lỗi",
        "Vui lòng nhập đủ Họ tên, SĐT và chọn ít nhất 1 chuyên môn.",
      );
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, "users", auth.currentUser?.uid!);
      await updateDoc(userRef, {
        fullName,
        phone,
        address,
        bio,
        "workerInfo.mainSkill": selectedSkills,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Thành công", "Hồ sơ thợ đã được cập nhật.", [
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
        <Text style={{ marginTop: 10, color: "#666" }}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header chuẩn né nốt ruồi */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sửa hồ sơ thợ</Text>

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
          <Text style={styles.sectionLabel}>Thông tin cơ bản</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Tên hiển thị với khách"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Số liên lạc"
            />
          </View>

          <Text style={styles.sectionLabel}>Chuyên môn (Lấy từ Admin)</Text>
          <View style={styles.skillGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  selectedSkills.includes(cat.name) && styles.chipActive,
                ]}
                onPress={() => toggleSkill(cat.name)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSkills.includes(cat.name) && styles.chipTextActive,
                  ]}
                >
                  {cat.name} {selectedSkills.includes(cat.name) && "✓"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.inputGroup, { marginTop: 25 }]}>
            <Text style={styles.label}>Giới thiệu bản thân</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              placeholder="Mô tả kinh nghiệm..."
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ hoạt động</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Ví dụ: Thủ Dầu Một, Bình Dương"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  headerBtn: { minWidth: 45, alignItems: "center", padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  saveBtnText: { color: "#1BA39C", fontWeight: "bold", fontSize: 17 },
  form: { padding: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1BA39C",
    marginBottom: 15,
    marginTop: 10,
    textTransform: "uppercase",
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: "#666", marginBottom: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F9F9F9",
  },
  textArea: { height: 100, paddingTop: 12 },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#1BA39C", borderColor: "#1BA39C" },
  chipText: { color: "#666", fontSize: 14 },
  chipTextActive: { color: "#fff", fontWeight: "bold" },
});
