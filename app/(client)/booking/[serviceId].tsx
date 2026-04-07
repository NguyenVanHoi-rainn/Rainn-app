import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import MapView, { Marker } from "react-native-maps";

// Firebase
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebaseConfig";

export default function BookingDetailScreen() {
  const { serviceId, groupName } = useLocalSearchParams();
  const router = useRouter();

  const [subServices, setSubServices] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedSubService, setSelectedSubService] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [locationCoords, setLocationCoords] = useState<any>(null); // Lưu tọa độ {lat, lng}
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.9805,
    longitude: 106.6745,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // 1. Lấy dịch vụ con
  useEffect(() => {
    const fetchSubServices = async () => {
      try {
        const q = query(
          collection(db, "services"),
          where("categoryId", "==", serviceId),
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((doc) => doc.data().name);
        setSubServices(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchSubServices();
  }, [serviceId]);

  // 2. Xử lý bản đồ
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMapRegion({ ...mapRegion, latitude, longitude });
    setLocationCoords({ latitude, longitude });
  };

  const confirmLocation = () => {
    setShowMap(false);
  };

  // 3. Xử lý đặt lịch
  const handleConfirm = async () => {
    if (
      !selectedSubService ||
      !selectedDate ||
      !locationCoords ||
      (!price && !isNegotiable)
    ) {
      return Alert.alert("Thông báo", "Vui lòng nhập đầy đủ các thông tin (*)");
    }

    setLoading(true);
    try {
      const formattedTime = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      await addDoc(collection(db, "jobs"), {
        clientId: auth.currentUser?.uid,
        clientName: auth.currentUser?.displayName || "Khách hàng",
        groupService: groupName,
        subService: selectedSubService,
        description,
        workDate: selectedDate,
        workTime: formattedTime,
        // ✅ Lưu tọa độ thay vì địa chỉ chữ
        location: locationCoords,
        address: `Tọa độ: ${locationCoords.latitude.toFixed(4)}, ${locationCoords.longitude.toFixed(4)}`,
        price: isNegotiable ? "Thương lượng" : price.replace(/,/g, ""),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Thành công", "Yêu cầu của bạn đã được gửi!", [
        {
          text: "Về trang chủ",
          onPress: () => router.replace("/(client)/(tabs)" as any),
        },
      ]);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>1. Dịch vụ chi tiết *</Text>
        <View style={styles.subServiceGrid}>
          {subServices.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                selectedSubService === s && styles.chipActive,
              ]}
              onPress={() => setSelectedSubService(s)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSubService === s && styles.chipTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>2. Chọn ngày & giờ *</Text>
        <Calendar
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#1BA39C" },
          }}
          theme={{ todayTextColor: "#1BA39C", arrowColor: "#1BA39C" }}
          minDate={new Date().toISOString().split("T")[0]}
        />
        <TouchableOpacity
          style={styles.timePickerBtn}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={22} color="#1BA39C" />
          <Text style={styles.timeText}>
            Giờ hẹn:{" "}
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={true}
            onChange={(e, d) => {
              setShowTimePicker(false);
              if (d) setTime(d);
            }}
          />
        )}

        <Text style={styles.label}>3. Giá tiền mong muốn (VNĐ) *</Text>
        <View style={styles.priceContainer}>
          <TextInput
            placeholder="Ví dụ: 200,000"
            style={[
              styles.priceInput,
              isNegotiable && { backgroundColor: "#EEE" },
            ]}
            keyboardType="numeric"
            value={price}
            onChangeText={(t) => setPrice(t)}
            editable={!isNegotiable}
          />
          <TouchableOpacity
            style={[
              styles.negotiateBtn,
              isNegotiable && styles.negotiateBtnActive,
            ]}
            onPress={() => setIsNegotiable(!isNegotiable)}
          >
            <Text
              style={{
                color: isNegotiable ? "#fff" : "#1BA39C",
                fontWeight: "bold",
              }}
            >
              Thương lượng
            </Text>
          </TouchableOpacity>
        </View>

        {/* ✅ MỤC 4: CHỌN VỊ TRÍ (HIỂN THỊ TỌA ĐỘ) */}
        <Text style={styles.label}>4. Vị trí nơi làm việc *</Text>
        <TouchableOpacity
          style={[
            styles.locationBox,
            locationCoords && styles.locationBoxActive,
          ]}
          onPress={() => setShowMap(true)}
        >
          <MaterialIcons
            name="location-searching"
            size={22}
            color={locationCoords ? "#1BA39C" : "#666"}
          />
          <Text
            style={[
              styles.locationText,
              locationCoords && { color: "#1BA39C", fontWeight: "bold" },
            ]}
          >
            {locationCoords
              ? `Đã ghim: ${locationCoords.latitude.toFixed(4)}, ${locationCoords.longitude.toFixed(4)}`
              : "Nhấn để chọn vị trí trên bản đồ..."}
          </Text>
          {locationCoords && (
            <Ionicons name="checkmark-circle" size={18} color="#1BA39C" />
          )}
        </TouchableOpacity>

        <Text style={styles.label}>5. Mô tả chi tiết công việc</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          placeholder="Ghi chú thêm cho thợ..."
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>XÁC NHẬN ĐẶT LỊCH</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL CHỌN VỊ TRÍ */}
      <Modal visible={showMap} animationType="fade">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Text style={{ color: "#666" }}>Đóng</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: "bold" }}>
              Chạm bản đồ để ghim vị trí
            </Text>
            <TouchableOpacity onPress={confirmLocation}>
              <Text style={{ color: "#1BA39C", fontWeight: "bold" }}>Xong</Text>
            </TouchableOpacity>
          </View>
          <MapView
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            onPress={handleMapPress}
          >
            {locationCoords && <Marker coordinate={locationCoords} />}
          </MapView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  form: { padding: 20 },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
    marginTop: 15,
  },
  subServiceGrid: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F9F9F9",
  },
  chipActive: { backgroundColor: "#1BA39C", borderColor: "#1BA39C" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#fff", fontWeight: "bold" },
  timePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F0F9F8",
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1BA39C",
  },
  timeText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1BA39C",
  },
  priceContainer: { flexDirection: "row" },
  priceInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    fontSize: 16,
    fontWeight: "bold",
    color: "#1BA39C",
  },
  negotiateBtn: {
    marginLeft: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1BA39C",
    borderRadius: 12,
    justifyContent: "center",
  },
  negotiateBtnActive: { backgroundColor: "#1BA39C" },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  locationBoxActive: { borderColor: "#1BA39C", backgroundColor: "#F0F9F8" },
  locationText: { flex: 1, marginLeft: 10, color: "#666", fontSize: 14 },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: "#1BA39C",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
});
