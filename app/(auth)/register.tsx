// import React, { useState } from "react";
// import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
// import { useRouter } from "expo-router";
// import { auth, db } from "../../configs/firebaseConfig";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore";

// export default function RegisterScreen() {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleRegister = async () => {
//     if (!email || !password) {
//       Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin.");
//       return;
//     }
//     setLoading(true);
//     try {
//       // 1. Tạo tài khoản Auth
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const uid = userCredential.user.uid;

//       // 2. Lưu Database ngầm (Không dùng await để ưu tiên tốc độ chuyển trang)
//       setDoc(doc(db, "users", uid), {
//         uid: uid,
//         email: email,
//         role: "client",
//         createdAt: new Date().toISOString()
//       }).catch(e => console.log("Lỗi lưu DB ngầm kệ nó: ", e));

//       setLoading(false);

//       // 3. Chuyển thẳng vào trang Client
//       console.log("Đăng ký xong! Chuyển vào Client...");
//       router.replace("/(client)/" as any);

//     } catch (error: any) {
//       setLoading(false);
//       Alert.alert("Lỗi Firebase", error.message);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Đăng ký RAINN</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Mật khẩu"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>ĐĂNG KÝ & BẮT ĐẦU</Text>}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
//   title: { fontSize: 28, fontWeight: 'bold', color: '#1BA39C', marginBottom: 30, textAlign: 'center' },
//   input: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
//   btn: { backgroundColor: '#1BA39C', padding: 18, borderRadius: 10, alignItems: 'center' },
//   btnText: { color: '#fff', fontWeight: 'bold' }
// });

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker"; // Thư viện chọn file
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Firebase
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../configs/firebaseConfig";

const CATEGORIES = [
  "Sửa chữa",
  "Dọn dẹp",
  "Chăm sóc",
  "Công nghệ",
  "Học tập",
  "Vận chuyển",
  "Thú cưng",
];

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Tài khoản, 2: Thông tin
  const [role, setRole] = useState<"client" | "worker" | null>(null);

  // --- BƯỚC 1: TÀI KHOẢN ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- BƯỚC 2: THÔNG TIN ---
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cccd, setCccd] = useState("");
  const [skill, setSkill] = useState("");
  const [fileName, setFileName] = useState(""); // Lưu tên file chứng chỉ

  // --- ĐIỀU KHOẢN ---
  const [showTerms, setShowTerms] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  // Hàm chọn file chứng chỉ
  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled) {
      setFileName(result.assets[0].name);
      Alert.alert("Thành công", `Đã chọn file: ${result.assets[0].name}`);
    }
  };

  const nextStep = () => {
    if (!email || !password || !confirmPassword)
      return Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin tài khoản.");
    if (password !== confirmPassword)
      return Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp.");
    if (password.length < 6)
      return Alert.alert("Lỗi", "Mật khẩu phải từ 6 ký tự.");
    setStep(2);
  };

  const handleRegister = async () => {
    if (!fullName || !phone || !isAgreed)
      return Alert.alert(
        "Lỗi",
        "Vui lòng điền đủ thông tin và đồng ý điều khoản.",
      );
    if (role === "worker" && (!cccd || !skill))
      return Alert.alert("Lỗi", "Worker cần nhập CCCD và Chuyên môn.");

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      const userData: any = {
        uid,
        email,
        fullName,
        phone,
        address,
        role,
        createdAt: new Date().toISOString(),
      };

      if (role === "worker") {
        userData.workerInfo = {
          cccd,
          mainSkill: skill,
          certificateFile: fileName || "N/A",
          isVerified: false,
        };
      }

      await setDoc(doc(db, "users", uid), userData);
      setLoading(false);
      router.replace(role === "client" ? "/(client)/" : ("/(worker)/" as any));
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Lỗi", error.message);
    }
  };

  // --- GIAO DIỆN CHỌN VAI TRÒ ---
  if (!role) {
    return (
      <View style={styles.choiceContainer}>
        <Text style={styles.choiceTitle}>Bạn là ai?</Text>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => setRole("client")}
        >
          <Ionicons name="people" size={50} color="#1BA39C" />
          <Text style={styles.roleTitle}>Khách hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => setRole("worker")}
        >
          <MaterialCommunityIcons
            name="account-hard-hat"
            size={50}
            color="#1BA39C"
          />
          <Text style={styles.roleTitle}>Người làm việc (Worker)</Text>
        </TouchableOpacity>

        {/* ✅ THÊM NÚT QUAY LẠI LOGIN TẠI ĐÂY */}
        <TouchableOpacity
          style={{ marginTop: 20, alignItems: "center" }}
          onPress={() => router.push("/login" as any)} // Hoặc đường dẫn login của bạn
        >
          <Text style={{ color: "#666" }}>
            Đã có tài khoản?{" "}
            <Text style={{ color: "#1BA39C", fontWeight: "bold" }}>
              Đăng nhập
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step === 1 ? setRole(null) : setStep(1))}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Đăng ký {role === "client" ? "Khách" : "Worker"} ({step}/2)
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 1 ? (
          /* PHẦN 1: TÀI KHOẢN */
          <View>
            <Text style={styles.sectionLabel}>Thông tin đăng nhập</Text>
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.btnText}>TIẾP THEO</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* PHẦN 2: THÔNG TIN CÁ NHÂN */
          <View>
            <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>
            <TextInput
              style={styles.input}
              placeholder="Họ và tên thật *"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ thường trú"
              value={address}
              onChangeText={setAddress}
            />

            {role === "worker" && (
              <View>
                <Text style={styles.sectionLabel}>Hồ sơ năng lực</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Số CCCD (12 số) *"
                  value={cccd}
                  onChangeText={setCccd}
                  keyboardType="number-pad"
                />
                <Text style={styles.label}>Dịch vụ sở trường *</Text>
                <View style={styles.skillGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, skill === cat && styles.chipActive]}
                      onPress={() => setSkill(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          skill === cat && styles.chipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* CHỌN FILE CHỨNG CHỈ */}
                <TouchableOpacity style={styles.fileBtn} onPress={pickDocument}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color="#1BA39C"
                  />
                  <Text style={styles.fileBtnText}>
                    {fileName ? fileName : "Tải lên bằng cấp/chứng chỉ"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ĐIỀU KHOẢN */}
            <TouchableOpacity
              style={styles.termsLink}
              onPress={() => setShowTerms(true)}
            >
              <Ionicons
                name={isAgreed ? "checkbox" : "square-outline"}
                size={22}
                color={isAgreed ? "#1BA39C" : "#666"}
              />
              <Text style={styles.termsText}>
                {" "}
                Tôi đồng ý với{" "}
                <Text style={{ fontWeight: "bold", color: "#1BA39C" }}>
                  Điều khoản dịch vụ
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>HOÀN TẤT ĐĂNG KÝ</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL ĐIỀU KHOẢN */}
      <Modal visible={showTerms} animationType="slide">
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
          <Text style={styles.modalTitle}>Điều khoản sử dụng RAINN</Text>
          <ScrollView style={{ marginVertical: 20 }}>
            <Text style={{ lineHeight: 22 }}>
              1. Bạn cam kết thông tin cung cấp là chính xác...{"\n"}2. Worker
              phải có thái độ chuyên nghiệp...{"\n"}3. RAINN không chịu trách
              nhiệm về các thỏa thuận riêng...
            </Text>
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#FF3B30" }]}
              onPress={() => {
                setIsAgreed(false);
                setShowTerms(false);
              }}
            >
              <Text style={styles.btnText}>TỪ CHỐI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#1BA39C" }]}
              onPress={() => {
                setIsAgreed(true);
                setShowTerms(false);
              }}
            >
              <Text style={styles.btnText}>ĐỒNG Ý</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  choiceContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  choiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1BA39C",
    textAlign: "center",
    marginBottom: 40,
  },
  roleCard: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  roleTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  scroll: { padding: 20 },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1BA39C",
    marginVertical: 15,
  },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  label: { fontSize: 14, color: "#666", marginBottom: 10 },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  chip: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: "#1BA39C", borderColor: "#1BA39C" },
  chipText: { color: "#666" },
  chipTextActive: { color: "#fff", fontWeight: "bold" },
  fileBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#1BA39C",
    marginBottom: 20,
  },
  fileBtnText: { marginLeft: 10, color: "#1BA39C" },
  termsLink: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  termsText: { marginLeft: 5, color: "#666" },
  primaryBtn: {
    backgroundColor: "#1BA39C",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: "center" },
});
