import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

interface JobItem {
  id: string;
  subService: string;
  clientName: string;
  clientId: string;
  workDate: string;
  workTime: string;
  address: string; // Chứa text hiển thị
  location?: {
    // Chứa tọa độ thực tế {latitude, longitude}
    latitude: number;
    longitude: number;
  };
  price: string;
  status: string;
  createdAt: any;
  groupService: string;
}

export default function JobByCategoryScreen() {
  const params = useLocalSearchParams();
  const categoryName = decodeURIComponent(params.categoryName as string);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "jobs"),
      where("groupService", "==", categoryName),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobItem[];

      const sortedJobs = jobList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setJobs(sortedJobs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryName]);

  // ✅ HÀM NHẬN VIỆC VÀ TỰ ĐỘNG GỬI VỊ TRÍ VÀO CHAT
  const processAcceptance = async () => {
    if (!selectedJob) return;
    setShowConfirm(false);

    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      const jobRef = doc(db, "jobs", selectedJob.id);

      // 1. Cập nhật Job
      await updateDoc(jobRef, {
        status: "accepted",
        workerId: currentUserId,
        workerName: auth.currentUser?.displayName || "Người làm",
        acceptedAt: serverTimestamp(),
      });

      // 2. Tạo Chat ID & Metadata
      const chatId =
        currentUserId < selectedJob.clientId
          ? `${currentUserId}_${selectedJob.clientId}`
          : `${selectedJob.clientId}_${currentUserId}`;

      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: "📍 Vị trí công việc đã được gửi",
          updatedAt: serverTimestamp(),
          users: [currentUserId, selectedJob.clientId],
          jobTitle: selectedJob.subService,
          [`name_${selectedJob.clientId}`]:
            selectedJob.clientName || "Khách hàng",
          [`name_${currentUserId}`]:
            auth.currentUser?.displayName || "Người làm",
        },
        { merge: true },
      );

      // 3. Gửi tin nhắn vị trí (Lấy senderId là khách để hiện bên trái cho thợ xem)
      if (selectedJob.location) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: "📍 Vị trí công việc",
          senderId: selectedJob.clientId,
          createdAt: serverTimestamp(),
          type: "location",
          latitude: selectedJob.location.latitude,
          longitude: selectedJob.location.longitude,
        });
      }

      router.push(`/(worker)/chat/${selectedJob.clientId}` as any);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };
  const formatPrice = (p: any) => {
    if (!p || p === "Thương lượng") return "Thỏa thuận";
    const numericPrice = typeof p === "string" ? p.replace(/,/g, "") : p;
    return `${parseInt(numericPrice).toLocaleString("vi-VN")} VNĐ`;
  };

  const renderJobItem = ({ item }: { item: JobItem }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subService}>{item.subService}</Text>
          <Text style={styles.clientName}>
            Khách: {item.clientName || "Khách hàng"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MỚI</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#1BA39C" />
        <Text style={styles.infoText}>
          {item.workDate} • {item.workTime}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.infoText} numberOfLines={1}>
          {item.address}
        </Text>
      </View>

      <View style={styles.jobFooter}>
        <View>
          <Text style={styles.priceLabel}>Ngân sách:</Text>
          <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
        </View>
        <TouchableOpacity
          style={styles.btnAccept}
          onPress={() => {
            setSelectedJob(item);
            setShowConfirm(true);
          }}
        >
          <Text style={styles.btnAcceptText}>NHẬN VIỆC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1BA39C" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={80} color="#DDD" />
              <Text style={styles.emptyTitle}>Chưa có việc mới</Text>
            </View>
          }
        />
      )}

      {/* MODAL XÁC NHẬN */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="briefcase" size={30} color="#1BA39C" />
            </View>
            <Text style={styles.modalTitle}>Nhận công việc?</Text>
            <Text style={styles.modalSubTitle}>
              Hệ thống sẽ gửi vị trí của khách vào chat để bạn tiện di chuyển.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={processAcceptance}
              >
                <Text style={styles.modalConfirmText}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 15, paddingBottom: 30 },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subService: { fontSize: 18, fontWeight: "bold", color: "#2D3436" },
  clientName: { fontSize: 13, color: "#95A5A6" },
  badge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: "#E67E22", fontSize: 11, fontWeight: "bold" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { marginLeft: 10, color: "#636E72", fontSize: 14 },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
  },
  priceValue: { fontSize: 16, fontWeight: "bold", color: "#1BA39C" },
  priceLabel: { fontSize: 11, color: "#95A5A6" },
  btnAccept: {
    backgroundColor: "#1BA39C",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnAcceptText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#B2BEC3",
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F9F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  modalButtons: { flexDirection: "row", width: "100%", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#1BA39C",
  },
  modalCancelText: { color: "#666", fontWeight: "600" },
  modalConfirmText: { color: "#fff", fontWeight: "600" },
});
