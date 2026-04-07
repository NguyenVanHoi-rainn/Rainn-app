import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function ClientTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1BA39C",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        // ✅ Bỏ tabBarStyle ép cứng để Expo tự tối ưu theo từng dòng điện thoại
        // Điều này giúp icon tự động nằm trên phím ảo/vạch home
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: "Thanh toán",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "card" : "card-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Hoạt động",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile-edit"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
