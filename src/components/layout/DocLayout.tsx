import Link from "next/link";
import type { ReactNode } from "react";
import { COMMERCE_INFO } from "@/lib/constants";

export function DocLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="doc">
      <Link href="/" className="doc-back">
        ‹ 마음명상으로 돌아가기
      </Link>
      <h1>{title}</h1>
      <p className="doc-meta">시행일 2026년 11월 18일 · {COMMERCE_INFO.brand}</p>
      {children}
      <div className="doc-foot">
        <p>
          {COMMERCE_INFO.company} · 대표 {COMMERCE_INFO.representative}
          <br />
          사업자등록번호 {COMMERCE_INFO.businessNumber} · 통신판매업 신고{" "}
          {COMMERCE_INFO.mailOrderNumber}
          <br />
          {COMMERCE_INFO.address} · {COMMERCE_INFO.contact} · {COMMERCE_INFO.email}
        </p>
        <p style={{ marginTop: 8 }}>
          본 문서는 서비스 출시 전 준비된 초안이며, 사업자등록·통신판매업 신고·PG 계약이
          완료되면 실제 정보로 교체해야 합니다. 세무·법률 판단은 전문가 확인을 권합니다.
        </p>
      </div>
    </article>
  );
}
