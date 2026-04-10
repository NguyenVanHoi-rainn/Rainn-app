import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar, // Thêm import này
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../../configs/firebaseConfig";

export default function ClientHomeScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(cats);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            await AsyncStorage.clear();
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
    // SafeAreaView chỉ thực sự hiệu quả trên iOS, Android cần View bọc ngoài
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header đã fix khoảng cách đỉnh */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder="Tìm dịch vụ tại Thủ Dầu Một..."
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
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
                  <View
                    style={[styles.iconBox, { backgroundColor: "#F2F2F7" }]}
                  >
                    <Ionicons name="grid" size={24} color="#1BA39C" />
                  </View>
                  <Text style={styles.gridLabel}>Tất cả</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingBottom: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#fff",
    // ✅ Fix quan trọng: Đẩy Header xuống dưới StatusBar của Android
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 15,
    height: 45, // Cố định chiều cao cho dễ chạm
    borderRadius: 25,
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  logoutBtn: {
    marginLeft: 15,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    margin: 15,
    padding: 25,
    backgroundColor: "#1BA39C",
    borderRadius: 20,
    // Đổ bóng cho đẹp
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bannerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  bannerSub: { color: "#fff", opacity: 0.9, marginTop: 5, fontSize: 15 },
  gridContainer: { paddingHorizontal: 5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 15,
    marginTop: 10,
    color: "#333",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "25%", alignItems: "center", marginBottom: 20 },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
