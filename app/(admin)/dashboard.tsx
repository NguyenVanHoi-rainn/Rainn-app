import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
import { auth } from "../../configs/firebaseConfig";

export default function AdminDashboard() {
  const router = useRouter();

  const menu = [
    {
      id: "1",
      title: "Quản lý tài khoản",
      icon: "people",
      route: "/(admin)/users",
      color: "#1BA39C",
    },
    {
      id: "2",
      title: "Quản lý danh mục",
      icon: "grid",
      route: "/(admin)/categories",
      color: "#FF9500",
    },
    {
      id: "3",
      title: "Quản lý dịch vụ",
      icon: "build",
      route: "/(admin)/services",
      color: "#5856D6",
    },
    {
      id: "4",
      title: "Đánh giá Worker",
      icon: "star",
      route: "/(admin)/reviews",
      color: "#FFCC00",
    },
    {
      id: "5",
      title: "Quản lý bài đăng",
      icon: "list-box",
      route: "/(admin)/jobs",
      color: "#4CD964",
    },
    {
      id: "6",
      title: "Báo cáo doanh thu",
      icon: "stats-chart",
      route: "/(admin)/analytics",
      color: "#FF2D55",
    },
    {
      id: "7",
      title: "Duyệt hồ sơ thợ",
      icon: "shield-checkmark",
      route: "/(admin)/verify-workers",
      color: "#007AFF",
    },
    {
      id: "8",
      title: "Cài đặt hệ thống",
      icon: "settings",
      route: "/(admin)/settings",
      color: "#8E8E93",
    },
  ];

  // ✅ Hàm xử lý đăng xuất
  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn muốn đăng xuất khỏi quyền Admin?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login" as any);
          } catch (e) {
            console.log("Lỗi đăng xuất Admin:", e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rainn Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#FF2D55" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {menu.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: item.color + "15" },
              ]}
            >
              <Ionicons name={item.icon as any} size={30} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}

        {/* ✅ Nút đăng xuất dạng thẻ (Tùy chọn thêm ở cuối lưới) */}
        <TouchableOpacity
          style={[styles.card, { borderColor: "#FF2D55", borderWidth: 0.5 }]}
          onPress={handleLogout}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FF2D5515" }]}>
            <Ionicons name="log-out" size={30} color="#FF2D55" />
          </View>
          <Text style={[styles.cardTitle, { color: "#FF2D55" }]}>
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    padding: 25,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1BA39C" },
  grid: {
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: { fontWeight: "bold", color: "#333", textAlign: "center" },
});
