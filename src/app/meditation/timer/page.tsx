import type { Metadata } from "next";
import { TimerScreen } from "@/components/screens/TimerScreen";

export const metadata: Metadata = {
  title: "자유 명상 타이머",
  description: "원하는 만큼 앉아 있고, 끝나면 실제 명상 시간이 분:초로 기록돼요.",
};

export default function TimerPage() {
  return <TimerScreen />;
}
