import type { Metadata } from "next";
import { DiaryScreen } from "@/components/screens/DiaryScreen";

export const metadata: Metadata = {
  title: "마음일기",
  description: "명상 전후의 감정과 마음의 크기를 남겨보세요. 아무도 평가하지 않아요.",
};

export default function DiaryPage() {
  return <DiaryScreen />;
}
