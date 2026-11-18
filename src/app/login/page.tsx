import type { Metadata } from "next";
import { LoginScreen } from "@/components/screens/LoginScreen";

export const metadata: Metadata = {
  title: "로그인",
  description: "카카오 로그인으로 마음일기와 상담 예약을 계정에 저장하세요.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
