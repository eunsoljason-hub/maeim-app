import type { Metadata } from "next";
import { AffirmationsScreen } from "@/components/screens/AffirmationsScreen";

export const metadata: Metadata = {
  title: "확언",
  description: "긍정 · 부 · 자녀 · 비젼 확언 120문장과 나만의 확언 세션.",
};

export default function AffirmationsPage() {
  return <AffirmationsScreen />;
}
