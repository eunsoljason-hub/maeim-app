"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { HOST } from "@/lib/constants";
import { addMinutesToTime, fmtDateLong, fmtWon } from "@/lib/date";
import type { PendingBooking } from "@/lib/payments/pending";
import { PENDING_BOOKING_KEY, readJson, removeKey } from "@/lib/storage";

type Phase = "confirming" | "done" | "error";

export function PaymentSuccessScreen() {
  const params = useSearchParams();
  const { hydrated, dataReady, authLoading, configured, user, updateBooking } = useApp();
  const [phase, setPhase] = useState<Phase>("confirming");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const ranRef = useRef(false);

  const ready =
    hydrated && dataReady && !authLoading && (!configured || Boolean(user));

  useEffect(() => {
    if (!ready || ranRef.current) return;
    ranRef.current = true;

    const stored = readJson<PendingBooking | null>(PENDING_BOOKING_KEY, null);
    setPending(stored);

    if (configured && !user) {
      setPhase("error");
      setMessage(
        "로그인 세션이 만료되어 예약을 확인하지 못했어요. 다시 로그인한 뒤 예약 목록을 확인해 주세요.",
      );
      return;
    }

    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId") ?? stored?.orderId ?? "";
    const amount = Number(params.get("amount") ?? stored?.amount ?? 0);

    if (!stored || !paymentKey) {
      setPhase("error");
      setMessage("결제 정보를 찾을 수 없어요. 예약 목록을 확인해 주세요.");
      if (stored) {
        void updateBooking(stored.bookingId, {
          status: "cancelled",
          paymentStatus: "failed",
        })
          .catch(() => undefined)
          .finally(() => removeKey(PENDING_BOOKING_KEY));
      }
      return;
    }

    if (orderId !== stored.orderId) {
      setPhase("error");
      setMessage("주문 번호가 일치하지 않아요. 예약 목록을 확인해 주세요.");
      return;
    }

    (async () => {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId: stored.orderId,
            amount,
            minutes: stored.minutes,
          }),
        });
        const result = (await response.json()) as {
          ok?: boolean;
          error?: string;
          status?: string;
          demo?: boolean;
        };
        if (!response.ok || !result.ok) {
          throw new Error(result.error ?? "결제 승인에 실패했어요");
        }
        await updateBooking(stored.bookingId, {
          status: "confirmed",
          paymentStatus: result.demo ? "demo" : "paid",
          paymentKey,
        });
        removeKey(PENDING_BOOKING_KEY);
        setPhase("done");
      } catch (error) {
        await updateBooking(stored.bookingId, {
          status: "cancelled",
          paymentStatus: "failed",
        }).catch(() => undefined);
        removeKey(PENDING_BOOKING_KEY);
        setPhase("error");
        setMessage(
          error instanceof Error ? error.message : "결제를 확인하지 못했어요",
        );
      }
    })();
  }, [ready, params, updateBooking, configured, user]);

  return (
    <main className="page">
      <div className="card" style={{ marginTop: 24, padding: "26px 20px" }}>
        {phase === "confirming" && (
          <div className="done-wrap">
            <div className="done-check" aria-hidden="true">
              …
            </div>
            <h3>결제를 확인하고 있어요</h3>
            <p>잠시만 기다려 주세요. 창을 닫지 마세요.</p>
          </div>
        )}

        {phase === "done" && pending && (
          <>
            <div className="done-wrap">
              <div className="done-check" aria-hidden="true">
                ✓
              </div>
              <h3>예약이 완료됐어요</h3>
              <p>
                {fmtDateLong(pending.dateKey)} {pending.time}–
                {addMinutesToTime(pending.time, pending.minutes)} · {pending.minutes}분
                <br />
                {HOST.displayName}과의 1:1 리스닝 상담
              </p>
            </div>
            <div className="sum">
              <div className="sum-row">
                <span>결제 금액</span>
                <b>{fmtWon(pending.amount)}</b>
              </div>
              <div className="sum-row">
                <span>입장</span>
                <b>시작 3분 전 알림</b>
              </div>
              <div className="sum-row">
                <span>취소</span>
                <b>시작 1시간 전까지 무료</b>
              </div>
            </div>
            <Link
              href="/counseling"
              className="btn"
              style={{ width: "100%", marginTop: 16 }}
            >
              내 예약 확인하기
            </Link>
            <Link
              href="/diary?moment=before"
              className="btn ghost"
              style={{ width: "100%", marginTop: 8 }}
            >
              상담 전 마음일기 남기기
            </Link>
          </>
        )}

        {phase === "error" && (
          <>
            <div className="done-wrap">
              <div
                className="done-check"
                style={{ background: "#f3e4e0", color: "#a4584a" }}
                aria-hidden="true"
              >
                !
              </div>
              <h3>결제를 완료하지 못했어요</h3>
              <p>{message}</p>
            </div>
            <Link href="/counseling" className="btn" style={{ width: "100%", marginTop: 16 }}>
              다시 예약하기
            </Link>
            <p className="fine">
              결제가 승인되었는데 이 화면이 보인다면, 카드사 앱의 승인 내역을 확인한 뒤
              문의해 주세요. 중복 결제는 전액 환불됩니다.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
