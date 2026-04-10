import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../../configs/firebaseConfig";

export default function ProfileDetailScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalJobs: 0, rating: 5.0 });

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        // 1. Lấy thông tin cá nhân
        const userSnap = await getDoc(doc(db, "users", userId as string));
        if (userSnap.exists()) {
          setUser(userSnap.data());
        }

        // 2. Lấy thống kê đơn hàng (Giả lập đếm số đơn đã hoàn thành)
        const q = query(
          collection(db, "jobs"),
          where("clientId", "==", userId),
          where("status", "==", "completed"),
          limit(50),
        );
        const jobSnap = await getDocs(q);
        setStats({
          totalJobs: jobSnap.size,
          rating: 4.8, // Hội có thể tính trung bình sao từ collection 'reviews'
        });
      } catch (error) {
        console.error("Lỗi tải hồ sơ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1BA39C" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back(); // Giải phóng màn hình Profile, quay về Chat đang mở sẵn
            } else {
              router.replace(`/(worker)/chat/${userId}` as any); // Chỉ dùng nếu không còn nấc back nào
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin chi tiết</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: user?.profileImage || "https://via.placeholder.com/150",
            }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>
            {user?.fullName || "Người dùng Rainn"}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === "worker" ? "THỢ CHUYÊN NGHIỆP" : "KHÁCH HÀNG"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalJobs}</Text>
              <Text style={styles.statLabel}>Đơn hàng</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.rating} ⭐</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {user?.email || "Chưa cập nhật"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {user?.phone || "Chưa có số điện thoại"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {user?.address || "Chưa cập nhật địa chỉ"}
            </Text>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Xác thực & Uy tín</Text>
          <View style={styles.verifyRow}>
            <MaterialCommunityIcons
              name={user?.status === "active" ? "shield-check" : "shield-alert"}
              size={24}
              color={user?.status === "active" ? "#1BA39C" : "#FF3B30"}
            />
            <Text
              style={[
                styles.verifyText,
                { color: user?.status === "active" ? "#1BA39C" : "#FF3B30" },
              ]}
            >
              {user?.status === "active"
                ? "Tài khoản đã xác thực uy tín"
                : "Tài khoản đang bị hạn chế"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() =>
            Alert.alert(
              "Thông báo",
              "Bạn muốn báo cáo người dùng này vì vi phạm chính sách?",
            )
          }
        >
          <Text style={styles.reportBtnText}>Báo cáo người dùng</Text>
        </TouchableOpacity>

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
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 45 : 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  backBtn: { padding: 5 },
  profileCard: {
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 30,
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#1BA39C",
  },
  userName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  roleBadge: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: { color: "#1BA39C", fontSize: 10, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    marginTop: 25,
    width: "100%",
    justifyContent: "center",
  },
  statItem: { alignItems: "center", paddingHorizontal: 30 },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#333" },
  statLabel: { fontSize: 12, color: "#999", marginTop: 4 },
  divider: { width: 1, height: "100%", backgroundColor: "#EEE" },
  infoSection: { backgroundColor: "#fff", padding: 20, marginBottom: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  infoText: { marginLeft: 15, color: "#555", fontSize: 15 },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
  },
  verifyText: { marginLeft: 10, fontWeight: "bold", fontSize: 14 },
  reportBtn: { margin: 20, padding: 15, alignItems: "center" },
  reportBtnText: { color: "#FF3B30", fontWeight: "bold" },
});
