import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../configs/firebaseConfig";

export default function WorkerAllServicesScreen() {
  const router = useRouter();

  // ✅ Quản lý state danh mục lấy từ Firebase
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy dữ liệu Real-time tương tự bên Client
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
        console.error("Lỗi lấy tất cả danh mục cho Worker:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả danh mục việc làm</Text>
      </View>

      {/* Hiển thị vòng quay loading khi đang tải dữ liệu */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1BA39C" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
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
                    { backgroundColor: (item.color || "#333") + "15" },
                  ]}
                >
                  <FontAwesome5
                    name={item.icon || "briefcase"}
                    size={24}
                    color={item.color || "#333"}
                  />
                </View>
                <Text style={styles.gridLabel} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 40 : 20, // Né tai thỏ/nút hệ thống
  },
  backBtn: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
    color: "#1BA39C",
  },
  content: { padding: 15 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "25%", alignItems: "center", marginBottom: 25 },
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
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
