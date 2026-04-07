import { Redirect } from "expo-router";

export default function Index() {
  // Tự động chuyển hướng người dùng vào nhóm (auth) và trang login
  return <Redirect href="/(auth)/login" />;
}