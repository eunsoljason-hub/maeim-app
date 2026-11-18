import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentFailScreen } from "@/components/screens/PaymentFailScreen";

export const metadata: Metadata = {
  title: "결제 실패",
  robots: { index: false, follow: false },
};

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <p className="tiny">결제 결과를 확인하는 중…</p>
        </main>
      }
    >
      <PaymentFailScreen />
    </Suspense>
  );
}
