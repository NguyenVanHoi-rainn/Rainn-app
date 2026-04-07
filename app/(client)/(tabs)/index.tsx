import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../../configs/firebaseConfig";
// Import AsyncStorage để dọn dẹp bộ nhớ khi logout
import AsyncStorage from "@react-native-async-storage/async-storage";
// Import real-time tools
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function ClientHomeScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lắng nghe danh mục thời gian thực
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(cats);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi lấy danh mục:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ✅ Hàm xử lý Logout sạch sẽ
  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // 1. Đăng xuất khỏi Firebase
            await signOut(auth);
            // 2. Xóa sạch bộ nhớ tạm trên điện thoại
            await AsyncStorage.clear();
            // 3. Quay về login và xóa sạch stack điều hướng
            router.replace("/login" as any);
          } catch (e) {
            Alert.alert("Lỗi", "Không thể đăng xuất sạch sẽ");
          }
        },
      },
    ]);
  };

  const displayServices = categories.slice(0, 7);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Tìm dịch vụ tại Thủ Dầu Một..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Chào bạn!</Text>
          <Text style={styles.bannerSub}>
            Hôm nay RAINN giúp gì được cho bạn?
          </Text>
        </View>

        <View style={styles.gridContainer}>
          <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#1BA39C"
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.grid}>
              {displayServices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() =>
                    router.push({
                      pathname: "/(client)/booking/[serviceId]",
                      params: { serviceId: item.id, groupName: item.name },
                    } as any)
                  }
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: (item.color || "#1BA39C") + "15" },
                    ]}
                  >
                    <FontAwesome5
                      name={item.icon || "star"}
                      size={22}
                      color={item.color || "#1BA39C"}
                    />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => router.push("/(client)/all-services" as any)}
              >
                <View style={[styles.iconBox, { backgroundColor: "#F2F2F7" }]}>
                  <Ionicons name="grid" size={24} color="#1BA39C" />
                </View>
                <Text style={styles.gridLabel}>Tất cả</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles giữ nguyên như cũ của bạn
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingTop: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 25,
    alignItems: "center",
  },
  searchInput: { marginLeft: 10, flex: 1 },
  logoutBtn: { marginLeft: 15, padding: 5 },
  banner: {
    margin: 15,
    padding: 25,
    backgroundColor: "#1BA39C",
    borderRadius: 20,
  },
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  bannerSub: { color: "#fff", opacity: 0.8, marginTop: 5 },
  gridContainer: { paddingHorizontal: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    marginBottom: 15,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "25%", alignItems: "center", marginBottom: 20 },
  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#444",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
