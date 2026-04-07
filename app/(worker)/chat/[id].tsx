import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
// ✅ Import chuẩn từ thư viện và file config của bạn
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
// ✅ Đảm bảo import 'storage' từ config để Client thấy được ảnh
import { auth, db, storage } from "../../../configs/firebaseConfig";

export default function WorkerChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [clientName, setClientName] = useState("Khách hàng");
  const [clientPhone, setClientPhone] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>("accepted");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const currentUserId = auth.currentUser?.uid;

  const getChatId = () => {
    if (!currentUserId || !id) return "";
    return currentUserId < (id as string)
      ? `${currentUserId}_${id}`
      : `${id}_${currentUserId}`;
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    if (!currentUserId || !id) return;

    const fetchData = async () => {
      const userSnap = await getDoc(doc(db, "users", id as string));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setClientName(data.fullName || "Khách hàng");
        setClientPhone(data.phone || "");
      }
      const jobQuery = query(
        collection(db, "jobs"),
        where("workerId", "==", currentUserId),
        where("clientId", "==", id),
        where("status", "==", "accepted"),
      );
      const jobSnap = await getDocs(jobQuery);
      setJobStatus(jobSnap.empty ? "completed" : "accepted");
    };
    fetchData();

    const chatId = getChatId();
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgList);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        200,
      );
    });

    return () => {
      unsubscribe();
      showSub.remove();
      hideSub.remove();
    };
  }, [id, currentUserId]);

  // ✅ SỬA HÀM UPLOAD: Dùng 'storage' đã khai báo để đẩy ảnh lên mây
  const uploadImageAsync = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    // Tạo đường dẫn file duy nhất
    const fileRef = ref(
      storage,
      `chat_images/${getChatId()}_${Date.now()}.jpg`,
    );
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 0.5, // Nén ảnh 50% để upload nhanh hơn
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const downloadURL = await uploadImageAsync(result.assets[0].uri);

        await addDoc(collection(db, "chats", getChatId(), "messages"), {
          fileUrl: downloadURL, // Link HTTPS vĩnh viễn
          senderId: currentUserId,
          createdAt: serverTimestamp(),
          type: result.assets[0].type === "video" ? "video" : "image",
        });
      } catch (e) {
        console.error(e);
        Alert.alert("Lỗi", "Không thể gửi ảnh lên hệ thống Storage!");
      } finally {
        setUploading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!currentUserId || !id || inputText.trim() === "") return;
    const text = inputText.trim();
    const chatId = getChatId();
    setInputText("");
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: text,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        type: "text",
      });
      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: text,
          updatedAt: serverTimestamp(),
          users: [currentUserId, id],
        },
        { merge: true },
      );
    } catch (e) {
      console.error(e);
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
            item.type === "image" && {
              padding: 0,
              overflow: "hidden",
              backgroundColor: "transparent",
            },
          ]}
        >
          {item.type === "image" ? (
            <Image
              source={{ uri: item.fileUrl }}
              style={styles.chatImage}
              resizeMode="cover"
            />
          ) : item.type === "location" ? (
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
          ) : (
            <Text style={{ fontSize: 15, color: isMe ? "#fff" : "#333" }}>
              {item.text}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "padding" : "padding"}
        keyboardVerticalOffset={0} // Để sát đáy cho Android
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header sát mép trên */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{clientName}</Text>
              <TouchableOpacity
                onPress={() =>
                  clientPhone && Linking.openURL(`tel:${clientPhone}`)
                }
                style={styles.callBtn}
              >
                <Feather name="phone" size={20} color="#1BA39C" />
              </TouchableOpacity>
            </View>

            <View style={styles.reportBar}>
              <View style={styles.reportInfo}>
                <Ionicons
                  name={
                    jobStatus === "accepted"
                      ? "time-outline"
                      : "checkmark-circle"
                  }
                  size={20}
                  color={jobStatus === "accepted" ? "#E67E22" : "#1BA39C"}
                />
                <Text style={styles.reportText}>
                  {jobStatus === "accepted"
                    ? "Đang thực hiện"
                    : "Đã hoàn thành"}
                </Text>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
              style={{ flex: 1 }}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* Ô nhập liệu hạ thấp sát đáy (15px) */}
            <View
              style={[
                styles.inputArea,
                { paddingBottom: isKeyboardVisible ? 10 : 15 },
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
                placeholder="Viết tin nhắn..."
                multiline
                onFocus={() =>
                  setTimeout(() => flatListRef.current?.scrollToEnd(), 200)
                }
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 5 : 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F9F8",
    justifyContent: "center",
    alignItems: "center",
  },
  reportBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  reportInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  reportText: { fontSize: 14, color: "#555", marginLeft: 8, fontWeight: "500" },
  backBtn: { padding: 2 },
  msgRow: { marginBottom: 15, flexDirection: "row", width: "100%" },
  myRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 18 },
  myBubble: { backgroundColor: "#1BA39C", borderBottomRightRadius: 2 },
  otherBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 2,
    elevation: 1,
  },
  chatImage: { width: 220, height: 160, borderRadius: 12 },
  miniMapContainer: {
    width: 220,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
  },
  miniMap: { width: "100%", height: "100%" },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  plusBtn: { marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    color: "#333",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1BA39C",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
