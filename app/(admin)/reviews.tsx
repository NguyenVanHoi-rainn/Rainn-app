import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";

export default function ReviewManagement() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    // Lấy tất cả tài khoản có role là worker
    const q = query(collection(db, "users"), where("role", "==", "worker"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        rating: doc.data().rating || 5, // Mặc định 5 sao nếu không có
        reviewCount: doc.data().reviewCount || 0,
        ...doc.data()
      }));

      // Sắp xếp theo số sao
      data.sort((a, b) => sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating);
      setWorkers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [sortOrder]);

  const toggleLock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    await updateDoc(doc(db, "users", id), { status: newStatus });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá Worker</Text>
      </View>

      {/* ĐÃ SỬA LỖI: Định nghĩa filterBtn trong style bên dưới */}
      <TouchableOpacity 
        style={styles.filterBtn} 
        onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
      >
        <Ionicons name="funnel-outline" size={18} color="#1BA39C" />
        <Text style={styles.filterText}>
          Sao: {sortOrder === 'desc' ? "Cao đến Thấp" : "Thấp đến Cao"}
        </Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#1BA39C" style={{marginTop: 50}} /> : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.workerCard}
              onPress={() => router.push(`/(admin)/worker-detail/${item.id}` as any)}
            >
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{item.fullName || "N/A"}</Text>
                <View style={styles.starRow}>
                  <Ionicons name="star" size={16} color="#FFCC00" />
                  <Text style={styles.starText}> {item.rating} ({item.reviewCount} đánh giá)</Text>
                </View>
              </View>
              
              <TouchableOpacity onPress={() => toggleLock(item.id, item.status)}>
                <Ionicons 
                  name={item.status === 'locked' ? "lock-closed" : "lock-open"} 
                  size={26} 
                  color={item.status === 'locked' ? "#FF3B30" : "#4CD964"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  filterBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    margin: 15, padding: 12, borderRadius: 10, justifyContent: 'center', elevation: 1 
  },
  filterText: { marginLeft: 10, color: '#1BA39C', fontWeight: 'bold' },
  workerCard: { 
    flexDirection: 'row', padding: 18, backgroundColor: '#fff', 
    marginHorizontal: 15, marginBottom: 10, borderRadius: 15, alignItems: 'center', elevation: 2
  },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  starText: { fontSize: 14, color: '#666' }
});