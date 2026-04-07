import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, ScrollView 
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
    // Lấy cấu hình hiện tại từ Firestore
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
    setSaving(true);
    try {
      // Lưu đè cấu hình mới vào document cố định
      await setDoc(doc(db, "system", "config"), {
        commissionRate: parseFloat(commission),
        hotline: hotline,
        isMaintenance: isMaintenance,
        minWithdraw: parseInt(minWithdraw),
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Thành công", "Đã cập nhật cấu hình hệ thống!");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#1BA39C" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cấu hình hệ thống</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#1BA39C" /> : 
            <Text style={styles.saveText}>Lưu</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tài chính & Hoa hồng</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phần trăm phí dịch vụ (%)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="percent" size={20} color="#666" />
              <TextInput 
                style={styles.input} 
                value={commission} 
                onChangeText={setCommission}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền rút tối thiểu (VNĐ)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="bank-transfer-out" size={20} color="#666" />
              <TextInput 
                style={styles.input} 
                value={minWithdraw} 
                onChangeText={setMinWithdraw}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hỗ trợ & Liên hệ</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại Hotline</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <TextInput 
                style={styles.input} 
                value={hotline} 
                onChangeText={setHotline}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trạng thái vận hành</Text>
          <TouchableOpacity 
            style={styles.maintenanceRow} 
            onPress={() => setIsMaintenance(!isMaintenance)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.maintenanceTitle}>Chế độ bảo trì</Text>
              <Text style={styles.maintenanceSub}>Người dùng sẽ không thể đặt lịch khi bật</Text>
            </View>
            <Ionicons 
              name={isMaintenance ? "toggle" : "toggle-outline"} 
              size={45} 
              color={isMaintenance ? "#FF3B30" : "#CCC"} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#666" />
          <Text style={styles.infoText}>
            Lưu ý: Mọi thay đổi ở đây sẽ có hiệu lực ngay lập tức đối với tất cả người dùng RAINN.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveText: { color: '#1BA39C', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  section: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 1 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#AAA', marginBottom: 15, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', 
    borderWidth: 1, borderColor: '#EEE', borderRadius: 10, paddingHorizontal: 12 
  },
  input: { flex: 1, padding: 12, fontSize: 16, color: '#333' },
  maintenanceRow: { flexDirection: 'row', alignItems: 'center' },
  maintenanceTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  maintenanceSub: { fontSize: 12, color: '#999', marginTop: 2 },
  infoBox: { flexDirection: 'row', padding: 15, backgroundColor: '#E0F2F1', borderRadius: 10, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: '#666', lineHeight: 18 }
});