import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../../configs/firebaseConfig";

export default function ClientProfileDetail() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // Sử dụng onSnapshot để cập nhật thông tin ngay lập tức khi khách sửa profile
    const unsub = onSnapshot(doc(db, "users", currentUserId), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [currentUserId]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1BA39C" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar giúp giao diện đẹp hơn trên cả iOS và Android */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity
          onPress={() => router.push("/(client)/profile-edit" as any)}
          style={styles.editBtn}
        >
          <Feather name="edit-3" size={20} color="#1BA39C" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card - Đã bỏ phần Sao và Đánh giá */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  userData?.profileImage ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{userData?.fullName || "Khách hàng"}</Text>
          <Text style={styles.role}>Thành viên RAINN</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Feather name="phone" size={20} color="#1BA39C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>
                {userData?.phone || "Chưa cập nhật"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Feather name="mail" size={20} color="#1BA39C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {userData?.email || "Chưa cập nhật"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Ionicons name="location-outline" size={20} color="#1BA39C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Địa chỉ nhận việc</Text>
              <Text style={styles.infoValue}>
                {userData?.address || "Chưa cập nhật địa chỉ"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Cảm ơn bạn đã tin dùng RAINN</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 15 : 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  backBtn: { padding: 5 },
  editBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  profileCard: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#F9FAFB",
  },
  avatarWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 15 },
  role: {
    fontSize: 14,
    color: "#1BA39C",
    marginTop: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoSection: { padding: 25 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoItem: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F0F9F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  infoLabel: { fontSize: 12, color: "#95A5A6", marginBottom: 2 },
  infoValue: { fontSize: 16, color: "#2C3E50", fontWeight: "500" },
  footer: { alignItems: "center", marginTop: 20, paddingBottom: 40 },
  footerText: { fontSize: 13, color: "#BDC3C7", fontStyle: "italic" },
});
