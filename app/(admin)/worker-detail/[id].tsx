import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, 
  TouchableOpacity, ActivityIndicator 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Firebase
import { db } from "../../../configs/firebaseConfig";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";

export default function WorkerReviewDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [workerInfo, setWorkerInfo] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // 1. Lấy thông tin cơ bản của Worker
    getDoc(doc(db, "users", id as string)).then((snap) => {
      if (snap.exists()) setWorkerInfo(snap.data());
    });

    // 2. Lấy danh sách đánh giá từ collection 'reviews'
    const q = query(collection(db, "reviews"), where("workerId", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#1BA39C" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đánh giá</Text>
      </View>

      {/* Thông tin thợ */}
      <View style={styles.workerHeader}>
        <Ionicons name="person-circle" size={60} color="#1BA39C" />
        <View style={styles.workerMeta}>
          <Text style={styles.workerName}>{workerInfo?.fullName || "N/A"}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFCC00" />
            <Text style={styles.ratingValue}> {workerInfo?.rating || 5.0}</Text>
            <Text style={styles.reviewCount}> ({reviews.length} đánh giá)</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Lời đánh giá từ khách hàng</Text>
        
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.clientName}>{item.clientName || "Khách hàng ẩn danh"}</Text>
                <View style={styles.smallStars}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color="#FFCC00" />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewText}>{item.comment || "Không có nội dung"}</Text>
              <Text style={styles.reviewDate}>
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : ""}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbox-ellipses-outline" size={50} color="#DDD" />
              <Text style={styles.emptyText}>Worker này chưa có đánh giá nào</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  workerHeader: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  workerMeta: { marginLeft: 15 },
  workerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  reviewCount: { color: '#666', fontSize: 14 },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#666' },
  reviewCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  clientName: { fontWeight: 'bold', color: '#333' },
  smallStars: { flexDirection: 'row' },
  reviewText: { color: '#555', lineHeight: 20 },
  reviewDate: { fontSize: 11, color: '#BBB', marginTop: 10, textAlign: 'right' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#BBB', marginTop: 10, fontSize: 15 }
});