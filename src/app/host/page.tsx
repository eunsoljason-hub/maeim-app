import type { Metadata } from "next";
import { HostScreen } from "@/components/screens/HostScreen";

export const metadata: Metadata = {
  title: "호스트 모드",
  description: "은솔님의 상담 준비 화면 — 슬롯 관리, 브리핑, 3줄 요약, 정산.",
  robots: { index: false, follow: false },
};

export default function HostPage() {
  return <HostScreen />;
}
