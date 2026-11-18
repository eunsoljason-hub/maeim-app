"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import {
  canCancelFree,
  isDailyCapReached,
  slotStateFor,
  SLOT_STATE_LABEL,
} from "@/lib/booking";
import {
  COUNSELING_LENGTHS,
  CRISIS_LINES,
  HOST,
  LENGTH_HINTS,
  LENGTH_PROTOCOLS,
  LISTENING_DISCLAIMER,
  PAYMENT_METHODS,
  PRICES,
  SLOT_TIMES,
  type CounselingLength,
} from "@/lib/constants";
import {
  addMinutesToTime,
  dateKey,
  dateKeyOfOffset,
  fmtDateLong,
  fmtDateShort,
  fmtRelativeDay,
  fmtWon,
} from "@/lib/date";
import { isTossConfigured, requestTossPayment } from "@/lib/payments/toss";
import { PENDING_BOOKING_KEY, writeJson } from "@/lib/storage";
import type { Booking, PaymentMethodId } from "@/lib/types";

export function CounselingScreen() {
  const router = useRouter();
  const {
    slots,
    bookings,
    notes,
    diaries,
    user,
    configured,
    mode,
    dataReady,
    hydrated,
    createBooking,
    updateBooking,
    toast,
  } = useApp();

  const [now, setNow] = useState<Date | null>(null);
  const [minutes, setMinutes] = useState<CounselingLength>(3);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"booking" | "done" | null>(null);
  const [method, setMethod] = useState<PaymentMethodId>("card");
  const [consent, setConsent] = useState(false);
  const [briefingConsent, setBriefingConsent] = useState(true);
  const [paying, setPaying] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const expiredChecked = useRef(false);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  /* 결제창을 닫아 남은 'pending' 예약이 슬롯을 영구히 잡지 않도록 20분 뒤 정리한다. */
  useEffect(() => {
    if (!hydrated || expiredChecked.current) return;
    expiredChecked.current = true;
    const cutoff = Date.now() - 20 * 60 * 1000;
    for (const booking of bookings) {
      if (
        booking.mine &&
        booking.status === "pending" &&
        new Date(booking.createdAt).getTime() < cutoff
      ) {
        void updateBooking(booking.id, {
          status: "cancelled",
          paymentStatus: "failed",
        }).catch(() => undefined);
      }
    }
  }, [hydrated, bookings, updateBooking]);

  const today = now ? dateKey(now) : dateKeyOfOffset(0);
  const tomorrow = now ? dateKeyOfOffset(1, now) : dateKeyOfOffset(1);
  /* "" until mount so the prerendered HTML always matches the first client render. */
  const activeDate = selectedDate || today;

  const price = PRICES[minutes] ?? 0;

  const slotStates = useMemo(() => {
    if (!now) return [] as { time: string; state: ReturnType<typeof slotStateFor> }[];
    return SLOT_TIMES.map((time) => ({
      time,
      state: slotStateFor(activeDate, time, slots, bookings, now),
    }));
  }, [slots, bookings, activeDate, now]);

  const capReached = useMemo(
    () => (now ? isDailyCapReached(bookings, activeDate) : false),
    [bookings, activeDate, now],
  );

  const myBookings = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.mine &&
            (b.status === "pending" ||
              b.status === "confirmed" ||
              b.status === "completed"),
        )
        .sort((a, b) => `${a.dateKey}${a.time}`.localeCompare(`${b.dateKey}${b.time}`)),
    [bookings],
  );

  const openCount = slotStates.filter((s) => s.state === "open").length;

  const myNotes = useMemo(
    () =>
      notes.filter((note) =>
        bookings.some((booking) => booking.id === note.bookingId && booking.mine),
      ),
    [notes, bookings],
  );

  const selectDate = (key: string) => {
    setSelectedDate(key);
    setSelectedTime(null);
  };

  const openBookingSheet = () => {
    if (!selectedTime) {
      toast("가능한 시간을 먼저 골라주세요");
      return;
    }
    if (!now) return;
    const state = slotStateFor(activeDate, selectedTime, slots, bookings, now);
    if (state !== "open") {
      toast(
        state === "booked"
          ? "방금 예약이 잡힌 시간이에요. 다른 시간을 골라주세요."
          : "지금은 예약할 수 없는 시간이에요.",
      );
      return;
    }
    if (configured && !user) {
      toast("로그인 후 예약할 수 있어요");
      router.push("/login?next=/counseling");
      return;
    }
    if (configured && !dataReady) {
      toast("예약 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setConsent(false);
    setSheet("booking");
  };

  const pay = async () => {
    if (!selectedTime) return;
    if (!consent) {
      toast("리스닝 서비스 안내와 취소·환불 규정에 동의해 주세요");
      return;
    }
    if (!now) return;
    if (configured && !dataReady) {
      toast("예약 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (slotStateFor(activeDate, selectedTime, slots, bookings, now) !== "open") {
      toast("이미 마감된 시간이에요");
      setSheet(null);
      return;
    }
    if (paying) return;
    setPaying(true);
    let booking: Booking | null = null;
    try {
      booking = await createBooking({
        dateKey: activeDate,
        time: selectedTime,
        minutes,
        consentListening: true,
        consentBriefing: briefingConsent,
      });
      setLastBooking(booking);

      const useRealToss = isTossConfigured() && mode === "supabase";
      if (useRealToss) {
        writeJson(PENDING_BOOKING_KEY, {
          bookingId: booking.id,
          orderId: booking.orderId,
          minutes,
          amount: booking.price,
          dateKey: activeDate,
          time: selectedTime,
        });
        const tossMethod =
          PAYMENT_METHODS.find((m) => m.id === method)?.tossMethod ?? "CARD";
        await requestTossPayment({
          amount: booking.price,
          orderId: booking.orderId ?? "",
          orderName: `${HOST.displayName} ${minutes}분 리스닝 상담`,
          method: tossMethod,
          customerName: user?.name,
        });
        return; // browser is redirected to /counseling/success
      }

      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: `demo_${booking.id}`,
          orderId: booking.orderId,
          amount: booking.price,
          minutes,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        demo?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "결제를 확인하지 못했어요");
      }

      const paymentStatus = result.demo ? "demo" : "paid";
      await updateBooking(booking.id, {
        status: "confirmed",
        paymentStatus,
        paymentKey: `demo_${booking.id}`,
      });
      setLastBooking({
        ...booking,
        status: "confirmed",
        paymentStatus,
        paymentKey: `demo_${booking.id}`,
      });
      setSheet("done");
      setConsent(false);
      setSelectedTime(null);
      toast("예약이 완료됐어요");
    } catch (error) {
      if (booking) {
        await updateBooking(booking.id, {
          status: "cancelled",
          paymentStatus: "failed",
        }).catch(() => undefined);
      }
      toast(error instanceof Error ? error.message : "결제를 완료하지 못했어요");
    } finally {
      setPaying(false);
    }
  };

  const cancelBooking = async (booking: Booking) => {
    if (!now) return;
    if (!canCancelFree(booking, now)) {
      toast("시작 1시간 전까지만 무료로 취소할 수 있어요");
      return;
    }
    if (cancelId !== booking.id) {
      setCancelId(booking.id);
      window.setTimeout(() => setCancelId(null), 2600);
      return;
    }
    setCancelId(null);
    try {
      if (booking.paymentStatus === "paid" && booking.paymentKey) {
        const response = await fetch("/api/payments/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey: booking.paymentKey,
            cancelReason: "고객 요청 (상담 1시간 전 무료 취소)",
            amount: booking.price,
          }),
        });
        const result = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !result.ok) {
          throw new Error(result.error ?? "환불 요청에 실패했어요");
        }
      }
      await updateBooking(booking.id, {
        status: "cancelled",
        paymentStatus:
          booking.paymentStatus === "paid" ? "cancelled" : booking.paymentStatus,
      });
      toast(
        booking.paymentStatus === "paid"
          ? "예약을 취소하고 환불을 요청했어요"
          : "예약을 취소했어요",
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "취소하지 못했어요");
    }
  };

  const protocol = LENGTH_PROTOCOLS[minutes];

  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">1:1 마이크로 상담</p>
          <h1>3분부터, 이야기해요</h1>
        </div>
        <Link href="/host" className="switch" aria-label="호스트 모드 열기">
          <span className="track" aria-hidden="true">
            <span className="knob" />
          </span>
          <span className="sw-text">호스트 모드</span>
        </Link>
      </header>

      <section className="card host-card">
        <div className="host-avatar" aria-hidden="true">
          {HOST.initial}
        </div>
        <div className="txt">
          <b>{HOST.displayName}</b>
          <p>{HOST.intro}</p>
          <div className="stars">
            ★ {HOST.rating}
            <span>
              · 리스닝 {HOST.sessionCount}회 · 평균 {HOST.averageMinutes}분
            </span>
          </div>
        </div>
      </section>

      {configured && !user && (
        <div className="notice" style={{ marginTop: 12 }}>
          <span aria-hidden="true">🔑</span>
          <span>
            <strong>로그인하면</strong> 예약과 마음일기가 계정에 저장되고, 기기를 바꿔도 이어져요.
            <Link href="/login" className="link" style={{ marginLeft: 6 }}>
              카카오로 로그인 ›
            </Link>
          </span>
        </div>
      )}

      <div className="section-head">
        <h2>상담 길이</h2>
        <span className="tiny">짧아도 괜찮아요</span>
      </div>
      <div className="length-row">
        {COUNSELING_LENGTHS.map((value) => (
          <button
            key={value}
            type="button"
            className={`len ${minutes === value ? "on" : ""}`}
            onClick={() => setMinutes(value)}
            aria-pressed={minutes === value}
          >
            <b>{value}분</b>
            <span className="price">{fmtWon(PRICES[value])}</span>
            <span className="hint">{LENGTH_HINTS[value]}</span>
          </button>
        ))}
      </div>

      <div className="section-head">
        <h2>가능한 시간</h2>
        <span className="tiny">
          {HOST.displayName}이 연 슬롯 · {openCount}개 열림
        </span>
      </div>
      <div className="seg inline" role="tablist" aria-label="날짜 선택">
        {now ? (
          <>
            <button
              type="button"
              className={activeDate === today ? "on" : ""}
              onClick={() => selectDate(today)}
              role="tab"
              aria-selected={activeDate === today}
            >
              오늘 {fmtDateShort(today)}
            </button>
            <button
              type="button"
              className={activeDate === tomorrow ? "on" : ""}
              onClick={() => selectDate(tomorrow)}
              role="tab"
              aria-selected={activeDate === tomorrow}
            >
              내일 {fmtDateShort(tomorrow)}
            </button>
          </>
        ) : (
          <span className="tiny" style={{ padding: "0 10px" }}>
            날짜를 불러오는 중…
          </span>
        )}
      </div>

      <div className="slot-grid">
        {slotStates.map(({ time, state }) => {
          const label = SLOT_STATE_LABEL[state];
          const active = selectedTime === time;
          return (
            <button
              key={time}
              type="button"
              className={`slot ${active ? "on" : ""} ${state === "open" ? "" : "dead"}`}
              disabled={state !== "open"}
              onClick={() => setSelectedTime(time)}
              aria-pressed={active}
              aria-label={`${time} ${label}`}
            >
              <b>{time}</b>
              <small>{active ? "선택됨" : label}</small>
            </button>
          );
        })}
      </div>

      {capReached && (
        <p className="tiny" style={{ marginTop: 10 }}>
          이 날은 하루 상한(6건)에 도달했어요. 내일 슬롯을 이용해 주세요.
        </p>
      )}

      <div className="selbar">
        <div className="sel-info">
          <span>
            {minutes}분 ·{" "}
            {selectedTime
              ? `${selectedTime}–${addMinutesToTime(selectedTime, minutes)}`
              : "시간을 골라주세요"}
          </span>
          <small>{fmtWon(price)}</small>
        </div>
        <button
          type="button"
          className="btn"
          onClick={openBookingSheet}
          disabled={!selectedTime}
        >
          예약하기
        </button>
      </div>

      <div className="notice crisis" style={{ marginTop: 16 }}>
        <span aria-hidden="true">🌿</span>
        <span>
          <strong>상담은 의료 행위가 아닌 리스닝 서비스예요.</strong> 심리상담·치료·진단이 아니며,
          위기 상황에서는{" "}
          {CRISIS_LINES.map((line, index) => (
            <span key={line.number}>
              {index > 0 ? ", " : ""}
              {line.label}{" "}
              <a
                href={`tel:${line.number.replace(/-/g, "")}`}
                style={{ fontWeight: 700, textDecoration: "underline" }}
              >
                {line.number}
              </a>
            </span>
          ))}
          에 연락해 주세요.
        </span>
      </div>

      {diaries.length >= 3 && (
        <div className="card briefing" style={{ marginTop: 14 }}>
          <div className="row">
            <h3>상담 전, {HOST.displayName}이 미리 읽어요</h3>
            <span className="spacer" />
            <span className="tiny">동의한 경우만</span>
          </div>
          <ul>
            <li>최근 7일 마음일기에서 감정 흐름과 자주 나온 말을 요약해요.</li>
            <li>같은 이야기를 처음부터 다시 하지 않아도 돼요.</li>
            <li>{minutes}분 상담에는 {protocol.title}로 들어가요.</li>
          </ul>
        </div>
      )}

      <div className="section-head">
        <h2>내 예약</h2>
        <span className="tiny">{myBookings.length}건</span>
      </div>
      <div className="stack">
        {myBookings.length === 0 ? (
          <div className="empty">
            <span className="e">🗓️</span>
            아직 예약이 없어요.
            <br />
            3분부터 가볍게 시작해 보세요.
          </div>
        ) : (
          myBookings.map((booking) => {
            const freeCancel = now ? canCancelFree(booking, now) : false;
            return (
              <div key={booking.id} className="book">
                <div className="book-top">
                  <b>
                    {fmtRelativeDay(booking.dateKey, now ?? new Date())} {booking.time}–
                    {addMinutesToTime(booking.time, booking.minutes)}
                  </b>
                  <span className="who">
                    {booking.status === "completed"
                      ? "상담 완료"
                      : booking.status === "pending"
                        ? "결제 확인 중"
                        : booking.paymentStatus === "demo"
                          ? "데모 결제"
                          : "결제 완료"}
                  </span>
                </div>
                <div className="book-meta">
                  <span className="pill">{booking.minutes}분</span>
                  <span>{fmtWon(booking.price)}</span>
                  <span>· {HOST.displayName}</span>
                  <span className="pill lav">1:1 리스닝</span>
                </div>
                {booking.status === "completed" ? (
                  <p className="tiny" style={{ marginTop: 9 }}>
                    상담이 끝났어요 · 아래 ‘상담 후 받은 요약’에서 확인할 수 있어요
                  </p>
                ) : (
                  <button
                    type="button"
                    className="cancel"
                    onClick={() => cancelBooking(booking)}
                    disabled={!freeCancel}
                  >
                    {!freeCancel
                      ? "시작 1시간 전까지만 무료 취소"
                      : cancelId === booking.id
                        ? "한 번 더 누르면 취소돼요"
                        : "예약 취소"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="tiny" style={{ marginTop: 18, lineHeight: 1.7 }}>
        상담은 선결제예요. 시작 1시간 전까지 무료 취소·환불되며, 그 이후에는 환불되지 않아요.
        상담은 카카오톡 채널 또는 전화로 진행되고, 시작 3분 전에 알림을 보내드려요.
      </p>

      {myNotes.length > 0 && (
        <>
          <div className="section-head">
            <h2>상담 후 받은 요약</h2>
            <span className="tiny">{myNotes.length}건</span>
          </div>
          <div className="stack">
            {myNotes.map((note) => (
              <div key={note.id} className="card briefing">
                <h3>3줄 요약</h3>
                <ul>
                  {[note.line1, note.line2, note.line3]
                    .filter((line) => line.trim())
                    .map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                </ul>
                {note.nextStep && (
                  <p className="tiny" style={{ marginTop: 8 }}>
                    다음 한 걸음 · <b style={{ color: "var(--sage)" }}>{note.nextStep}</b>
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        <Link href="/terms" style={{ textDecoration: "underline" }}>
          이용약관
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" style={{ textDecoration: "underline" }}>
          개인정보처리방침
        </Link>{" "}
        ·{" "}
        <Link href="/refund" style={{ textDecoration: "underline" }}>
          취소·환불 정책
        </Link>
      </p>

      <Sheet
        open={sheet === "booking"}
        onClose={() => {
          setSheet(null);
          setConsent(false);
        }}
        labelledBy="booking-title"
      >
        <h3 id="booking-title">예약 확인</h3>
        <p className="lead">짧은 상담이에요. 편한 마음으로 오세요.</p>
        <div className="sum">
          <div className="sum-row">
            <span>상담</span>
            <b>
              {HOST.displayName} · 1:1 리스닝
            </b>
          </div>
          <div className="sum-row">
            <span>일시</span>
            <b>
              {fmtDateLong(activeDate)} {selectedTime}–
              {selectedTime ? addMinutesToTime(selectedTime, minutes) : ""}
            </b>
          </div>
          <div className="sum-row">
            <span>길이</span>
            <b>{minutes}분</b>
          </div>
          <div className="sum-row">
            <span>결제 금액</span>
            <b>{fmtWon(price)}</b>
          </div>
        </div>

        <div className="pay-list" role="radiogroup" aria-label="결제 수단">
          {PAYMENT_METHODS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`pay ${method === option.id ? "on" : ""}`}
              onClick={() => setMethod(option.id)}
              role="radio"
              aria-checked={method === option.id}
            >
              <span className="radio" aria-hidden="true" />
              {option.label}
              <span className="sub">
                {isTossConfigured() && mode === "supabase" ? "토스페이먼츠" : option.sub}
              </span>
            </button>
          ))}
        </div>

        <div className="notice" style={{ marginTop: 14 }}>
          <span aria-hidden="true">🌿</span>
          <span>{LISTENING_DISCLAIMER}</span>
        </div>

        <button
          type="button"
          className={`agree ${consent ? "on" : ""}`}
          onClick={() => setConsent((prev) => !prev)}
          aria-pressed={consent}
        >
          <span className="box" aria-hidden="true" />
          <span>
            <b>[필수]</b> 상담이 의료 행위가 아닌 리스닝 서비스임을 이해했고, 취소·환불 규정에
            동의해요.
          </span>
        </button>

        <button
          type="button"
          className={`agree ${briefingConsent ? "on" : ""}`}
          onClick={() => setBriefingConsent((prev) => !prev)}
          aria-pressed={briefingConsent}
        >
          <span className="box" aria-hidden="true" />
          <span>
            <b>[선택]</b> 상담 준비를 위해 최근 7일 마음일기 요약을 호스트에게 보여주는 것에
            동의해요.
          </span>
        </button>

        <button
          type="button"
          className="btn block"
          onClick={pay}
          disabled={!consent || paying}
        >
          {paying ? "결제 중…" : `${fmtWon(price)} 결제하고 예약`}
        </button>
        <p className="fine">
          {isTossConfigured() && mode === "supabase"
            ? "토스페이먼츠 결제창으로 이동해요. 테스트 키라면 실제 청구되지 않아요."
            : "데모 모드예요. 결제는 실제로 청구되지 않고 예약만 저장돼요."}
        </p>
      </Sheet>

      <Sheet
        open={sheet === "done" && !!lastBooking}
        onClose={() => setSheet(null)}
        labelledBy="booking-done-title"
      >
        {lastBooking && (
          <>
            <div className="done-wrap">
              <div className="done-check" aria-hidden="true">
                ✓
              </div>
              <h3 id="booking-done-title">예약이 완료됐어요</h3>
              <p>
                {fmtRelativeDay(lastBooking.dateKey, now ?? new Date())} {lastBooking.time}–
                {addMinutesToTime(lastBooking.time, lastBooking.minutes)} ·{" "}
                {lastBooking.minutes}분
                <br />
                {HOST.displayName}과의 1:1 리스닝 상담
              </p>
            </div>
            <div className="sum">
              <div className="sum-row">
                <span>결제</span>
                <b>
                  {fmtWon(lastBooking.price)}{" "}
                  {lastBooking.paymentStatus === "demo" ? "(데모)" : ""}
                </b>
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
            <button type="button" className="btn block" onClick={() => setSheet(null)}>
              확인
            </button>
            <p className="fine">
              상담 전에 마음일지를 남겨두면, {HOST.displayName}이 한 줄 미리 읽고 기다릴게요.
            </p>
          </>
        )}
      </Sheet>
    </main>
  );
}
