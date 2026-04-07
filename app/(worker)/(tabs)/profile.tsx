import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function WorkerProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (docSnap.exists()) setUserData(docSnap.data());
        }
      } catch (e) {
        console.log("Lỗi tải thông tin:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // ✅ Hàm xử lý đăng xuất
  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất khỏi RAINN?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login" as any);
          } catch (e) {
            console.log("Lỗi đăng xuất:", e);
          }
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Phần Avatar & Thông tin chính */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarWrapper}>
            <Ionicons name="person-circle" size={100} color="#1BA39C" />
            {userData?.workerInfo?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>

          <Text style={styles.nameText}>
            {userData?.fullName || "Chưa cập nhật tên"}
          </Text>

          {/* Phần Sao đánh giá */}
          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}> 4.9 </Text>
            <Text style={styles.reviewCount}>(128 đánh giá)</Text>
          </View>

          <Text style={styles.emailText}>{userData?.email}</Text>

          {/* Danh sách kỹ năng */}
          <View style={styles.skillContainer}>
            {userData?.workerInfo?.mainSkill &&
            Array.isArray(userData.workerInfo.mainSkill) ? (
              userData.workerInfo.mainSkill.map(
                (skill: string, index: number) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ),
              )
            ) : (
              <View style={styles.skillBadge}>
                <Text style={styles.skillText}>
                  {userData?.workerInfo?.mainSkill || "Chưa chọn chuyên môn"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu quản lý & Cài đặt */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Quản lý tài khoản</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(worker)/profile-edit" as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: "#E0F2F1" }]}>
              <Ionicons name="create-outline" size={20} color="#1BA39C" />
            </View>
            <Text style={styles.menuText}>Chỉnh sửa hồ sơ cá nhân</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: "#FFF9E6" }]}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="#FFB300"
              />
            </View>
            <Text style={styles.menuText}>Phản hồi từ khách hàng</Text>
            <View style={styles.badgeNew}>
              <Text style={styles.badgeNewText}>Mới</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            </View>
            <Text style={styles.menuText}>Lịch sử công việc</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: "#E8EAF6" }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#3F51B5"
              />
            </View>
            <Text style={styles.menuText}>Xác minh danh tính (CCCD)</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          {/* ✅ NÚT ĐĂNG XUẤT */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 10 }]}
            onPress={handleLogout}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
              <Ionicons name="log-out-outline" size={22} color="#F44336" />
            </View>
            <Text
              style={[
                styles.menuText,
                { color: "#F44336", fontWeight: "bold" },
              ]}
            >
              Đăng xuất
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#FFEBEE" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  profileInfo: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#F9FAFB",
  },
  avatarWrapper: { position: "relative" },
  verifiedBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  nameText: { fontSize: 22, fontWeight: "bold", marginTop: 10, color: "#333" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
  },
  ratingText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  reviewCount: { fontSize: 13, color: "#999" },
  emailText: { color: "#666", fontSize: 14, marginBottom: 15 },

  skillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  skillBadge: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  skillText: { color: "#1BA39C", fontWeight: "bold", fontSize: 12 },

  menuContainer: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#BBB",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: "#333" },
  badgeNew: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeNewText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});
