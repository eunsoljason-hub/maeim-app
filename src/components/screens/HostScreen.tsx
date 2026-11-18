"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import {
  canCancelFree,
  slotStateFor,
} from "@/lib/booking";
import {
  DAILY_SESSION_CAP,
  HOST,
  LENGTH_PROTOCOLS,
  SLOT_BUFFER_MINUTES,
  SLOT_MINUTES,
  SLOT_TIMES,
  payoutFor,
} from "@/lib/constants";
import { buildWeeklyBriefing } from "@/lib/briefing";
import {
  addMinutesToTime,
  dateKey,
  dateKeyOfOffset,
  fmtDateShort,
  fmtWon,
} from "@/lib/date";
import { HOST_UNLOCK_KEY } from "@/lib/storage";
import type { Booking, CounselingNote, DiaryEntry, SlotStatus } from "@/lib/types";

const ENV_PASSCODE = process.env.NEXT_PUBLIC_HOST_PASSCODE ?? "";
const DEMO_PASSCODE = ENV_PASSCODE || "maeum-host";

export function HostScreen() {
  const { user, mode, authLoading, toast } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "demo") return;
    try {
      if (window.sessionStorage.getItem(HOST_UNLOCK_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, [mode]);

  if (mode === "supabase") {
    if (authLoading) {
      return (
        <main className="page">
          <p className="tiny">호스트 계정을 확인하는 중…</p>
        </main>
      );
    }
    if (!user) {
      return <HostGate title="호스트 로그인이 필요해요" message="은솔님 계정으로 로그인하면 호스트 화면이 열려요." />;
    }
    if (user.role !== "host") {
      return (
        <HostGate
          title="호스트 권한이 없어요"
          message="이 계정은 고객 계정이에요. Supabase의 users.role 값을 host로 바꾸면 호스트 화면이 열려요."
        />
      );
    }
    return <HostDashboard />;
  }

  if (!unlocked) {
    return (
      <main className="page">
        <header className="view-head">
          <div>
            <p className="eyebrow">호스트 모드</p>
            <h1>은솔님의 상담 준비</h1>
          </div>
          <Link href="/counseling" className="tiny" style={{ textDecoration: "underline" }}>
            게스트 화면
          </Link>
        </header>

        <div className="card" style={{ padding: 18, marginTop: 18 }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--sub)" }}>
            데모 모드에서는 기기 안에서만 열리는 임시 잠금이에요. 실제 운영에서는
            Supabase 로그인과 <b>users.role = host</b> 권한으로 보호돼요.
          </p>
          <label className="field-label" htmlFor="host-passcode">
            호스트 암호
          </label>
          <input
            id="host-passcode"
            className="note-field"
            type="password"
            value={passcode}
            onChange={(event) => {
              setPasscode(event.target.value);
              setError("");
            }}
            placeholder="암호를 입력하세요"
            autoComplete="current-password"
          />
          {error && (
            <p className="tiny" style={{ color: "#a4584a", marginTop: 8 }}>
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn block"
            style={{ width: "100%", marginTop: 14 }}
            onClick={() => {
              if (passcode === DEMO_PASSCODE) {
                try {
                  window.sessionStorage.setItem(HOST_UNLOCK_KEY, "1");
                } catch {
                  /* ignore */
                }
                setUnlocked(true);
                toast("호스트 모드로 들어왔어요");
              } else {
                setError("암호가 맞지 않아요");
              }
            }}
          >
            호스트 모드 열기
          </button>
          {!ENV_PASSCODE && (
            <p className="fine" style={{ marginTop: 12 }}>
              데모 기본 암호: <b>maeum-host</b> (배포 전 NEXT_PUBLIC_HOST_PASSCODE 설정)
            </p>
          )}
        </div>
      </main>
    );
  }

  return <HostDashboard />;
}

function HostGate({ title, message }: { title: string; message: string }) {
  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">호스트 모드</p>
          <h1>{title}</h1>
        </div>
      </header>
      <div className="card" style={{ padding: 18, marginTop: 18 }}>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--sub)" }}>{message}</p>
        <Link
          href="/login"
          className="btn"
          style={{ marginTop: 14, width: "100%" }}
        >
          로그인 화면으로
        </Link>
        <Link
          href="/counseling"
          className="tiny"
          style={{ display: "block", textAlign: "center", marginTop: 12, textDecoration: "underline" }}
        >
          게스트 화면으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

function HostDashboard() {
  const {
    slots,
    bookings,
    diaries,
    notes,
    user,
    mode,
    setSlotStatus,
    updateBooking,
    saveNote,
    toast,
  } = useApp();

  const [now, setNow] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = now ? dateKey(now) : dateKeyOfOffset(0);
  const tomorrow = now ? dateKeyOfOffset(1, now) : dateKeyOfOffset(1);
  const activeDate = selectedDate || today;

  const dayBookings = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.dateKey === activeDate &&
            (booking.status === "confirmed" ||
              booking.status === "pending" ||
              booking.status === "completed"),
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, activeDate],
  );

  const revenue = dayBookings
    .filter((booking) => booking.status !== "pending")
    .reduce((sum, booking) => sum + booking.price, 0);
  const payout = payoutFor(revenue);
  const completeCount = dayBookings.filter((b) => b.status === "completed").length;
  const tomorrowCount = bookings.filter(
    (booking) =>
      booking.dateKey === tomorrow &&
      (booking.status === "confirmed" ||
        booking.status === "pending" ||
        booking.status === "completed"),
  ).length;

  const slotStatus = (time: string): SlotStatus => {
    const slot = slots.find((s) => s.dateKey === activeDate && s.time === time);
    return slot?.status ?? "open";
  };

  const isLocked = (time: string) =>
    bookings.some(
      (booking) =>
        booking.dateKey === activeDate &&
        booking.time === time &&
        (booking.status === "confirmed" || booking.status === "pending"),
    );

  const toggleSlot = async (time: string) => {
    if (isLocked(time)) {
      toast("예약이 잡힌 시간은 닫을 수 없어요");
      return;
    }
    const next: SlotStatus = slotStatus(time) === "closed" ? "open" : "closed";
    try {
      await setSlotStatus(
        { id: `${activeDate}|${time}`, dateKey: activeDate, time, minutes: SLOT_MINUTES },
        next,
      );
      toast(`${time} 슬롯을 ${next === "open" ? "열었어요" : "닫았어요"}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "슬롯을 바꾸지 못했어요");
    }
  };

  const bulk = async (status: SlotStatus) => {
    try {
      for (const time of SLOT_TIMES) {
        if (isLocked(time)) continue;
        await setSlotStatus(
          { id: `${activeDate}|${time}`, dateKey: activeDate, time, minutes: SLOT_MINUTES },
          status,
        );
      }
      toast(status === "open" ? "이 날 슬롯을 모두 열었어요" : "이 날 슬롯을 모두 닫았어요");
    } catch (error) {
      toast(error instanceof Error ? error.message : "슬롯을 바꾸지 못했어요");
    }
  };

  const markCompleted = async (booking: Booking) => {
    try {
      await updateBooking(booking.id, { status: "completed" });
      toast("상담 완료로 표시했어요");
    } catch (error) {
      toast(error instanceof Error ? error.message : "변경하지 못했어요");
    }
  };

  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">호스트 모드 · {HOST.displayName}</p>
          <h1>오늘의 상담</h1>
        </div>
        <Link href="/counseling" className="tiny" style={{ textDecoration: "underline" }}>
          게스트 화면
        </Link>
      </header>

      <section className="card host-summary" style={{ marginTop: 16 }}>
        <div>
          <b>{dayBookings.length}건</b>
          <span>{activeDate === today ? "오늘 예약" : "예약"}</span>
        </div>
        <div>
          <b>{fmtWon(revenue)}</b>
          <span>결제 금액</span>
        </div>
        <div>
          <b>{fmtWon(payout.net)}</b>
          <span>수수료 제외</span>
        </div>
      </section>
      <p className="tiny" style={{ marginTop: 8 }}>
        카드 수수료 3.4% + VAT 10%(실질 3.74%)를 뺀 예상 금액이에요. 완료 {completeCount}건 ·
        하루 상한 {DAILY_SESSION_CAP}건 · 슬롯 사이 {SLOT_BUFFER_MINUTES}분 버퍼
      </p>

      <div className="section-head">
        <h2>슬롯 관리</h2>
        <span className="tiny">탭해서 열고 닫기</span>
      </div>
      <div className="seg inline" role="tablist" aria-label="날짜 선택">
        <button
          type="button"
          className={activeDate === today ? "on" : ""}
          onClick={() => setSelectedDate(today)}
          role="tab"
          aria-selected={activeDate === today}
        >
          오늘 {fmtDateShort(today)}
        </button>
        <button
          type="button"
          className={activeDate === tomorrow ? "on" : ""}
          onClick={() => setSelectedDate(tomorrow)}
          role="tab"
          aria-selected={activeDate === tomorrow}
        >
          내일 {fmtDateShort(tomorrow)}
        </button>
      </div>

      {activeDate === today && dayBookings.length === 0 && tomorrowCount > 0 && (
        <p className="tiny" style={{ marginTop: 10 }}>
          내일 예약 {tomorrowCount}건이 있어요 · 위의 ‘내일’ 탭에서 확인할 수 있어요.
        </p>
      )}

      <div className="slot-grid">
        {SLOT_TIMES.map((time) => {
          const locked = isLocked(time);
          const state = now
            ? slotStateFor(activeDate, time, slots, bookings, now)
            : "open";
          const closed = slotStatus(time) === "closed";
          return (
            <button
              key={time}
              type="button"
              className={`slot ${locked ? "on" : ""} ${closed && !locked ? "dead" : ""}`}
              onClick={() => toggleSlot(time)}
              aria-label={`${time} ${locked ? "예약됨" : closed ? "닫힘" : "열림"}`}
            >
              <b>{time}</b>
              <small>
                {locked
                  ? "예약"
                  : closed
                    ? "닫힘"
                    : state === "buffer"
                      ? "준비 중"
                      : "열림"}
              </small>
            </button>
          );
        })}
      </div>
      <div className="host-actions">
        <button type="button" className="btn ghost" onClick={() => void bulk("open")}>
          이 날 전체 열기
        </button>
        <button type="button" className="btn ghost" onClick={() => void bulk("closed")}>
          이 날 마감
        </button>
      </div>

      <div className="section-head">
        <h2>받은 예약</h2>
        <span className="tiny">{dayBookings.length}건</span>
      </div>
      <div className="stack">
        {dayBookings.length === 0 ? (
          <div className="empty">
            <span className="e">📭</span>
            이 날은 아직 예약이 없어요.
            <br />
            슬롯을 열어두면 예약이 들어와요.
          </div>
        ) : (
          dayBookings.map((booking) => {
            const note = notes.find((item) => item.bookingId === booking.id) ?? null;
            const clientDiaries: DiaryEntry[] =
              mode === "supabase" && booking.clientId
                ? diaries.filter((entry) => entry.userId === booking.clientId)
                : diaries;
            const briefing = now ? buildWeeklyBriefing(clientDiaries, now) : null;
            const open = openBookingId === booking.id;

            return (
              <div key={booking.id} className="book">
                <div className="book-top">
                  <b>
                    {booking.time}–{addMinutesToTime(booking.time, booking.minutes)}
                  </b>
                  <span className="who">{booking.clientName}</span>
                </div>
                <div className="book-meta">
                  <span className="pill">{booking.minutes}분</span>
                  <span>{fmtWon(booking.price)}</span>
                  <span>
                    ·{" "}
                    {booking.status === "completed"
                      ? "상담 완료"
                      : booking.paymentStatus === "paid"
                        ? "결제 완료"
                        : booking.paymentStatus === "demo"
                          ? "데모 결제"
                          : "결제 대기"}
                  </span>
                  {booking.consentBriefing ? (
                    <span className="pill lav">브리핑 동의</span>
                  ) : (
                    <span className="pill lav">브리핑 미동의</span>
                  )}
                </div>

                <div className="row" style={{ marginTop: 10, gap: 8 }}>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ height: 36, fontSize: 11.5, flex: 1 }}
                    onClick={() => setOpenBookingId(open ? null : booking.id)}
                    aria-expanded={open}
                  >
                    {open ? "상담 준비 접기" : "상담 준비 열기"}
                  </button>
                  {booking.status !== "completed" && (
                    <button
                      type="button"
                      className="btn sage-wash"
                      style={{ height: 36, fontSize: 11.5, flex: 1 }}
                      onClick={() => void markCompleted(booking)}
                    >
                      상담 완료
                    </button>
                  )}
                </div>

                {open && (
                  <div style={{ marginTop: 12 }}>
                    {booking.consentBriefing ? (
                      <div className="briefing" style={{ padding: 0 }}>
                        <h3>최근 7일 브리핑</h3>
                        <ul>
                          {(briefing?.lines ?? ["요약할 기록이 없어요."]).map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="notice">
                        <span aria-hidden="true">🔒</span>
                        <span>
                          이 고객은 마음일기 브리핑 열람에 동의하지 않았어요. 상담 첫머리에 지금
                          마음을 직접 여쭤보세요.
                        </span>
                      </div>
                    )}

                    <div className="card protocol" style={{ marginTop: 12 }}>
                      <h3>{LENGTH_PROTOCOLS[booking.minutes]?.title ?? "상담 프로토콜"}</h3>
                      <div style={{ marginTop: 6 }}>
                        {(LENGTH_PROTOCOLS[booking.minutes]?.steps ?? []).map((step, index) => (
                          <label key={step} className="protocol-step">
                            <input
                              type="checkbox"
                              defaultChecked={false}
                              aria-label={`${index + 1}단계: ${step}`}
                            />
                            <span>{step}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <SessionPrep
                      key={booking.id}
                      booking={booking}
                      note={note}
                      onSave={async (draft) => {
                        try {
                          await saveNote({ bookingId: booking.id, ...draft });
                          toast("상담 노트를 저장했어요");
                        } catch (error) {
                          toast(error instanceof Error ? error.message : "노트를 저장하지 못했어요");
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="section-head">
        <h2>정산 예상</h2>
        <span className="tiny">{fmtDateShort(activeDate)}</span>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div className="sum" style={{ marginTop: 0 }}>
          <div className="sum-row">
            <span>결제 금액</span>
            <b>{fmtWon(payout.price)}</b>
          </div>
          <div className="sum-row">
            <span>카드 수수료 (3.4% + VAT)</span>
            <b>−{fmtWon(payout.fee + payout.vat)}</b>
          </div>
          <div className="sum-row">
            <span>실수령 예상</span>
            <b>{fmtWon(payout.net)}</b>
          </div>
        </div>
        <p className="tiny" style={{ marginTop: 10, lineHeight: 1.7 }}>
          실제 정산 주기와 수수료는 PG 계약에 따라 달라져요. 세금(부가세·소득세)은 별도로
          준비해야 해요.
        </p>
      </div>

      {mode === "demo" && (
        <p className="tiny" style={{ textAlign: "center", marginTop: 16 }}>
          데모 모드 · 이 기기의 예약만 보여요. 실제 운영에서는 Supabase RLS가 호스트에게
          본인 슬롯의 예약만 보여줘요.
        </p>
      )}

      {user && (
        <p className="tiny" style={{ textAlign: "center", marginTop: 8 }}>
          {user.name} · {user.role}
        </p>
      )}

      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        <Link href="/terms" style={{ textDecoration: "underline" }}>
          이용약관
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" style={{ textDecoration: "underline" }}>
          개인정보처리방침
        </Link>
      </p>
    </main>
  );
}

function SessionPrep({
  booking,
  note,
  onSave,
}: {
  booking: Booking;
  note: CounselingNote | null;
  onSave: (draft: {
    line1: string;
    line2: string;
    line3: string;
    nextStep: string;
  }) => Promise<void>;
}) {
  const [line1, setLine1] = useState(note?.line1 ?? "");
  const [line2, setLine2] = useState(note?.line2 ?? "");
  const [line3, setLine3] = useState(note?.line3 ?? "");
  const [nextStep, setNextStep] = useState(note?.nextStep ?? "");
  const [saving, setSaving] = useState(false);

  const free = canCancelFree(booking);

  return (
    <div className="card" style={{ marginTop: 12, padding: 14 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700 }}>상담 후 3줄 요약</h3>
      <p className="tiny" style={{ marginTop: 4 }}>
        저장하면 고객에게 다음 한 걸음과 함께 전해져요. {!free && "시작 1시간이 지나 취소·환불은 어려워요."}
      </p>

      <label className="field-label" htmlFor={`line1-${booking.id}`}>
        1줄 · 지금 가장 무거운 것
      </label>
      <textarea
        id={`line1-${booking.id}`}
        className="note-field"
        rows={2}
        value={line1}
        onChange={(event) => setLine1(event.target.value)}
        placeholder="예: 복직 첫 주, 아이가 아플 때 혼자인 느낌"
      />

      <label className="field-label" htmlFor={`line2-${booking.id}`}>
        2줄 · 사실과 감정
      </label>
      <textarea
        id={`line2-${booking.id}`}
        className="note-field"
        rows={2}
        value={line2}
        onChange={(event) => setLine2(event.target.value)}
        placeholder="예: 남편은 야근, 나는 하루 종일 혼자였다는 감정"
      />

      <label className="field-label" htmlFor={`line3-${booking.id}`}>
        3줄 · 오늘의 한 걸음
      </label>
      <textarea
        id={`line3-${booking.id}`}
        className="note-field"
        rows={2}
        value={line3}
        onChange={(event) => setLine3(event.target.value)}
        placeholder="예: 오늘은 10분 명상으로 몸을 먼저 내려놓기"
      />

      <label className="field-label" htmlFor={`next-${booking.id}`}>
        다음 한 걸음
      </label>
      <textarea
        id={`next-${booking.id}`}
        className="note-field"
        rows={2}
        value={nextStep}
        onChange={(event) => setNextStep(event.target.value)}
        placeholder="예: 내일 아침 5분, 창문 열고 숨 고르기"
      />

      <button
        type="button"
        className="btn"
        style={{ height: 40, fontSize: 12.5, width: "100%", marginTop: 12 }}
        disabled={saving || (!line1 && !line2 && !line3 && !nextStep)}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave({ line1, line2, line3, nextStep });
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "저장 중…" : note ? "요약 수정 저장" : "요약 저장"}
      </button>

      {note && (
        <p className="tiny" style={{ marginTop: 8 }}>
          마지막 저장: {new Date(note.createdAt).toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  );
}
