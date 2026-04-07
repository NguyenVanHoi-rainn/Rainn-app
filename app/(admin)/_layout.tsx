import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="services" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="jobs" />
      <Stack.Screen name="verify-workers" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}