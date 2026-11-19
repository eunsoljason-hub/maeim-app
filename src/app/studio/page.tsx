import type { Metadata } from "next";
import { StudioScreen } from "@/components/screens/StudioScreen";

export const metadata: Metadata = {
  title: "위젯 & 알림",
  description: "나만의 위젯을 미리 만들고, 내면으로 돌아오는 알람을 설정해요.",
};

export default function StudioPage() {
  return <StudioScreen />;
}
