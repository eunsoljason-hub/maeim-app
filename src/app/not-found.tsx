import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="card" style={{ marginTop: 28, padding: "26px 20px" }}>
        <div className="done-wrap">
          <div className="done-check" aria-hidden="true">
            ?
          </div>
          <h3>페이지를 찾지 못했어요</h3>
          <p>주소가 바뀌었거나 삭제된 페이지예요.</p>
        </div>
        <Link href="/" className="btn" style={{ width: "100%", marginTop: 16 }}>
          명상 홈으로
        </Link>
        <Link
          href="/diary"
          className="btn ghost"
          style={{ width: "100%", marginTop: 8 }}
        >
          마음일기 쓰기
        </Link>
      </div>
    </main>
  );
}
