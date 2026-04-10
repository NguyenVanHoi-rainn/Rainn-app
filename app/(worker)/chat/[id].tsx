import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

export default function WorkerChatDetailScreen() {
  const { id } = useLocalSearchParams(); // Đây là clientId
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // State cho Modal báo giá
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");

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

    // 1. Lấy thông tin khách hàng Real-time
    const unsubUser = onSnapshot(doc(db, "users", id as string), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setClientName(data.fullName || data.name || "Khách hàng");
        setClientPhone(data.phone || "");
      }
    });

    // 2. Theo dõi trạng thái Job
    const unsubJob = onSnapshot(
      query(
        collection(db, "jobs"),
        where("workerId", "==", currentUserId),
        where("clientId", "==", id),
      ),
      (snap) => {
        if (!snap.empty)
          setJobData({ id: snap.docs[0].id, ...snap.docs[0].data() });
      },
    );

    // 3. Theo dõi Tin nhắn
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
      unsubUser();
      unsubJob();
      unsubChat();
      showSub.remove();
      hideSub.remove();
    };
  }, [id, currentUserId]);

  // HÀM GỬI ẢNH
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

  // HÀM XÁC NHẬN GỬI GIÁ
  const confirmSendQuote = async () => {
    const price = parseInt(quoteAmount);
    if (isNaN(price) || price <= 0 || !jobData)
      return Alert.alert("Lỗi", "Giá không hợp lệ");
    await updateDoc(doc(db, "jobs", jobData.id), { price, status: "quoted" });
    await addDoc(collection(db, "chats", getChatId(), "messages"), {
      text: `💰 BÁO GIÁ: ${price.toLocaleString()} VNĐ.`,
      senderId: currentUserId,
      createdAt: serverTimestamp(),
      type: "quote",
    });
    setShowQuoteModal(false);
    setQuoteAmount("");
  };

  // HÀM HOÀN THÀNH CÔNG VIỆC
  const handleCompleteJob = async () => {
    if (!jobData) return;
    Alert.alert(
      "Xác nhận",
      "Bạn đã hoàn thành công việc và muốn kết thúc đơn hàng?",
      [
        { text: "Hủy" },
        {
          text: "Hoàn thành",
          onPress: async () => {
            await updateDoc(doc(db, "jobs", jobData.id), {
              status: "completed",
              completedAt: serverTimestamp(),
            });
            await addDoc(collection(db, "chats", getChatId(), "messages"), {
              text: "🏁 Thợ đã xác nhận hoàn thành công việc.",
              senderId: currentUserId,
              createdAt: serverTimestamp(),
              type: "system",
            });
          },
        },
      ],
    );
  };

  // HÀM HỦY ĐƠN
  const handleCancelJob = () => {
    Alert.alert("Hủy đơn", "Đơn về danh sách chờ và xóa cuộc trò chuyện này?", [
      { text: "Không" },
      {
        text: "Đồng ý",
        onPress: async () => {
          if (jobData) {
            await updateDoc(doc(db, "jobs", jobData.id), {
              status: "pending",
              workerId: null,
              price: null,
            });
            await deleteDoc(doc(db, "chats", getChatId()));
            router.replace("/(worker)/(tabs)/chat-list");
          }
        },
      },
    ]);
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
          <Text
            style={{
              fontSize: 15,
              color: isMe || item.type === "quote" ? "#fff" : "#333",
              textAlign: item.type === "system" ? "center" : "left",
            }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(worker)/(tabs)/chat-list")}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 15 }}
            onPress={() =>
              router.push({
                pathname: "/(worker)/chat/profile-detail" as any,
                params: { userId: id },
              })
            }
          >
            <Text style={styles.headerTitle}>
              {clientName || "Đang tải..."}
            </Text>
            <Text style={{ fontSize: 12, color: "#1BA39C" }}>
              Xem hồ sơ khách
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${clientPhone}`)}
          >
            <Feather name="phone" size={20} color="#1BA39C" />
          </TouchableOpacity>
        </View>

        <View style={styles.toolBar}>
          {(jobData?.status === "accepted" ||
            jobData?.status === "rejected") && (
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowQuoteModal(true)}
            >
              <Text style={styles.toolText}>Báo giá</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              jobData?.status === "confirmed"
                ? styles.completeBtnActive
                : styles.completeBtnDisabled,
            ]}
            onPress={handleCompleteJob}
            disabled={jobData?.status !== "confirmed"}
          >
            <Text
              style={[
                styles.toolText,
                { color: jobData?.status === "confirmed" ? "#fff" : "#CCC" },
              ]}
            >
              Hoàn thành
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolBtn, { borderColor: "#FF3B30" }]}
            onPress={handleCancelJob}
          >
            <Text style={[styles.toolText, { color: "#FF3B30" }]}>Hủy đơn</Text>
          </TouchableOpacity>
        </View>
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
          style={{ flex: 1 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View
          style={[
            styles.inputArea,
            {
              paddingBottom: isKeyboardVisible
                ? 15
                : Platform.OS === "android"
                  ? 35
                  : 25,
            },
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

      {/* MODAL BÁO GIÁ */}
      <Modal visible={showQuoteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập báo giá (VNĐ)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ví dụ: 200000"
              keyboardType="numeric"
              value={quoteAmount}
              onChangeText={setQuoteAmount}
              autoFocus={true}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#EEE" }]}
                onPress={() => setShowQuoteModal(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#1BA39C" }]}
                onPress={confirmSendQuote}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Gửi giá
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
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
  toolBar: {
    flexDirection: "row",
    padding: 10,
    justifyContent: "space-around",
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  toolBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1BA39C",
  },
  toolText: { color: "#1BA39C", fontWeight: "bold", fontSize: 11 },
  completeBtnActive: { backgroundColor: "#1BA39C" },
  completeBtnDisabled: { borderColor: "#EEE", backgroundColor: "#F9F9F9" },
  msgRow: { marginBottom: 15, flexDirection: "row" },
  myRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: "#1BA39C", borderBottomRightRadius: 2 },
  otherBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 2,
    elevation: 1,
  },
  quoteBubble: { backgroundColor: "#E67E22", borderBottomRightRadius: 2 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  modalInput: {
    width: "100%",
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    padding: 15,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});
