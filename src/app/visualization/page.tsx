import type { Metadata } from "next";
import { VisualizationScreen } from "@/components/screens/VisualizationScreen";

export const metadata: Metadata = {
  title: "시각화",
  description: "아침 · 비우기 · 소망 세 가지 시각화와 가이드 스크립트.",
};

export default function VisualizationPage() {
  return <VisualizationScreen />;
}
