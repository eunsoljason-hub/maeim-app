"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import type { PendingBooking } from "@/lib/payments/pending";
import { PENDING_BOOKING_KEY, readJson, removeKey } from "@/lib/storage";

export function PaymentFailScreen() {
  const params = useSearchParams();
  const { hydrated, dataReady, authLoading, configured, user, updateBooking } = useApp();
  const [reason, setReason] = useState("결제가 취소되었습니다.");
  const [done, setDone] = useState(false);
  const ranRef = useRef(false);

  const ready =
    hydrated && dataReady && !authLoading && (!configured || Boolean(user));

  useEffect(() => {
    if (!ready || ranRef.current) return;
    ranRef.current = true;

    const message = params.get("message");
    if (message) setReason(message);

    const stored = readJson<PendingBooking | null>(PENDING_BOOKING_KEY, null);
    if (stored) {
      void updateBooking(stored.bookingId, {
        status: "cancelled",
        paymentStatus: "failed",
      })
        .catch(() => undefined)
        .finally(() => {
          removeKey(PENDING_BOOKING_KEY);
          setDone(true);
        });
    } else {
      setDone(true);
    }
  }, [ready, params, updateBooking]);

  return (
    <main className="page">
      <div className="card" style={{ marginTop: 24, padding: "26px 20px" }}>
        <div className="done-wrap">
          <div
            className="done-check"
            style={{ background: "#f3e4e0", color: "#a4584a" }}
            aria-hidden="true"
          >
            !
          </div>
          <h3>결제가 완료되지 않았어요</h3>
          <p>{reason}</p>
          {done && (
            <p className="tiny" style={{ marginTop: 8 }}>
              예약은 자동으로 취소되었고, 결제는 청구되지 않았어요.
            </p>
          )}
        </div>
        <Link href="/counseling" className="btn" style={{ width: "100%", marginTop: 16 }}>
          다른 시간으로 예약하기
        </Link>
        <Link
          href="/"
          className="btn ghost"
          style={{ width: "100%", marginTop: 8 }}
        >
          명상으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
