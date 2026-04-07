import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator 
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

export default function AdminManageJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lắng nghe toàn bộ danh sách công việc mới nhất
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteJob = (jobId: string) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa yêu cầu công việc này không?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa bài", 
        style: "destructive", 
        onPress: async () => await deleteDoc(doc(db, "jobs", jobId))
      }
    ]);
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'pending': return { color: '#FF9500', text: 'Đang chờ' };
      case 'accepted': return { color: '#4CD964', text: 'Đã nhận' };
      case 'completed': return { color: '#1BA39C', text: 'Hoàn thành' };
      default: return { color: '#888', text: 'N/A' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bài đăng việc</Text>
      </View>

      {loading ? <ActivityIndicator size="large" color="#1BA39C" style={{marginTop: 50}} /> : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const status = getStatusStyle(item.status);
            return (
              <View style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.serviceBox}>
                    <Text style={styles.serviceName}>{item.subService}</Text>
                    <Text style={styles.groupName}>{item.groupService}</Text>
                  </View>
                  <Text style={[styles.statusTag, { color: status.color }]}>{status.text}</Text>
                </View>

                <View style={styles.jobDetail}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.workDate} | {item.workTime}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={16} color="#1BA39C" />
                    <Text style={[styles.detailText, {fontWeight: 'bold', color: '#1BA39C'}]}>
                      {item.price === "Thương lượng" ? "Thương lượng" : `${item.price} VNĐ`}
                    </Text>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.createdAt}>
                    Đăng lúc: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "Vừa xong"}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteJob(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có bài đăng nào trên hệ thống</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  jobCard: { backgroundColor: '#fff', margin: 15, marginBottom: 5, borderRadius: 15, padding: 15, elevation: 2 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  serviceBox: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  groupName: { fontSize: 12, color: '#999' },
  statusTag: { fontSize: 12, fontWeight: 'bold' },
  jobDetail: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0', paddingVertical: 10, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailText: { marginLeft: 8, fontSize: 14, color: '#555', flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createdAt: { fontSize: 11, color: '#BBB' },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 100 }
});