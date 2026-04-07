import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, SafeAreaView, ScrollView 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export default function ManageCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // States cho Form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("apps");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    // Lắng nghe dữ liệu danh mục thực tế
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Lỗi", "Vui lòng nhập tên danh mục");
    
    try {
      if (editId) {
        // Cập nhật
        await updateDoc(doc(db, "categories", editId), { name, icon });
      } else {
        // Thêm mới
        await addDoc(collection(db, "categories"), {
          name,
          icon,
          createdAt: serverTimestamp()
        });
      }
      setModalVisible(false);
      setName(""); setIcon("apps"); setEditId(null);
    } catch (e) { Alert.alert("Lỗi", "Không thể lưu dữ liệu"); }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Xác nhận", "Xóa danh mục này sẽ ảnh hưởng đến các dịch vụ con bên trong!", [
      { text: "Hủy" },
      { text: "Xóa", onPress: async () => await deleteDoc(doc(db, "categories", id)), style: "destructive" }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Danh mục</Text>
        <TouchableOpacity onPress={() => { setEditId(null); setName(""); setModalVisible(true); }}>
          <Ionicons name="add-circle" size={30} color="#1BA39C" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon as any} size={24} color="#1BA39C" />
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.actionBtns}>
              <TouchableOpacity onPress={() => { setEditId(item.id); setName(item.name); setIcon(item.icon); setModalVisible(true); }}>
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ marginLeft: 15 }}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{editId ? "Sửa danh mục" : "Thêm danh mục mới"}</Text>
            
            <Text style={styles.label}>Tên danh mục:</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Điện nước" />
            
            <Text style={styles.label}>Icon (Tên Ionicons):</Text>
            <TextInput style={styles.input} value={icon} onChangeText={setIcon} placeholder="VD: water, flash, construct" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: '#666' }}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 12, elevation: 1 },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center' },
  itemName: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },
  actionBtns: { flexDirection: 'row' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBody: { backgroundColor: '#fff', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  label: { alignSelf: 'flex-start', marginBottom: 5, color: '#666' },
  input: { width: '100%', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 12, marginBottom: 20 },
  saveBtn: { backgroundColor: '#1BA39C', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});