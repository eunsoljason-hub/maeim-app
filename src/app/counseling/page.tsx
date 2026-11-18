import type { Metadata } from "next";
import { CounselingScreen } from "@/components/screens/CounselingScreen";

export const metadata: Metadata = {
  title: "1:1 마이크로 상담",
  description:
    "은솔님과 3·5·10분으로 이야기하는 1:1 마이크로 리스닝 상담. 3,900원부터, 선결제·1시간 전 무료 취소.",
};

export default function CounselingPage() {
  return <CounselingScreen />;
}
