import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentSuccessScreen } from "@/components/screens/PaymentSuccessScreen";

export const metadata: Metadata = {
  title: "결제 확인",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <p className="tiny">결제를 확인하는 중…</p>
        </main>
      }
    >
      <PaymentSuccessScreen />
    </Suspense>
  );
}
