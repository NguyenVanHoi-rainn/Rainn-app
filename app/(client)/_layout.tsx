import { Stack } from 'expo-router';

export default function ClientMainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Chạy vào nhóm Tabs trước */}
      <Stack.Screen name="(tabs)" /> 
      {/* Trang All Services ngoài Tab */}
      <Stack.Screen name="all-services" />
      {/* Đường dẫn booking */}
      <Stack.Screen name="booking/[serviceId]" />
    </Stack>
  );
}