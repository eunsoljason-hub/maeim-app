import type { Metadata } from "next";
import { GrowthScreen } from "@/components/screens/GrowthScreen";

export const metadata: Metadata = {
  title: "성장",
  description: "욕구 피라미드 · 인생 육각형 · 인생 로드맵 · 만다라트로 지금의 나를 살펴봐요.",
};

export default function GrowthPage() {
  return <GrowthScreen />;
}
