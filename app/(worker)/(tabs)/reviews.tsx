import { Ionicons } from "@expo/vector-icons";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { auth, db } from "../../../configs/firebaseConfig";

interface Review {
  id: string;
  rating: number;
  comment: string;
  clientId: string;
  createdAt: any;
}

export default function WorkerReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // Lấy đánh giá của thợ hiện tại
    const q = query(
      collection(db, "reviews"),
      where("workerId", "==", currentUserId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];

      setReviews(list);

      // Tính số sao trung bình
      if (list.length > 0) {
        const total = list.reduce((acc, item) => acc + item.rating, 0);
        setAvgRating(total / list.length);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= item.rating ? "star" : "star-outline"}
              size={16}
              color="#F1C40F"
            />
          ))}
        </View>
        <Text style={styles.dateText}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleDateString("vi-VN")
            : ""}
        </Text>
      </View>
      <Text style={styles.commentText}>
        {item.comment || "Không có nhận xét."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1BA39C"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.avgScore}>{avgRating.toFixed(1)}</Text>
              <View style={styles.starsRowLarge}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(avgRating) ? "star" : "star-outline"}
                    size={24}
                    color="#F1C40F"
                  />
                ))}
              </View>
              <Text style={styles.totalReviews}>
                Dựa trên {reviews.length} đánh giá
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Bạn chưa nhận được đánh giá nào.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
  },
  avgScore: { fontSize: 48, fontWeight: "bold", color: "#333" },
  starsRowLarge: { flexDirection: "row", marginVertical: 10 },
  totalReviews: { color: "#95A5A6", fontSize: 14 },
  listContent: { paddingBottom: 30 },
  reviewCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  starsRow: { flexDirection: "row" },
  dateText: { fontSize: 12, color: "#95A5A6" },
  commentText: { fontSize: 15, color: "#2D3436", lineHeight: 22 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },
});
