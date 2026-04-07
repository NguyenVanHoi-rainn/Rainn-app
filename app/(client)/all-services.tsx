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
import { db } from "../../configs/firebaseConfig";

export default function AllServicesScreen() {
  const router = useRouter();

  // ✅ Quản lý state danh mục lấy từ Firebase
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy dữ liệu Real-time từ Firebase
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
        console.error("Lỗi lấy danh mục Client:", error);
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
        <Text style={styles.headerTitle}>Tất cả danh mục</Text>
      </View>

      {/* Loading state */}
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
                    size={24}
                    color={item.color || "#1BA39C"}
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
    // Xử lý khoảng cách cho Android để không dính thanh trạng thái
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  backBtn: { padding: 5 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    color: "#1BA39C",
  },
  content: { padding: 15 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "25%", alignItems: "center", marginBottom: 30 },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
