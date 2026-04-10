import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
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
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function JobDetailScreen() {
  const { jobId } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const docRef = doc(db, "jobs", jobId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob(docSnap.data());
        } else {
          Alert.alert("Lỗi", "Không tìm thấy công việc này hoặc đã bị xóa.");
          router.back();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetail();
  }, [jobId]);

  // ✅ Hàm định dạng tiền tệ
  const formatPrice = (p: any) => {
    if (!p || p === "Thương lượng") return "Thỏa thuận";
    return `${parseInt(p).toLocaleString("vi-VN")} VNĐ`;
  };

  // ✅ HÀM NHẬN VIỆC
  const handleAcceptJob = async () => {
    Alert.alert("Xác nhận", "Bạn đồng ý nhận việc này?", [
      { text: "Hủy" },
      {
        text: "Đồng ý",
        onPress: async () => {
          setAccepting(true);
          try {
            const currentUserId = auth.currentUser?.uid;
            if (!currentUserId || !job) return;

            // 1. Cập nhật Job
            await updateDoc(doc(db, "jobs", jobId as string), {
              status: "accepted",
              workerId: currentUserId,
              workerName: auth.currentUser?.displayName || "Người làm",
              acceptedAt: serverTimestamp(),
            });

            // 2. Tạo Chat & Gửi vị trí
            const chatId =
              currentUserId < job.clientId
                ? `${currentUserId}_${job.clientId}`
                : `${job.clientId}_${currentUserId}`;

            await setDoc(
              doc(db, "chats", chatId),
              {
                lastMessage: "📍 Vị trí công việc đã được gửi",
                updatedAt: serverTimestamp(),
                users: [currentUserId, job.clientId],
                jobTitle: job.subService,
                [`name_${job.clientId}`]: job.clientName || "Khách hàng",
                [`name_${currentUserId}`]:
                  auth.currentUser?.displayName || "Người làm",
              },
              { merge: true },
            );

            if (job.location) {
              await addDoc(collection(db, "chats", chatId, "messages"), {
                text: "📍 Vị trí công việc",
                senderId: job.clientId,
                createdAt: serverTimestamp(),
                type: "location",
                latitude: job.location.latitude,
                longitude: job.location.longitude,
              });
            }

            router.push(`/(worker)/chat/${job.clientId}` as any);
          } catch (error: any) {
            Alert.alert("Lỗi", error.message);
          } finally {
            setAccepting(false);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết công việc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.categoryBadge}>{job?.groupService}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceValue}>{formatPrice(job?.price)}</Text>
            </View>
          </View>

          <Text style={styles.subService}>{job?.subService}</Text>
          <Text style={styles.clientName}>
            Khách hàng: {job?.clientName || "Ẩn danh"}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.label}>Thời gian dự kiến:</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#1BA39C" />
              <Text style={styles.infoText}>{job?.workDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#1BA39C" />
              <Text style={styles.infoText}>{job?.workTime}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Địa chỉ thực hiện:</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#FF3B30" />
              <Text style={styles.infoText} selectable>
                {job?.address}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Mô tả công việc:</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.description}>
                {job?.description || "Không có mô tả chi tiết."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#856404" />
          <Text style={styles.warningText}>
            Mọi giao dịch nên được thực hiện qua ứng dụng để đảm bảo quyền lợi.
          </Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => router.push(`/(worker)/chat/${job?.clientId}` as any)}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={24}
            color="#1BA39C"
          />
          <Text style={styles.chatBtnText}>Nhắn tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, accepting && { opacity: 0.8 }]}
          onPress={handleAcceptJob}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.acceptText}>NHẬN VIỆC</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  content: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  categoryBadge: {
    color: "#1BA39C",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  priceTag: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceValue: { color: "#1BA39C", fontWeight: "bold", fontSize: 14 },
  subService: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 5,
  },
  clientName: { fontSize: 14, color: "#636E72", marginBottom: 15 },
  divider: { height: 1, backgroundColor: "#F1F2F6", marginVertical: 15 },
  infoSection: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B2BEC3",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoText: { marginLeft: 12, fontSize: 16, color: "#2D3436", flex: 1 },
  descriptionBox: { backgroundColor: "#F8F9FA", padding: 15, borderRadius: 12 },
  description: { fontSize: 15, color: "#636E72", lineHeight: 24 },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF9E7",
    padding: 16,
    borderRadius: 15,
    marginTop: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCF3CF",
  },
  warningText: {
    marginLeft: 12,
    color: "#9A7D0A",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  chatBtn: {
    paddingHorizontal: 15,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1BA39C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatBtnText: {
    color: "#1BA39C",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#1BA39C",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  acceptText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});
