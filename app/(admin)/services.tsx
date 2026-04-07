import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, SafeAreaView, Platform 
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Firebase
import { db } from "../../configs/firebaseConfig";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

export default function ManageServices() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    // Lấy danh mục để hiển thị thanh chọn
    const unsubscribe = onSnapshot(collection(db, "categories"), (snap) => {
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats);
      if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCatId) {
      const q = query(collection(db, "services"), where("categoryId", "==", selectedCatId));
      const unsubscribe = onSnapshot(q, (snap) => {
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
    }
  }, [selectedCatId]);

  const handleSave = async () => {
    if (!serviceName.trim() || !selectedCatId) return;
    try {
      if (editId) {
        await updateDoc(doc(db, "services", editId), { name: serviceName });
      } else {
        await addDoc(collection(db, "services"), { name: serviceName, categoryId: selectedCatId });
      }
      setModalVisible(false); setServiceName(""); setEditId(null);
    } catch (e) { Alert.alert("Lỗi", "Không thể lưu dịch vụ"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ HEADER MỚI CÓ MŨI TÊN THOÁT */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Dịch vụ</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>1. Chọn danh mục lớn</Text>
        <View style={styles.catContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.catChip, selectedCatId === item.id && styles.catActive]}
                onPress={() => setSelectedCatId(item.id)}
              >
                <Text style={[styles.catText, selectedCatId === item.id && { color: '#fff', fontWeight: 'bold' }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>2. Các dịch vụ con ({services.length})</Text>
          <TouchableOpacity onPress={() => { setEditId(null); setServiceName(""); setModalVisible(true); }}>
            <Ionicons name="add-circle" size={32} color="#1BA39C" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.serviceItem}>
              <View style={styles.serviceIcon}>
                <MaterialIcons name="settings-suggest" size={20} color="#1BA39C" />
              </View>
              <Text style={styles.serviceName}>{item.name}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => { setEditId(item.id); setServiceName(item.name); setModalVisible(true); }}>
                  <Ionicons name="create-outline" size={22} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDoc(doc(db, "services", item.id))} style={{ marginLeft: 15 }}>
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có dịch vụ nào trong danh mục này</Text>
            </View>
          }
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{editId ? "Cập nhật dịch vụ" : "Thêm dịch vụ con"}</Text>
            <TextInput 
              style={styles.input} 
              placeholder="VD: Sửa quạt điện, Lau nhà..." 
              value={serviceName} 
              onChangeText={setServiceName}
              autoFocus 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>XÁC NHẬN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#666', marginBottom: 12 },
  catContainer: { marginBottom: 20 },
  catChip: { 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    backgroundColor: '#fff', 
    borderRadius: 25, 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: '#EEE',
    elevation: 1
  },
  catActive: { backgroundColor: '#1BA39C', borderColor: '#1BA39C' },
  catText: { color: '#666', fontSize: 14 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  serviceItem: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 12, 
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05
  },
  serviceIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  serviceName: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333', fontWeight: '500' },
  actionRow: { flexDirection: 'row' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#AAA', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalBody: { backgroundColor: '#fff', padding: 25, borderRadius: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { width: '100%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  saveBtn: { backgroundColor: '#1BA39C', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { marginTop: 15 },
  closeText: { color: '#999', fontSize: 14 }
});