import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar, // Thêm StatusBar
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function ClientProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          if (auth.currentUser) {
            const docSnap = await getDoc(
              doc(db, "users", auth.currentUser.uid),
            );
            if (docSnap.exists()) setUserData(docSnap.data());
          }
        } catch (e) {
          console.log("Lỗi tải thông tin:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }, []),
  );

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
    <View style={styles.mainContainer}>
      {/* 1. Thiết lập StatusBar trong suốt để nội dung đẩy lên từ đỉnh máy */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* 2. Header đã fix khoảng cách đỉnh né Camera */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ khách hàng</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.userSection}>
            <View style={styles.avatarWrapper}>
              <Ionicons name="person-circle" size={90} color="#1BA39C" />
            </View>
            <View style={styles.userMeta}>
              <Text style={styles.userName}>
                {userData?.fullName || "Khách hàng"}
              </Text>
              <Text style={styles.userPhone}>
                {userData?.phone || "Chưa cập nhật SĐT"}
              </Text>
              <Text style={styles.userEmail}>{userData?.email}</Text>
            </View>
          </View>

          <View style={styles.menuGroup}>
            <Text style={styles.groupLabel}>Quản lý tài khoản</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                router.push("/(client)/(tabs)/profile-edit" as any)
              }
            >
              <View style={[styles.iconBox, { backgroundColor: "#E0F2F1" }]}>
                <Ionicons name="create-outline" size={20} color="#1BA39C" />
              </View>
              <Text style={styles.menuText}>Chỉnh sửa hồ sơ cá nhân</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="card-outline" size={20} color="#2196F3" />
              </View>
              <Text style={styles.menuText}>Phương thức thanh toán</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="settings-outline" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.menuText}>Cài đặt ứng dụng</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuGroup}>
            <Text style={styles.groupLabel}>Hỗ trợ & Bảo mật</Text>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="help-buoy-outline" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.menuText}>Trung tâm trợ giúp</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#F44336"
                />
              </View>
              <Text style={styles.menuText}>Chính sách bảo mật</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 5 }]}
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

          <View style={styles.footer}>
            <Text style={styles.versionText}>RAINN App v1.0.0</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    // ✅ Fix quan trọng: Đẩy Header xuống né Camera
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 15 : 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 25,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  avatarWrapper: { marginRight: 20 },
  userMeta: { flex: 1 },
  userName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  userPhone: { fontSize: 14, color: "#666", marginTop: 3 },
  userEmail: { fontSize: 13, color: "#999", marginTop: 2 },

  menuGroup: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#AAA",
    marginTop: 18,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: "#333" },
  footer: { alignItems: "center", marginTop: 10 },
  versionText: { color: "#CCC", fontSize: 12 },
});
