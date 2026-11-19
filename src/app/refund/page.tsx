import type { Metadata } from "next";
import { DocLayout } from "@/components/layout/DocLayout";
import { COMMERCE_INFO, LISTENING_DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "취소·환불 정책",
  description: "인유 1:1 리스닝 상담의 취소·환불 정책",
};

export default function RefundPage() {
  return (
    <DocLayout title="취소·환불 정책">
      <p>
        1:1 마이크로 리스닝 상담은 상담 시간이라는 한정된 자원을 판매하므로, 아래와 같이
        취소·환불 기준을 둡니다. 기준은 결제 화면에서도 확인할 수 있습니다.
      </p>

      <h2>1. 상담 요금</h2>
      <table>
        <thead>
          <tr>
            <th>길이</th>
            <th>가격</th>
            <th>이런 순간에</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3분</td>
            <td>3,900원</td>
            <td>잠깐 무너질 것 같을 때, 첫 상담</td>
          </tr>
          <tr>
            <td>5분</td>
            <td>5,900원</td>
            <td>한 가지 고민을 정리하고 싶을 때</td>
          </tr>
          <tr>
            <td>10분</td>
            <td>9,900원</td>
            <td>반복되는 패턴을 짚고 싶을 때</td>
          </tr>
        </tbody>
      </table>

      <h2>2. 무료 취소</h2>
      <p>
        상담 시작 <b>1시간 전까지</b> 앱의 ‘내 예약’에서 직접 취소할 수 있으며, 결제 금액
        전액이 환불됩니다. 취소 시점과 카드사 정책에 따라 환불은 영업일 기준 3~5일이 걸릴 수
        있습니다.
      </p>

      <h2>3. 취소가 어려운 경우</h2>
      <ul>
        <li>상담 시작 1시간 전을 지난 뒤의 취소는 환불되지 않습니다.</li>
        <li>상담 시간에 참여하지 않은 경우(노쇼) 환불되지 않습니다.</li>
        <li>상담이 시작된 뒤에는 진행 시간과 관계없이 환불되지 않습니다.</li>
      </ul>
      <p>
        다만 아래의 경우에는 예외로 전액 환불합니다.
      </p>
      <ul>
        <li>호스트의 사정으로 상담이 취소·중단된 경우</li>
        <li>통화 연결 장애 등 서비스 제공이 불가능했던 경우</li>
        <li>결제 오류로 중복 결제된 경우</li>
        <li>기타 운영자의 귀책 사유가 인정되는 경우</li>
      </ul>

      <h2>4. 상담 변경</h2>
      <p>
        시작 1시간 전까지라면 기존 예약을 무료로 취소하고 원하는 시간으로 다시 예약할 수
        있습니다. 결제 금액이 다른 상담으로 바꾸는 경우 차액은 새로 결제·환불됩니다.
      </p>

      <h2>5. 환불 요청 방법</h2>
      <p>
        앱의 ‘내 예약’에서 취소하거나, 문의 이메일({COMMERCE_INFO.email})로 예약 일시와
        결제 정보를 보내 주세요. 확인 후 지체 없이 처리하며, 처리 결과를 이메일로
        안내합니다.
      </p>

      <h2>6. 서비스 내용의 변경</h2>
      <p>
        상담은 리스닝·고민 정리 서비스이며 진단·치료가 아닙니다. {LISTENING_DISCLAIMER}
      </p>

      <div className="doc-note">
        본 정책은 전자상거래 등에서의 소비자보호에 관한 법률 및 콘텐츠이용자보호지침의
        범위 안에서 운영됩니다. 이용자는 소비자분쟁해결기준에 따라 권리를 주장할 수 있으며,
        한국소비자원(1372)에 도움을 요청할 수 있습니다.
      </div>
    </DocLayout>
  );
}
