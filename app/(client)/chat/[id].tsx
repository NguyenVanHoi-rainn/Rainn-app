import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
// ✅ Thêm import Storage
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
// ✅ Thêm MapView
import MapView, { Marker } from "react-native-maps";
import { auth, db, storage } from "../../../configs/firebaseConfig";

export default function ClientChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [workerName, setWorkerName] = useState("Thợ");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
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

    getDoc(doc(db, "users", id as string)).then((snap) => {
      if (snap.exists()) setWorkerName(snap.data().fullName || "Thợ");
    });

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

  // ✅ Hàm Upload ảnh lên Firebase Storage (Giống Worker)
  const uploadImageAsync = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(
      storage,
      `chat_images/${getChatId()}_${Date.now()}.jpg`,
    );
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const downloadURL = await uploadImageAsync(result.assets[0].uri);
        await addDoc(collection(db, "chats", getChatId(), "messages"), {
          fileUrl: downloadURL,
          senderId: currentUserId,
          createdAt: serverTimestamp(),
          type: "image",
        });
      } catch (e) {
        Alert.alert("Lỗi", "Không thể gửi ảnh!");
      } finally {
        setUploading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" || !currentUserId) return;
    const textToSend = inputText.trim();
    const chatId = getChatId();
    setInputText("");

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: textToSend,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        type: "text",
      });

      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: textToSend,
          updatedAt: serverTimestamp(),
          users: [currentUserId, id],
        },
        { merge: true },
      );
    } catch (e) {
      console.log(e);
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
              backgroundColor: "transparent",
            },
          ]}
        >
          {item.type === "image" ? (
            <Image source={{ uri: item.fileUrl }} style={styles.chatImage} />
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
            <Text style={{ color: isMe ? "#fff" : "#333", fontSize: 15 }}>
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
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? 0 : 90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 5 }}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{workerName}</Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            <View
              style={[
                styles.inputArea,
                { paddingBottom: isKeyboardVisible ? 10 : 20 },
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  msgRow: { marginBottom: 15, flexDirection: "row" },
  myRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 18 },
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
