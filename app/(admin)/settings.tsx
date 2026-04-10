import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../configs/firebaseConfig";

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States quản lý thông số hệ thống
  const [commission, setCommission] = useState("");
  const [hotline, setHotline] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "system", "config"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCommission(data.commissionRate?.toString() || "10");
          setHotline(data.hotline || "1900xxxx");
          setIsMaintenance(data.isMaintenance || false);
          setMinWithdraw(data.minWithdraw?.toString() || "50000");
        }
      } catch (error) {
        console.log("Lỗi tải cấu hình:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    // Ép kiểu và kiểm tra dữ liệu trước khi lưu
    const rate = parseFloat(commission);
    const minAmt = parseInt(minWithdraw);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      return Alert.alert("Lỗi", "Phần trăm hoa hồng phải từ 0 đến 100.");
    }
    if (isNaN(minAmt) || minAmt < 0) {
      return Alert.alert("Lỗi", "Số tiền rút tối thiểu không hợp lệ.");
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "system", "config"),
        {
          commissionRate: rate, // Lưu dạng Number để thợ tính toán được
          hotline: hotline.trim(),
          isMaintenance: isMaintenance,
          minWithdraw: minAmt,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      Alert.alert("Thành công", "Đã cập nhật cấu hình hệ thống!");
    } catch (e) {
      Alert.alert(
        "Lỗi",
        "Không thể lưu cài đặt. Kiểm tra quyền ghi Firestore.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1BA39C" />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Đang tải cấu hình...
        </Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cấu hình hệ thống</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#1BA39C" />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* PHẦN TÀI CHÍNH */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tài chính & Hoa hồng</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phần trăm phí dịch vụ (%)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="percent"
                size={20}
                color="#1BA39C"
              />
              <TextInput
                style={styles.input}
                value={commission}
                onChangeText={setCommission}
                keyboardType="numeric"
                placeholder="Ví dụ: 10"
              />
            </View>
            <Text style={styles.hint}>
              App sẽ thu {commission || "0"}% trên mỗi đơn hàng.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền rút tối thiểu (VNĐ)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="bank-transfer-out"
                size={20}
                color="#1BA39C"
              />
              <TextInput
                style={styles.input}
                value={minWithdraw}
                onChangeText={setMinWithdraw}
                keyboardType="numeric"
                placeholder="Ví dụ: 50000"
              />
            </View>
            <Text style={styles.hint}>
              Định dạng: {parseInt(minWithdraw || "0").toLocaleString("vi-VN")}{" "}
              VNĐ
            </Text>
          </View>
        </View>

        {/* PHẦN HỖ TRỢ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hỗ trợ & Liên hệ</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại Hotline</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#1BA39C" />
              <TextInput
                style={styles.input}
                value={hotline}
                onChangeText={setHotline}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* PHẦN VẬN HÀNH */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trạng thái vận hành</Text>
          <View style={styles.maintenanceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.maintenanceTitle}>Chế độ bảo trì</Text>
              <Text style={styles.maintenanceSub}>
                Khi bật, Client sẽ không thể tạo đơn hàng mới.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsMaintenance(!isMaintenance)}>
              <Ionicons
                name={isMaintenance ? "toggle" : "toggle-outline"}
                size={50}
                color={isMaintenance ? "#FF3B30" : "#CCC"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#1BA39C" />
          <Text style={styles.infoText}>
            Lưu ý: Mọi thay đổi sẽ có hiệu lực ngay lập tức. Hãy kiểm tra kỹ các
            thông số tài chính trước khi lưu.
          </Text>
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 45 : 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  backBtn: { padding: 5 },
  saveBtn: { padding: 5 },
  saveText: { color: "#1BA39C", fontWeight: "bold", fontSize: 17 },
  content: { padding: 20 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 15,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, color: "#444", marginBottom: 8, fontWeight: "500" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  hint: { fontSize: 11, color: "#1BA39C", marginTop: 5, fontStyle: "italic" },
  maintenanceRow: { flexDirection: "row", alignItems: "center" },
  maintenanceTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  maintenanceSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    paddingRight: 10,
  },
  infoBox: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#E0F2F1",
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: "#00695C",
    lineHeight: 18,
  },
});
