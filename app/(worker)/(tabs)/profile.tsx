import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function WorkerProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State cho đánh giá thật
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // ✅ 1. LẤY THÔNG TIN USER REAL-TIME (Cập nhật ngay khi vừa nhấn Lưu)
    const unsubUser = onSnapshot(
      doc(db, "users", currentUserId),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      },
      (error) => {
        console.log("Lỗi lắng nghe user:", error);
        setLoading(false);
      },
    );

    // ✅ 2. LẤY ĐÁNH GIÁ REAL-TIME
    const qReviews = query(
      collection(db, "reviews"),
      where("workerId", "==", currentUserId),
    );
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      setTotalReviews(snap.size);
      if (snap.size > 0) {
        const total = snap.docs.reduce((acc, d) => acc + d.data().rating, 0);
        setAvgRating(total / snap.size);
      }
    });

    // Cleanup khi component bị hủy
    return () => {
      unsubUser();
      unsubReviews();
    };
  }, [currentUserId]);

  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/login" as any);
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
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Thông tin */}
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
              {userData?.fullName || "Thợ kỹ thuật"}
            </Text>

            <TouchableOpacity
              style={styles.ratingRow}
              onPress={() => router.push("/(worker)/(tabs)/reviews" as any)}
            >
              <FontAwesome name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>
                {" "}
                {avgRating > 0 ? avgRating.toFixed(1) : "5.0"}{" "}
              </Text>
              <Text style={styles.reviewCount}>({totalReviews} đánh giá)</Text>
            </TouchableOpacity>

            <Text style={styles.emailText}>{userData?.email}</Text>

            {/* ✅ DANH SÁCH KỸ NĂNG ĐÃ FIX DÍNH CHÙM */}
            <View style={styles.skillContainer}>
              {userData?.workerInfo?.mainSkill ? (
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
                      {userData.workerInfo.mainSkill}
                    </Text>
                  </View>
                )
              ) : (
                <Text style={{ color: "#999", fontSize: 12 }}>
                  Chưa cập nhật chuyên môn
                </Text>
              )}
            </View>
          </View>

          {/* Menu quản lý */}
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

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(worker)/(tabs)/reviews" as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: "#FFF9E6" }]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#FFB300"
                />
              </View>
              <Text style={styles.menuText}>Phản hồi từ khách hàng</Text>
              {totalReviews > 0 && (
                <View style={styles.badgeNew}>
                  <Text style={styles.badgeNewText}>{totalReviews}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
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
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 1,
  },
  ratingText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  reviewCount: { fontSize: 13, color: "#999" },
  emailText: { color: "#666", fontSize: 14, marginVertical: 10 },

  // ✅ STYLE CHO KỸ NĂNG CHUẨN ĐẸP
  skillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 8,
  },
  skillBadge: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  skillText: { color: "#1BA39C", fontWeight: "bold", fontSize: 12 },

  menuContainer: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: {
    fontSize: 12,
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
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: "#333" },
  badgeNew: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeNewText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
});
