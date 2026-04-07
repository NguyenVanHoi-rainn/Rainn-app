import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

// Firebase Config
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

// ✅ Interface định nghĩa kiểu dữ liệu
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "income" | "withdraw";
  jobTitle?: string;
  createdAt?: Timestamp;
}

export default function PaymentTab() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // States cho thanh toán
  const [inputAmount, setInputAmount] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showMethodModal, setShowMethodModal] = useState<boolean>(false);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // 1. Lấy số dư Real-time
    const userRef = doc(db, "users", currentUserId);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setBalance(snap.data().balance || 0);
    });

    // 2. Lấy lịch sử giao dịch
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc"),
    );
    const unsubTx = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Transaction[];
        setTransactions(list);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => {
      unsubUser();
      unsubTx();
    };
  }, [currentUserId]);

  // ✅ Xử lý nạp tiền thành công sau khi thoát WebView
  const handlePaymentSuccess = async (method: string) => {
    if (!currentUserId || !inputAmount) return;
    const finalAmount = parseInt(inputAmount);

    try {
      setShowPaymentModal(false);
      setLoading(true);

      // Ghi log giao dịch
      await addDoc(collection(db, "transactions"), {
        userId: currentUserId,
        amount: finalAmount,
        type: "income",
        jobTitle: `Nạp tiền qua ${method} (Sandbox)`,
        createdAt: serverTimestamp(),
      });

      // Cập nhật số dư User
      const userRef = doc(db, "users", currentUserId);
      await setDoc(
        userRef,
        { balance: balance + finalAmount },
        { merge: true },
      );

      Alert.alert(
        "Thành công",
        `Đã nạp ${finalAmount.toLocaleString()}đ vào ví qua ${method}!`,
      );
      setInputAmount("");
    } catch (e) {
      Alert.alert("Lỗi", "Giao dịch thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const onNavigationStateChange = (navState: any) => {
    const { url } = navState;
    // Giả lập bắt các URL thành công của Sandbox
    if (
      url.includes("resultCode=0") ||
      url.includes("success") ||
      url.includes("vnp_ResponseCode=00")
    ) {
      const method = url.includes("momo")
        ? "MoMo"
        : url.includes("paypal")
          ? "PayPal"
          : "ZaloPay";
      handlePaymentSuccess(method);
    } else if (url.includes("cancel") || url.includes("error")) {
      setShowPaymentModal(false);
      Alert.alert("Thông báo", "Bạn đã hủy thanh toán.");
    }
  };

  const openPayment = (method: string) => {
    if (parseInt(inputAmount) < 10000) {
      return Alert.alert("Lỗi", "Số tiền nạp tối thiểu là 10.000đ");
    }
    setShowMethodModal(false);
    let url = "";
    switch (method) {
      case "MoMo":
        url =
          "https://test-payment.momo.vn/v2/gateway/api/create?partnerCode=MOMOBKUN20180529";
        break;
      case "ZaloPay":
        url = "https://sb-openapi.zalopay.vn/v2/create";
        break;
      case "PayPal":
        url =
          "https://www.sandbox.paypal.com/checkoutnow?token=EC-35805541H6337443C";
        break;
    }
    setPaymentUrl(url);
    setShowPaymentModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ví & Thanh toán</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Số dư ví Rainn</Text>
            <Text style={styles.balanceValue}>{balance.toLocaleString()}đ</Text>
            <TouchableOpacity
              style={styles.mainBtn}
              onPress={() => setShowMethodModal(true)}
            >
              <Ionicons name="wallet-outline" size={22} color="#fff" />
              <Text style={styles.mainBtnText}>Nạp thêm tiền</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View
              style={[
                styles.iconDot,
                {
                  backgroundColor:
                    item.type === "income" ? "#1BA39C" : "#FF3B30",
                },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.txTitle}>{item.jobTitle}</Text>
              <Text style={styles.txDate}>
                {item.createdAt?.toDate().toLocaleString("vi-VN")}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: item.type === "income" ? "#1BA39C" : "#FF3B30" },
              ]}
            >
              {item.type === "income" ? "+" : "-"}
              {item.amount?.toLocaleString()}đ
            </Text>
          </View>
        )}
      />

      {/* ✅ MODAL NHẬP TIỀN & CHỌN CỔNG */}
      <Modal visible={showMethodModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nạp tiền vào tài khoản</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.moneyInput}
                placeholder="Nhập số tiền..."
                keyboardType="numeric"
                value={inputAmount}
                onChangeText={setInputAmount}
                autoFocus
              />
              <Text style={styles.currency}>VNĐ</Text>
            </View>

            <View style={styles.methodList}>
              <TouchableOpacity
                style={[styles.method, !inputAmount && styles.disabled]}
                disabled={!inputAmount}
                onPress={() => openPayment("MoMo")}
              >
                <MaterialCommunityIcons
                  name="alpha-m-circle"
                  size={32}
                  color="#A50064"
                />
                <Text style={styles.methodText}>MoMo Sandbox</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.method, !inputAmount && styles.disabled]}
                disabled={!inputAmount}
                onPress={() => openPayment("ZaloPay")}
              >
                <MaterialCommunityIcons
                  name="alpha-z-circle"
                  size={32}
                  color="#008FE5"
                />
                <Text style={styles.methodText}>ZaloPay Sandbox</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.method, !inputAmount && styles.disabled]}
                disabled={!inputAmount}
                onPress={() => openPayment("PayPal")}
              >
                <Ionicons name="logo-paypal" size={28} color="#003087" />
                <Text style={styles.methodText}>PayPal Sandbox</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowMethodModal(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: "#999", fontWeight: "bold" }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WEBVIEW THANH TOÁN */}
      <Modal visible={showPaymentModal} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.wvHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={30} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              Đang kết nối Cổng thanh toán...
            </Text>
            <View style={{ width: 30 }} />
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={onNavigationStateChange}
              startInLoadingState
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color="#1BA39C"
                  style={styles.loader}
                />
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    paddingTop: Platform.OS === "android" ? 45 : 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1BA39C" },
  balanceCard: {
    backgroundColor: "#1BA39C",
    padding: 30,
    borderRadius: 35,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#1BA39C",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  balanceLabel: { color: "#fff", opacity: 0.8, fontSize: 14 },
  balanceValue: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
    marginVertical: 10,
  },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 15,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  mainBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  iconDot: { width: 8, height: 8, borderRadius: 4 },
  txTitle: { fontWeight: "bold", fontSize: 16, color: "#333" },
  txDate: { fontSize: 12, color: "#BBB", marginTop: 3 },
  txAmount: { fontWeight: "bold", fontSize: 17 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    minHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  moneyInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1BA39C",
  },
  currency: { fontSize: 18, fontWeight: "bold", color: "#999" },
  methodList: { marginTop: 10 },
  method: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  methodText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  disabled: { opacity: 0.3 },
  cancelBtn: { marginTop: 25, alignItems: "center" },
  wvHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  loader: { position: "absolute", top: "50%", left: "50%", marginLeft: -20 },
});
