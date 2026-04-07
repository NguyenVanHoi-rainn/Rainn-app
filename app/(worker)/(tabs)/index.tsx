import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../configs/firebaseConfig";

export default function WorkerHomeScreen() {
  const router = useRouter();

  // Quản lý danh mục lấy từ Admin
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ LẮNG NGHE DANH MỤC THỜI GIAN THỰC
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
        console.error("Lỗi lấy danh mục Worker:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const displayServices = categories.slice(0, 7);

  return (
    <View style={styles.container}>
      {/* Cấu hình StatusBar để tiệp màu với Banner xanh */}
      <StatusBar barStyle="light-content" backgroundColor="#1BA39C" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ✅ BANNER: Đã đẩy lên sát mép trên, xóa khung trắng */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Chào Worker!</Text>
          <Text style={styles.bannerSub}>
            Hôm nay bạn muốn nhận thêm công việc nào?
          </Text>
        </View>

        {/* ✅ THANH TÌM KIẾM: Đè lên Banner chuyên nghiệp */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              placeholder="Tìm kiếm công việc mới..."
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Thân bài: Danh mục việc làm */}
        <View style={styles.gridContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục việc làm</Text>
            <Text style={styles.sectionSub}>
              Dựa trên yêu cầu từ khách hàng
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#1BA39C"
              style={{ marginTop: 30 }}
            />
          ) : (
            <View style={styles.grid}>
              {displayServices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/(worker)/job-market/[categoryId]",
                      params: { categoryId: item.id, categoryName: item.name },
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
                      name={item.icon || "briefcase"}
                      size={22}
                      color={item.color || "#1BA39C"}
                    />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Nút Xem tất cả */}
              <TouchableOpacity
                style={styles.gridItem}
                activeOpacity={0.7}
                onPress={() =>
                  router.push("/(worker)/job-market/all-services" as any)
                }
              >
                <View style={[styles.iconBox, { backgroundColor: "#F2F2F7" }]}>
                  <Ionicons name="grid" size={24} color="#1BA39C" />
                </View>
                <Text style={styles.gridLabel}>Tất cả</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Khoảng trống dưới cùng để không bị che bởi Bottom Tab */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  banner: {
    // Chỉnh paddingTop thấp để ôm sát phần camera/tai thỏ trên Android
    paddingTop: Platform.OS === "android" ? 45 : 60,
    paddingHorizontal: 25,
    paddingBottom: 60, // Tạo khoảng không để thanh search đè lên
    backgroundColor: "#1BA39C",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  bannerSub: {
    color: "#fff",
    opacity: 0.9,
    marginTop: 5,
    fontSize: 14,
  },

  searchSection: {
    paddingHorizontal: 20,
    marginTop: -30, // Đẩy thanh search đè lên banner xanh
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderRadius: 15,
    alignItems: "center",
    // Hiệu ứng bóng đổ
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  gridContainer: {
    paddingHorizontal: 10,
    marginTop: 20,
  },
  sectionHeader: {
    marginLeft: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333",
  },
  sectionSub: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 20,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
