import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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
import { auth, db } from "../../../configs/firebaseConfig";

interface ChatSession {
  id: string;
  lastMessage: string;
  updatedAt: any;
  users: string[];
  jobTitle?: string;
  jobDate?: string;
  jobTime?: string;
  [key: string]: any;
}

export default function ChatListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [user, setUser] = useState<any>(null);

  // ✅ 1. Theo dõi trạng thái đăng nhập (Sửa lỗi reload mất lịch sử)
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

  // ✅ 2. Lấy danh sách chat khi đã có User
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
        const chatList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatSession[];

        // Sắp xếp thủ công theo thời gian mới nhất
        const sortedChats = chatList.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });

        setChats(sortedChats);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi lấy danh sách chat:", error.message);
        setLoading(false);
      },
    );

    return () => unsubscribeChat();
  }, [user]);

  const renderChatItem = ({ item }: { item: ChatSession }) => {
    // Xác định ID khách hàng
    const receiverId = item.users?.find((uid) => uid !== user?.uid);
    const displayName = item[`name_${receiverId}`] || "Khách hàng";

    // ✅ Định dạng hiển thị: Tên việc - Ngày Giờ
    const jobInfo = item.jobTitle
      ? `${item.jobTitle} - ${item.jobDate} ${item.jobTime}`
      : "Chi tiết công việc đang cập nhật...";

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/(worker)/chat/${receiverId}` as any)}
      >
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color="#1BA39C" />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.clientName}>{displayName}</Text>
            <Text style={styles.chatTime}>
              {item.updatedAt?.toDate()
                ? item.updatedAt.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
          </View>

          {/* Hiển thị Tên công việc và Ngày giờ */}
          <Text style={styles.jobDetailText} numberOfLines={1}>
            {jobInfo}
          </Text>

          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || "Nhấn để xem tin nhắn"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hội thoại công việc</Text>
      </View>

      {loading && !user ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1BA39C" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
            </View>
          }
        />
      )}
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1BA39C" },
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
    backgroundColor: "#F0F9F8",
    justifyContent: "center",
    alignItems: "center",
  },
  chatInfo: { flex: 1, marginLeft: 15 },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  clientName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  jobDetailText: {
    fontSize: 13,
    color: "#1BA39C",
    fontWeight: "500",
    marginBottom: 2,
  },
  chatTime: { fontSize: 11, color: "#999" },
  lastMsg: { fontSize: 13, color: "#777" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 10, color: "#999" },
});
