"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { APP_NAME, APP_TAGLINE, HOST } from "@/lib/constants";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function LoginScreen() {
  const router = useRouter();
  const { user, configured, mode, diaries, signOut, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("next");
    if (wanted && wanted.startsWith("/")) setNext(wanted);
  }, []);

  const login = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      toast("Supabase가 아직 연결되지 않았어요. 데모 모드로 이용할 수 있어요.");
      return;
    }
    setBusy(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          scopes: "profile_nickname profile_image",
        },
      });
      if (error) throw error;
    } catch (error) {
      setBusy(false);
      toast(error instanceof Error ? error.message : "로그인에 실패했어요");
    }
  };

  return (
    <main className="login-wrap">
      <div>
        <div className="login-mark" aria-hidden="true">
          🌿
        </div>
        <p className="eyebrow" style={{ marginTop: 18 }}>
          {APP_NAME}
        </p>
        <h1 style={{ fontSize: 24, letterSpacing: "-0.03em", marginTop: 6 }}>
          {APP_TAGLINE}
        </h1>
        <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.7, marginTop: 10 }}>
          명상과 마음일기는 로그인 없이도 이 기기에 저장돼요. 로그인하면 기록과 예약이
          계정에 남아 기기를 바꿔도 이어집니다.
        </p>
      </div>

      {user ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="row">
            <div className="host-avatar" aria-hidden="true">
              {user.name.slice(0, 1)}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 14 }}>{user.name}</b>
              <p className="tiny" style={{ marginTop: 2 }}>
                @{user.handle} · {user.role === "host" ? "호스트" : "이용자"}
              </p>
            </div>
          </div>
          <div className="sum" style={{ marginTop: 14 }}>
            <div className="sum-row">
              <span>마음일기</span>
              <b>{diaries.length}개</b>
            </div>
            <div className="sum-row">
              <span>저장 위치</span>
              <b>{mode === "supabase" ? "내 계정 (서버)" : "이 기기"}</b>
            </div>
          </div>
          {user.role === "host" && (
            <Link
              href="/host"
              className="btn"
              style={{ width: "100%", marginTop: 12, height: 44, fontSize: 13 }}
            >
              호스트 화면 열기
            </Link>
          )}
          <button
            type="button"
            className="btn ghost"
            style={{ width: "100%", marginTop: 8, height: 42, fontSize: 12.5 }}
            onClick={async () => {
              await signOut();
              toast("로그아웃했어요. 기록은 이 기기에 남아 있어요.");
              router.push("/");
            }}
          >
            로그아웃
          </button>
        </div>
      ) : configured ? (
        <div className="stack">
          <button
            type="button"
            className="kakao-btn"
            onClick={() => void login()}
            disabled={busy}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#191600"
                d="M12 3c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.3 6L6 20.3c-.1.3.2.6.5.4l4-2.4c.5.1 1 .1 1.5.1 5 0 9-3.1 9-7s-4-7.4-9-7.4z"
              />
            </svg>
            {busy ? "카카오로 이동 중…" : "카카오로 시작하기"}
          </button>
          <p className="mode-note">
            로그인하면 닉네임과 프로필 이미지만 받아요. 마음일기는 계정에만 저장되고,
            상담 예약 시 동의한 경우에만 {HOST.displayName}이 최근 7일 요약을 봐요.
          </p>
          <button
            type="button"
            className="btn ghost"
            style={{ width: "100%", height: 46, fontSize: 13 }}
            onClick={() => router.push("/")}
          >
            로그인 없이 둘러보기
          </button>
        </div>
      ) : (
        <div className="stack">
          <div className="mode-note">
            <b>지금은 데모 모드예요.</b>
            <br />
            Supabase·카카오 키를 설정하면 카카오 로그인으로 기록과 예약을 계정에 저장할 수
            있어요. 그 전까지는 모든 기록이 이 기기에만 남습니다.
          </div>
          <button
            type="button"
            className="btn"
            style={{ width: "100%", height: 50, fontSize: 14 }}
            onClick={() => router.push("/")}
          >
            데모로 시작하기
          </button>
        </div>
      )}

      <div className="row" style={{ justifyContent: "center", gap: 12 }}>
        <Link href="/terms" className="tiny" style={{ textDecoration: "underline" }}>
          이용약관
        </Link>
        <Link href="/privacy" className="tiny" style={{ textDecoration: "underline" }}>
          개인정보처리방침
        </Link>
        <Link href="/refund" className="tiny" style={{ textDecoration: "underline" }}>
          환불 정책
        </Link>
      </div>
    </main>
  );
}
