import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { auth, db, storage } from "../../../configs/firebaseConfig";

export default function ClientChatDetailScreen() {
  const { id } = useLocalSearchParams(); // workerId
  const router = useRouter();

  const [workerName, setWorkerName] = useState("Thợ kỹ thuật");
  const [workerPhone, setWorkerPhone] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // --- STATE ĐÁNH GIÁ ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const currentUserId = auth.currentUser?.uid;

  const getChatId = () => {
    if (!currentUserId || !id) return "";
    return currentUserId < (id as string)
      ? `${currentUserId}_${id}`
      : `${id}_${currentUserId}`;
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    if (!currentUserId || !id) return;

    getDoc(doc(db, "users", id as string)).then((snap) => {
      if (snap.exists()) {
        setWorkerName(snap.data().fullName || "Thợ kỹ thuật");
        setWorkerPhone(snap.data().phone || "");
      }
    });

    // Theo dõi Job để hiện Modal đánh giá khi hoàn thành
    const unsubJob = onSnapshot(
      query(
        collection(db, "jobs"),
        where("clientId", "==", currentUserId),
        where("workerId", "==", id),
      ),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setJobData({ id: snap.docs[0].id, ...data });

          // ✅ TỰ ĐỘNG HIỆN MODAL KHI STATUS LÀ COMPLETED
          if (data.status === "completed") {
            setShowReviewModal(true);
          }
        }
      },
    );

    const unsubChat = onSnapshot(
      query(
        collection(db, "chats", getChatId(), "messages"),
        orderBy("createdAt", "asc"),
      ),
      (snapshot) => {
        setMessages(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
    );

    return () => {
      unsubJob();
      unsubChat();
      showSub.remove();
      hideSub.remove();
    };
  }, [id, currentUserId]);

  // ✅ HÀM GỬI ĐÁNH GIÁ
  const submitReview = async () => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      // 1. Lưu đánh giá vào collection 'reviews'
      await addDoc(collection(db, "reviews"), {
        jobId: jobData.id,
        workerId: id,
        clientId: currentUserId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      // 2. Cập nhật status Job thành 'reviewed' để không hiện modal nữa
      await updateDoc(doc(db, "jobs", jobData.id), { status: "reviewed" });

      Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá dịch vụ!");
      setShowReviewModal(false);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể gửi đánh giá lúc này.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAcceptPrice = () => {
    Alert.alert(
      "Xác nhận giá",
      `Bạn đồng ý với mức giá ${jobData?.price?.toLocaleString()} VNĐ?`,
      [
        { text: "Để sau" },
        {
          text: "Đồng ý",
          onPress: async () => {
            await updateDoc(doc(db, "jobs", jobData.id), {
              status: "confirmed",
            });
            await addDoc(collection(db, "chats", getChatId(), "messages"), {
              text: "✅ Khách hàng đã đồng ý báo giá. Thợ có thể bắt đầu làm việc!",
              senderId: currentUserId,
              createdAt: serverTimestamp(),
              type: "system",
            });
          },
        },
      ],
    );
  };

  const handleCancelJob = () => {
    Alert.alert(
      "Hủy yêu cầu",
      "Bạn muốn hủy tìm thợ này và đóng cuộc trò chuyện?",
      [
        { text: "Không" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: async () => {
            if (jobData) {
              await updateDoc(doc(db, "jobs", jobData.id), {
                status: "pending",
                workerId: null,
                price: null,
              });
              await deleteDoc(doc(db, "chats", getChatId()));
              router.replace("/(client)/(tabs)/chat");
            }
          },
        },
      ],
    );
  };

  // ... (Hàm pickMedia và renderMessage giữ nguyên như code cũ của Hội)
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
    });
    if (!result.canceled) {
      setUploading(true);
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `chat_images/${Date.now()}.jpg`);
        await uploadBytes(fileRef, blob);
        const url = await getDownloadURL(fileRef);
        await addDoc(collection(db, "chats", getChatId(), "messages"), {
          fileUrl: url,
          senderId: currentUserId,
          createdAt: serverTimestamp(),
          type: "image",
        });
      } catch (e) {
        Alert.alert("Lỗi", "Gửi ảnh thất bại.");
      } finally {
        setUploading(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View style={[styles.msgRow, isMe ? styles.myRow : styles.otherRow]}>
        <View
          style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.otherBubble,
            item.type === "quote" && styles.quoteBubble,
            (item.type === "image" || item.type === "location") && {
              padding: 0,
              overflow: "hidden",
            },
          ]}
        >
          {item.type === "image" && (
            <Image source={{ uri: item.fileUrl }} style={styles.chatImage} />
          )}
          {item.type === "location" && (
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                scrollEnabled={false}
                initialRegion={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: item.latitude,
                    longitude: item.longitude,
                  }}
                />
              </MapView>
            </View>
          )}
          {item.type !== "image" && item.type !== "location" && (
            <Text
              style={{
                fontSize: 15,
                color: isMe || item.type === "quote" ? "#fff" : "#333",
                textAlign: item.type === "system" ? "center" : "left",
              }}
            >
              {item.text}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 15 }}
            onPress={() =>
              router.push({
                pathname: "/(client)/chat/profile-detail" as any,
                params: { userId: id },
              })
            }
          >
            <Text style={styles.headerTitle}>{workerName}</Text>
            <Text style={{ fontSize: 12, color: "#1BA39C" }}>
              Xem hồ sơ thợ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${workerPhone}`)}
          >
            <Feather name="phone" size={20} color="#1BA39C" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCancelJob}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {jobData?.status === "quoted" && (
          <View style={styles.priceAlert}>
            <Text style={styles.priceAlertText}>
              Thợ báo giá:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {jobData.price?.toLocaleString()}đ
              </Text>
            </Text>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptPrice}
            >
              <Text style={styles.acceptBtnText}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: 15,
            paddingTop: 10,
            paddingBottom: 15,
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
        <View
          style={[
            styles.inputArea,
            { paddingBottom: isKeyboardVisible ? 15 : 35 },
          ]}
        >
          <TouchableOpacity onPress={pickMedia} style={styles.plusBtn}>
            {uploading ? (
              <ActivityIndicator size="small" color="#1BA39C" />
            ) : (
              <Feather name="image" size={24} color="#1BA39C" />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tin nhắn..."
            multiline
            onBlur={() => setKeyboardVisible(false)}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              if (inputText.trim()) {
                addDoc(collection(db, "chats", getChatId(), "messages"), {
                  text: inputText,
                  senderId: currentUserId,
                  createdAt: serverTimestamp(),
                  type: "text",
                });
                setInputText("");
              }
            }}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ⭐ MODAL ĐÁNH GIÁ (CHỈ HIỆN KHI XONG VIỆC) ⭐ */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.starIconBox}>
              <Ionicons name="star" size={40} color="#F1C40F" />
            </View>
            <Text style={styles.reviewTitle}>Hoàn thành công việc!</Text>
            <Text style={styles.reviewSub}>
              Bạn đánh giá thế nào về thợ {workerName}?
            </Text>

            <View style={styles.starRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={35}
                    color="#F1C40F"
                    style={{ marginHorizontal: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Nhận xét của bạn (không bắt buộc)..."
              multiline
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={submitReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitReviewText}>GỬI ĐÁNH GIÁ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  headerWrapper: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#333" },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F9F8",
    justifyContent: "center",
    alignItems: "center",
  },
  priceAlert: {
    flexDirection: "row",
    backgroundColor: "#FFF9E7",
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#FAD7A0",
  },
  priceAlertText: { color: "#856404", fontSize: 13 },
  acceptBtn: {
    backgroundColor: "#1BA39C",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  msgRow: { marginBottom: 15, flexDirection: "row" },
  myRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "85%", padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: "#1BA39C", borderBottomRightRadius: 2 },
  otherBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 2,
    elevation: 1,
  },
  quoteBubble: { backgroundColor: "#E67E22", borderBottomLeftRadius: 2 },
  chatImage: { width: 220, height: 160, borderRadius: 12 },
  miniMapContainer: {
    width: 240,
    height: 160,
    borderRadius: 15,
    overflow: "hidden",
  },
  miniMap: { width: "100%", height: "100%" },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1BA39C",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  plusBtn: { marginRight: 10 },
  // --- Review Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
  },
  starIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF9E7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  reviewTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  reviewSub: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 8 },
  starRatingRow: { flexDirection: "row", marginVertical: 20 },
  reviewInput: {
    width: "100%",
    backgroundColor: "#F0F2F5",
    borderRadius: 15,
    padding: 15,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitReviewBtn: {
    backgroundColor: "#1BA39C",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  submitReviewText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
