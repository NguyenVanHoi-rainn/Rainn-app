import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

interface ChatSession {
  id: string;
  lastMessage: string;
  updatedAt: any;
  users: string[];
  [key: string]: any;
}

export default function ClientChatListScreen() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Lưu user đăng nhập
  const router = useRouter();

  // ✅ BƯỚC 1: Theo dõi trạng thái đăng nhập để tránh bị null khi reload
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ✅ BƯỚC 2: Chỉ lấy dữ liệu khi đã xác nhận user tồn tại
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", user.uid),
    );

    const unsubscribeChat = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatSession[];

        // Sắp xếp thời gian thực bằng code
        const sortedChats = list.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });

        setChats(sortedChats);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi Chat List:", error.message);
        setLoading(false);
      },
    );

    return () => unsubscribeChat();
  }, [user]);

  const renderChatItem = ({ item }: { item: ChatSession }) => {
    const workerId = item.users?.find((uid) => uid !== user?.uid);
    const workerName = item[`name_${workerId}`] || "Người thợ";

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/(client)/chat/${workerId}` as any)}
      >
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="construct" size={24} color="#fff" />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.workerName} numberOfLines={1}>
              {workerName}
            </Text>
            <Text style={styles.chatTime}>
              {item.updatedAt?.toDate()
                ? item.updatedAt.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
          </View>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || "Nhấn để trao đổi"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#DDD" />
      </TouchableOpacity>
    );
  };

  if (loading && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1BA39C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={80}
              color="#F0F0F0"
            />
            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingTop: Platform.OS === "android" ? 45 : 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 15 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1BA39C",
    justifyContent: "center",
    alignItems: "center",
  },
  chatInfo: { flex: 1, marginLeft: 15 },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  workerName: { fontSize: 16, fontWeight: "bold", color: "#2D3436" },
  chatTime: { fontSize: 11, color: "#AAA" },
  lastMsg: { fontSize: 14, color: "#636E72" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 15, color: "#999", fontSize: 15 },
});
