import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default function ManageUsers() {
  const router = useRouter();
  const [tab, setTab] = useState<'client' | 'worker'>('client');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Truy vấn theo role và lắng nghe thay đổi thực tế
    const q = query(collection(db, "users"), where("role", "==", tab));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tab]);

  // Khóa/Mở khóa: Tương tác trực tiếp với bảng users
  const toggleLock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    try {
      await updateDoc(doc(db, "users", id), { status: newStatus });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa tài khoản này?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        style: "destructive", 
        onPress: async () => await deleteDoc(doc(db, "users", id))
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý tài khoản</Text>
      </View>

      {/* SỬA LỖI: Đã định nghĩa tabHeader ở dưới */}
      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'client' && styles.tabBtnActive]} 
          onPress={() => setTab('client')}
        >
          <Text style={[styles.tabText, tab === 'client' && styles.tabTextActive]}>Clients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'worker' && styles.tabBtnActive]} 
          onPress={() => setTab('worker')}
        >
          <Text style={[styles.tabText, tab === 'worker' && styles.tabTextActive]}>Workers</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1BA39C" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userCard}
              onPress={() => Alert.alert("Thông tin", `Email: ${item.email}\nSĐT: ${item.phone || 'N/A'}`)}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName || "N/A"}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={styles.actionGroup}>
                <TouchableOpacity onPress={() => toggleLock(item.id, item.status)}>
                  <Ionicons 
                    name={item.status === 'locked' ? "lock-closed" : "lock-open"} 
                    size={24} 
                    color={item.status === 'locked' ? "#FF3B30" : "#4CD964"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 15 }}>
                  <Ionicons name="trash-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  tabHeader: { 
    flexDirection: 'row', backgroundColor: '#fff', padding: 10, 
    justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#EEE' 
  },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  tabBtnActive: { backgroundColor: '#1BA39C' },
  tabText: { color: '#666', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  userCard: { 
    flexDirection: 'row', padding: 15, backgroundColor: '#fff', 
    marginHorizontal: 15, marginTop: 10, borderRadius: 12, alignItems: 'center',
    elevation: 1
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 13, color: '#888' },
  actionGroup: { flexDirection: 'row', alignItems: 'center' }
});