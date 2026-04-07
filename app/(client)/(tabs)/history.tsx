import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase Config
import { auth, db } from "../../../configs/firebaseConfig";

interface JobHistory {
  id: string;
  subService: string;
  groupService: string;
  workDate: string;
  workTime: string;
  price: string;
  status: string; // pending, accepted, completed, cancelled
  address: string;
  createdAt: any;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [historyJobs, setHistoryJobs] = useState<JobHistory[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // ✅ Truy vấn lấy danh sách job của khách hàng hiện tại
    // LƯU Ý: Nếu vẫn lỗi, hãy click vào link trong Terminal để tạo Index trên Firebase
    const q = query(
      collection(db, "jobs"),
      where("clientId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firebase Timestamp sang Date nếu cần
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : data.createdAt,
          };
        }) as JobHistory[];

        setHistoryJobs(list);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi lấy lịch sử:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Hàm định dạng màu sắc theo trạng thái
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "#E67E22", bg: "#FFF3E0", text: "Đang chờ thợ" };
      case "accepted":
        return { color: "#1BA39C", bg: "#E0F2F1", text: "Thợ đang đến" };
      case "completed":
        return { color: "#4CAF50", bg: "#E8F5E9", text: "Đã hoàn thành" };
      case "cancelled":
        return { color: "#FF3B30", bg: "#FFEBEE", text: "Đã hủy" };
      default:
        return { color: "#999", bg: "#F5F5F5", text: status };
    }
  };

  const formatPrice = (p: any) => {
    if (!p || p === "Thương lượng") return "Thỏa thuận";
    const numPrice = typeof p === "string" ? parseInt(p) : p;
    return `${numPrice.toLocaleString("vi-VN")} VNĐ`;
  };

  const renderHistoryItem = ({ item }: { item: JobHistory }) => {
    const status = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          // Điều hướng tới chi tiết đơn hàng nếu Hội có màn hình chi tiết
          // router.push({ pathname: "/(client)/job-detail", params: { jobId: item.id } });
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.serviceName}>
            {item.subService || "Dịch vụ không tên"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {item.workDate || "Chưa có ngày"} • {item.workTime || "--:--"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.address || "Chưa có địa chỉ"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>Tổng thanh toán:</Text>
          <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1BA39C" />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Đang tải lịch sử...
          </Text>
        </View>
      ) : (
        <FlatList
          data={historyJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={80}
                color="#DDD"
              />
              <Text style={styles.emptyText}>
                Bạn chưa có lịch sử hoạt động nào
              </Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => router.push("/(client)/(tabs)")}
              >
                <Text style={styles.bookNowText}>Đặt dịch vụ ngay</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 45 : 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1BA39C" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 15, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2D3436",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "bold" },
  cardBody: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 12,
    marginBottom: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { marginLeft: 8, fontSize: 14, color: "#636E72" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: { fontSize: 13, color: "#95A5A6" },
  priceValue: { fontSize: 18, fontWeight: "bold", color: "#1BA39C" },
  emptyBox: { flex: 1, alignItems: "center", marginTop: 100 },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
  },
  bookNowBtn: {
    marginTop: 20,
    backgroundColor: "#1BA39C",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookNowText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
