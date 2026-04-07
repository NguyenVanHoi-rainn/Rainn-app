import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";

export default function VerifyWorkers() {
  const router = useRouter();
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy danh sách worker đang ở trạng thái chờ duyệt
    const q = query(
      collection(db, "users"), 
      where("role", "==", "worker"),
      where("verifyStatus", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingWorkers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    const title = status === 'verified' ? "Duyệt hồ sơ" : "Từ chối hồ sơ";
    const msg = status === 'verified' ? "Thợ này sẽ được phép nhận việc ngay lập tức." : "Thợ này sẽ không thể nhận việc.";

    Alert.alert(title, msg, [
      { text: "Hủy" },
      { 
        text: "Xác nhận", 
        onPress: async () => {
          await updateDoc(doc(db, "users", id), { 
            verifyStatus: status,
            status: status === 'verified' ? 'active' : 'locked' 
          });
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyệt hồ sơ Worker</Text>
      </View>

      {loading ? <ActivityIndicator size="large" color="#1BA39C" style={{marginTop: 50}} /> : (
        <FlatList
          data={pendingWorkers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.workerCard}>
              <View style={styles.infoSection}>
                <Ionicons name="person-circle-outline" size={50} color="#666" />
                <View style={styles.textDetails}>
                  <Text style={styles.workerName}>{item.fullName || "N/A"}</Text>
                  <Text style={styles.workerEmail}>{item.email}</Text>
                  <Text style={styles.skillText}>Kỹ năng: {item.skills || "Chưa cập nhật"}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.btn, styles.rejectBtn]} 
                  onPress={() => handleVerify(item.id, 'rejected')}
                >
                  <Ionicons name="close-circle" size={18} color="#FF3B30" />
                  <Text style={styles.rejectText}> Từ chối</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.approveBtn]} 
                  onPress={() => handleVerify(item.id, 'verified')}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.approveText}> Duyệt thợ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={80} color="#DDD" />
              <Text style={styles.emptyText}>Hiện không có hồ sơ nào chờ duyệt</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  workerCard: { backgroundColor: '#fff', margin: 15, marginBottom: 5, borderRadius: 15, padding: 15, elevation: 2 },
  infoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  textDetails: { marginLeft: 15, flex: 1 },
  workerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  workerEmail: { fontSize: 13, color: '#666' },
  skillText: { fontSize: 13, color: '#1BA39C', marginTop: 3 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, width: '48%', justifyContent: 'center' },
  rejectBtn: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FF3B30' },
  approveBtn: { backgroundColor: '#1BA39C' },
  rejectText: { color: '#FF3B30', fontWeight: 'bold' },
  approveText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#AAA', marginTop: 15, fontSize: 16 }
});