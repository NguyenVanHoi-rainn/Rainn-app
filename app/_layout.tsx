import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";

// Cấu hình route mặc định khi mở app
export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Chỉ khai báo các nhóm folder thực sự có trong thư mục app/ */}

        {/* 1. Nhóm xác thực (Login/Register) */}
        <Stack.Screen name="(auth)" />

        {/* 2. Nhóm dành cho khách hàng */}
        <Stack.Screen name="(client)" />

        {/* 3. Nhóm dành cho thợ (Worker) */}
        <Stack.Screen name="(worker)/(tabs)" />
        {/* 4. Trang gốc (nếu có file index.tsx ngoài cùng) */}
        <Stack.Screen name="index" />

        {/* Nếu bạn không có folder (index) thì hãy xóa dòng dưới đây */}
        {/* <Stack.Screen name="(index)" /> */}
      </Stack>
    </ThemeProvider>
  );
}
