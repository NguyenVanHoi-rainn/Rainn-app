import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../configs/firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASS = "admin123456";

  // ✅ 1. HÀM QUÊN MẬT KHẨU
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        "Lỗi",
        "Vui lòng nhập Email vào ô trống phía trên để nhận link.",
      );
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Thành công",
        "Liên kết đặt lại mật khẩu đã được gửi đến Email của bạn.",
      );
    } catch (error: any) {
      Alert.alert("Lỗi", "Email không tồn tại hoặc sai định dạng.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. HÀM ĐĂNG NHẬP GOOGLE (Giữ nguyên chờ cấu hình SHA-1)
  const handleGoogleLogin = async () => {
    Alert.alert(
      "Thông báo",
      "Tính năng Google Login yêu cầu cấu hình SHA-1. Hãy dùng Email/Pass để demo.",
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      let userUid = "";

      // 🛑 XỬ LÝ ADMIN BÍ MẬT
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        try {
          const res = await signInWithEmailAndPassword(auth, email, password);
          userUid = res.user.uid;
        } catch (e) {
          const res = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          userUid = res.user.uid;
        }

        // Luôn đảm bảo Admin có doc trong Firestore
        await setDoc(
          doc(db, "users", userUid),
          {
            fullName: "Administrator",
            email: email,
            role: "admin",
            status: "active",
          },
          { merge: true },
        );

        return router.replace("/(admin)/dashboard" as any);
      }

      // 👤 ĐĂNG NHẬP USER/WORKER THÔNG THƯỜNG
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === "locked") {
          return Alert.alert(
            "Thông báo",
            "Tài khoản của bạn hiện đang bị khóa.",
          );
        }

        const role = userData.role;
        // ĐIỀU HƯỚNG THEO ROLE
        if (role === "admin") {
          router.replace("/(admin)/dashboard" as any);
        } else if (role === "worker") {
          router.replace("/(worker)/" as any);
        } else {
          // Khách vào tab client
          router.replace("/(client)/(tabs)" as any);
        }
      } else {
        // Trường hợp login thành công nhưng chưa có Doc (lỗi dữ liệu)
        router.replace("/(client)/(tabs)" as any);
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert("Lỗi", "Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RAINN</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>Hoặc</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
        <Text style={styles.googleBtnText}>ĐĂNG NHẬP BẰNG GOOGLE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => router.push("/(auth)/register" as any)}
      >
        <Text style={styles.registerText}>
          Chưa có tài khoản?{" "}
          <Text style={{ color: "#1BA39C", fontWeight: "bold" }}>
            Đăng ký ngay
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1BA39C",
    marginBottom: 40,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 20 },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 10 },
  forgotText: { color: "#1BA39C", fontSize: 14, fontWeight: "500" },
  loginBtn: {
    backgroundColor: "#1BA39C",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: "#EEE" },
  orText: { marginHorizontal: 10, color: "#999" },
  googleBtn: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  googleBtnText: { color: "#333", fontSize: 15, fontWeight: "500" },
  registerLink: { marginTop: 25, alignItems: "center" },
  registerText: { color: "#666", fontSize: 14 },
});
