import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

interface Transaction {
  id: string;
  jobTitle: string;
  amount: number;
  date: string;
  type: "income" | "withdraw";
}

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ✅ State cho tính năng rút tiền
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankInfo, setBankInfo] = useState({
    name: "",
    accountNo: "",
    owner: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance || 0);
      }
    });

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubTx = onSnapshot(q, (snapshot) => {
      const txList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      setTransactions(txList);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubTx();
    };
  }, []);

  // ✅ Hàm xử lý gửi yêu cầu rút tiền
  const submitWithdrawRequest = async () => {
    const amount = parseInt(withdrawAmount);

    // Kiểm tra hợp lệ
    if (!amount || amount < 50000) {
      return Alert.alert("Lỗi", "Số tiền rút tối thiểu là 50,000đ");
    }
    if (amount > balance) {
      return Alert.alert("Lỗi", "Số dư không đủ để thực hiện giao dịch này.");
    }
    if (!bankInfo.name || !bankInfo.accountNo || !bankInfo.owner) {
      return Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin ngân hàng.");
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || "Worker",
        amount: amount,
        bankName: bankInfo.name,
        accountNo: bankInfo.accountNo,
        accountOwner: bankInfo.owner,
        status: "pending", // Chờ admin duyệt
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Thành công",
        "Yêu cầu của bạn đã được gửi. Admin sẽ xử lý trong vòng 24h.",
      );
      setShowWithdrawModal(false);
      setWithdrawAmount("");
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTxItem = ({ item }: { item: Transaction }) => (
    <View style={styles.txCard}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: item.type === "income" ? "#E0F2F1" : "#FFEBEE" },
        ]}
      >
        <Ionicons
          name={item.type === "income" ? "arrow-down" : "arrow-up"}
          size={20}
          color={item.type === "income" ? "#1BA39C" : "#FF3B30"}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle}>{item.jobTitle}</Text>
        <Text style={styles.txDate}>{item.date}</Text>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: item.type === "income" ? "#1BA39C" : "#FF3B30" },
        ]}
      >
        {item.type === "income" ? "+" : "-"}
        {item.amount.toLocaleString()}đ
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ví tiền của tôi</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()}đ</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowWithdrawModal(true)}
            >
              <MaterialCommunityIcons
                name="bank-transfer-out"
                size={24}
                color="#fff"
              />
              <Text style={styles.actionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          {loading ? (
            <ActivityIndicator color="#1BA39C" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTxItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    Bạn chưa có giao dịch nào.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* ✅ MODAL NHẬP THÔNG TIN RÚT TIỀN */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yêu cầu rút tiền</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Số tiền muốn rút (VNĐ)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 100000"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />

              <Text style={styles.inputLabel}>Ngân hàng</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Vietcombank, MB Bank..."
                value={bankInfo.name}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, name: text })
                }
              />

              <Text style={styles.inputLabel}>Số tài khoản</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tài khoản"
                keyboardType="numeric"
                value={bankInfo.accountNo}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, accountNo: text })
                }
              />

              <Text style={styles.inputLabel}>Tên chủ tài khoản</Text>
              <TextInput
                style={styles.input}
                placeholder="NGUYEN VAN A"
                autoCapitalize="characters"
                value={bankInfo.owner}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, owner: text })
                }
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  isSubmitting && { backgroundColor: "#ccc" },
                ]}
                onPress={submitWithdrawRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Xác nhận rút tiền</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Giữ lại các styles cũ của Hội) ...
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1BA39C" },
  balanceCard: {
    margin: 20,
    padding: 25,
    backgroundColor: "#1BA39C",
    borderRadius: 25,
    elevation: 5,
  },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  balanceValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 10,
  },
  actionRow: { flexDirection: "row", marginTop: 15 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 15,
  },
  actionText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  historySection: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  txInfo: { flex: 1, marginLeft: 15 },
  txTitle: { fontWeight: "bold", fontSize: 15, color: "#333" },
  txDate: { color: "#999", fontSize: 12, marginTop: 2 },
  txAmount: { fontWeight: "bold", fontSize: 16 },
  emptyBox: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999" },

  // ✅ Styles mới cho Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  inputLabel: { fontSize: 14, color: "#666", marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  submitBtn: {
    backgroundColor: "#1BA39C",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
