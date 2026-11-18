import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "오프라인",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="page">
      <div className="card" style={{ marginTop: 28, padding: "26px 20px" }}>
        <div className="done-wrap">
          <div className="done-check" aria-hidden="true">
            🌿
          </div>
          <h3>지금은 오프라인이에요</h3>
          <p>
            인터넷이 연결되면 다시 열 수 있어요.
            <br />
            한 번 재생한 명상 코스는 오프라인에서도 들을 수 있어요.
          </p>
        </div>
        <Link href="/" className="btn" style={{ width: "100%", marginTop: 16 }}>
          다시 시도하기
        </Link>
        <p className="fine">
          마음일기는 이 기기에 저장되므로, 연결이 없어도 지금 마음을 적어둘 수 있어요.
        </p>
      </div>
    </main>
  );
}
