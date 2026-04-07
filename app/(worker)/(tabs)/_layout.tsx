import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerTabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#1BA39C',
      headerShown: false,
    }}>
      {/* Các tab muốn hiện ở dưới */}
      <Tabs.Screen name="index" options={{
        title: 'Trang chủ',
        tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
      }} />

      <Tabs.Screen name="schedule" options={{
        title: 'Lịch làm',
        tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
      }} />

      {/* ẨN PROFILE KHỎI THANH TAB DƯỚI */}
       <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
        tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
       />
      <Tabs.Screen 
        name="profile-edit" 
        options={{
          href: null, // Dòng này giúp ẩn hoàn toàn nút profile-edit ở thanh dưới
        }} 
       />

      <Tabs.Screen name="chat-list" options={{
        title: 'Tin nhắn',
        tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
      }} />

      <Tabs.Screen name="wallet" options={{
        title: 'Ví tiền',
        tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
      }} />
    </Tabs>
  );
}