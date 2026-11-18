import type { Metadata } from "next";
import { PlayerScreen } from "@/components/screens/PlayerScreen";
import { DEFAULT_COURSE_ID } from "@/lib/constants";

export const metadata: Metadata = {
  title: "명상 플레이어",
  description: "호흡과 배경 장면만 남기고, 10분 또는 20분의 명상을 시작해 보세요.",
};

export default function PlayerPage() {
  return <PlayerScreen courseId={DEFAULT_COURSE_ID} />;
}
