import type { Metadata } from "next";
import { MeditationScreen } from "@/components/screens/MeditationScreen";

export const metadata: Metadata = {
  title: "명상",
  description: "3분 · 10분 · 20분 · 30분 명상과 자유 명상 타이머.",
};

export default function MeditationPage() {
  return <MeditationScreen />;
}
