import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// Firebase Config
import { auth, db } from "../../../configs/firebaseConfig";

// Cấu hình tiếng Việt cho lịch
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Th.1",
    "Th.2",
    "Th.3",
    "Th.4",
    "Th.5",
    "Th.6",
    "Th.7",
    "Th.8",
    "Th.9",
    "Th.10",
    "Th.11",
    "Th.12",
  ],
  dayNames: ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

interface Job {
  id: string;
  workDate: string;
  workTime: string;
  subService: string;
  address: string;
  status: string;
  workerId: string;
  clientId: string;
}

export default function WorkerScheduleScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [markedDates, setMarkedDates] = useState<any>({});

  // 1. Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Lấy danh sách công việc và xử lý tô màu đỏ
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "jobs"),
      where("workerId", "==", user.uid),
      where("status", "==", "accepted"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Job[];

        setMyJobs(jobList);

        // ✅ LOGIC TÔ VÒNG TRÒN ĐỎ CHO NGÀY CÓ VIỆC
        const marks: any = {};
        jobList.forEach((job) => {
          if (job.workDate) {
            marks[job.workDate] = {
              selected: true,
              selectedColor: "#FF5252", // Màu đỏ rực
              selectedTextColor: "#ffffff",
            };
          }
        });
        setMarkedDates(marks);
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi lấy lịch:", error.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Lọc việc cho ngày đang chọn
  const jobsOnSelectedDate = myJobs.filter(
    (job) => job.workDate === selectedDate,
  );

  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => router.push(`/(worker)/chat/${item.clientId}` as any)}
    >
      <View style={styles.jobTimeBox}>
        <Text style={styles.jobTimeText}>{item.workTime}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Đã nhận</Text>
        </View>
      </View>

      <View style={styles.jobMainInfo}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.subService}
        </Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={14} color="#1BA39C" />
          <Text style={styles.jobAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>

      <Ionicons name="chatbubble-ellipses-outline" size={24} color="#1BA39C" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch trình của tôi</Text>
        <TouchableOpacity
          onPress={() => router.push("/(worker)/(tabs)/chat-list" as any)}
        >
          <Ionicons name="chatbubbles-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={{
            ...markedDates, // Tất cả các ngày có việc (Vòng tròn đỏ)
            [selectedDate]: {
              ...markedDates[selectedDate],
              selected: true,
              // Nếu ngày chọn có việc -> Đỏ, nếu không có việc -> Xanh thương hiệu
              selectedColor: markedDates[selectedDate] ? "#FF5252" : "#1BA39C",
              selectedTextColor: "#fff",
            },
          }}
          theme={{
            todayTextColor: "#FF5252",
            arrowColor: "#1BA39C",
            textDayFontSize: 15,
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "600",
          }}
        />
      </View>

      <View style={styles.taskListContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Ngày {selectedDate}</Text>
          <Text style={styles.jobCount}>
            {jobsOnSelectedDate.length} công việc
          </Text>
        </View>

        {loading && !user ? (
          <ActivityIndicator color="#1BA39C" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={jobsOnSelectedDate}
            keyExtractor={(item) => item.id}
            renderItem={renderJobItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={60}
                  color="#DDD"
                />
                <Text style={styles.emptyText}>Ngày này bạn đang rảnh</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingTop: Platform.OS === "android" ? 45 : 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1BA39C" },
  calendarWrapper: {
    backgroundColor: "#fff",
    paddingBottom: 10,
    borderBottomWidth: 8,
    borderBottomColor: "#F9FAFB",
  },
  taskListContainer: { flex: 1 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  listTitle: { fontSize: 17, fontWeight: "bold", color: "#2D3436" },
  jobCount: { color: "#999", fontSize: 13 },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  jobTimeBox: {
    alignItems: "center",
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: "#EEE",
  },
  jobTimeText: { fontSize: 14, fontWeight: "bold", color: "#1BA39C" },
  statusBadge: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: { color: "#1BA39C", fontSize: 10, fontWeight: "bold" },
  jobMainInfo: { flex: 1, paddingHorizontal: 15 },
  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  addressRow: { flexDirection: "row", alignItems: "center" },
  jobAddress: { fontSize: 12, color: "#777", marginLeft: 4, flex: 1 },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 10, color: "#CCC", fontSize: 15 },
});
