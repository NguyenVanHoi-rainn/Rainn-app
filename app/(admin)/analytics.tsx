import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebaseConfig";

const { width } = Dimensions.get("window");

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // States thống kê
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    // 1. Lắng nghe tất cả jobs để tính doanh thu và số lượng đơn
    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      let revenue = 0;
      let completed = 0;
      let pending = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "completed") {
          completed++;
          // Chỉ cộng tiền nếu giá không phải là "Thương lượng"
          const priceNum = parseInt(data.price);
          if (!isNaN(priceNum)) revenue += priceNum;
        } else if (data.status === "pending") {
          pending++;
        }
      });

      setStats((prev) => ({
        ...prev,
        totalRevenue: revenue,
        completedJobs: completed,
        pendingJobs: pending,
      }));
    });

    // 2. Lắng nghe số lượng người dùng
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
      setLoading(false);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeUsers();
    };
  }, []);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1BA39C" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo & Thống kê</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tổng doanh thu */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>Tổng giao dịch hoàn thành</Text>
          <Text style={styles.mainValue}>
            {formatMoney(stats.totalRevenue)}
          </Text>
          <View style={styles.growthBadge}>
            <Ionicons name="trending-up" size={16} color="#fff" />
            <Text style={styles.growthText}> +12% tháng này</Text>
          </View>
        </View>

        {/* Lưới các chỉ số nhỏ */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: "#E3F2FD" }]}>
            <MaterialCommunityIcons
              name="briefcase-check"
              size={28}
              color="#2196F3"
            />
            <Text style={styles.statNum}>{stats.completedJobs}</Text>
            <Text style={styles.statLabel}>Đơn xong</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#FFF3E0" }]}>
            <MaterialCommunityIcons
              name="clock-fast"
              size={28}
              color="#FF9800"
            />
            <Text style={styles.statNum}>{stats.pendingJobs}</Text>
            <Text style={styles.statLabel}>Đang chờ</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#F3E5F5" }]}>
            <MaterialCommunityIcons
              name="account-group"
              size={28}
              color="#9C27B0"
            />
            <Text style={styles.statNum}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Thành viên</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#E8F5E9" }]}>
            <MaterialCommunityIcons
              name="shield-check"
              size={28}
              color="#4CAF50"
            />
            <Text style={styles.statNum}>100%</Text>
            <Text style={styles.statLabel}>An toàn</Text>
          </View>
        </View>

        {/* Biểu đồ giả lập (Vì Chart cần thư viện nặng, mình dùng Layout thay thế) */}
        <Text style={styles.sectionTitle}>Hoạt động theo tuần</Text>
        <View style={styles.chartMock}>
          {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
            <View key={i} style={styles.chartColWrapper}>
              <View style={[styles.chartCol, { height: h }]} />
              <Text style={styles.dayText}>T{i + 2}</Text>
            </View>
          ))}
        </View>
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
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "ios" ? 50 : 20, // Thêm đệm cho tai thỏ
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 15 },
  content: { padding: 15 }, // Giảm padding một chút để grid rộng hơn
  mainCard: {
    backgroundColor: "#1BA39C",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    elevation: 4,
    marginBottom: 20,
  },
  mainLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  mainValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
  },
  growthBadge: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  growthText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },

  statBox: {
    width: "48%", // Chiếm gần nửa màn hình
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNum: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 10 },
  statLabel: { fontSize: 12, color: "#666", marginTop: 2 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  chartMock: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 150,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    marginBottom: 30,
  },
  chartColWrapper: { alignItems: "center" },
  chartCol: { width: 12, backgroundColor: "#1BA39C", borderRadius: 6 },
  dayText: { fontSize: 10, color: "#AAA", marginTop: 8 },
});
