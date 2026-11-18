# 🌿 마음명상 — 명상 · 마음일기 · 1:1 마이크로 리스닝 상담 (PWA)

> **"3분이면 시작되는 마음 돌봄"**
> 명상 코스, 매일 남기는 마음일기, 그리고 은솔님과 3·5·10분으로 이야기하는 유료 1:1 마이크로 리스닝 상담을 한 앱에 담았습니다.

`documents/마음명상_상담앱_기획서.md`의 1~12장을 구현한 **Phase 1 모바일 웹앱**입니다.
`app_prototype/index.html`의 색·타이포·화면 흐름을 그대로 이어받아 Next.js(App Router) + TypeScript + Tailwind CSS로 다시 만들었습니다.

---

## 1. 지금 바로 실행하기 (키 없이, 데모 모드)

```bash
cd maeum-app
npm install
npm run dev
```

→ http://localhost:3000

**외부 키가 하나도 없어도 전부 동작합니다.**

| 기능 | 데모 모드 동작 |
| --- | --- |
| 명상 플레이어 | 3개 장면 + 4-2-6 호흡 + 10/20분 타이머 + 합성 앰비언스 + 화면 꺼짐 방지 |
| 마음일기 | localStorage에 저장, 7일 요약 카드 자동 생성 |
| 1:1 상담 | 슬롯 선택 → 결제 시트 → **데모 결제** → 내 예약 (실제 청구 없음) |
| 호스트 화면 | `/counseling` 우측 상단 **호스트 모드** → 암호 `maeum-host` |
| 오프라인 | PWA 설치 + 마지막으로 본 화면/재생한 오디오 캐시 |

> 데모 결제는 `/api/payments/confirm`을 실제로 호출하되, 시크릿 키가 없으면 `{ demo: true }`로 응답합니다. 결제 플로우 전체(예약 생성 → 승인 → 확정)를 키 없이 검증할 수 있게 하기 위한 장치입니다.

### 요구 사항
- **Node.js 20.9 이상** (22 LTS 권장)
- npm 10 이상

---

## 2. 폴더 구조

```
maeum-app/
├─ public/
│  ├─ manifest.webmanifest      # PWA 매니페스트 (아이콘·단축아이콘)
│  ├─ sw.js                     # 서비스 워커 (오프라인 + 오디오 캐시)
│  ├─ icons/                    # 192·512·maskable·apple-touch·favicon
│  └─ audio/                    # (선택) 명상 오디오를 두는 곳
├─ supabase/
│  └─ migrations/001_initial.sql # 테이블·RLS·인덱스·트리거·시드 4코스
├─ src/
│  ├─ app/
│  │  ├─ page.tsx               # 홈
│  │  ├─ player/page.tsx        # 플레이어 (기본 10분)
│  │  ├─ player/[id]/page.tsx   # 코스별 플레이어
│  │  ├─ diary/page.tsx         # 마음일기
│  │  ├─ counseling/page.tsx    # 1:1 상담 예약
│  │  ├─ host/page.tsx          # 호스트 대시보드
│  │  ├─ login/page.tsx         # 카카오 로그인 / 데모 안내
│  │  ├─ terms | privacy | refund # 약관 3종
│  │  ├─ counseling/success|fail # 토스 결제 리다이렉트 처리
│  │  ├─ offline/page.tsx       # 오프라인 폴백
│  │  ├─ auth/callback/route.ts # 카카오 OAuth 코드 교환
│  │  └─ api/payments/
│  │     ├─ confirm/route.ts    # 토스 결제 승인 (금액 검증)
│  │     └─ cancel/route.ts     # 토스 결제 취소·환불
│  ├─ components/
│  │  ├─ layout/AppShell·TabBar·Toast·DocLayout
│  │  ├─ player/SceneArt.tsx    # 새벽 숲·호수·밤하늘 SVG
│  │  ├─ providers/AppProvider.tsx # 데모/서버 데이터 소스 + 인증
│  │  ├─ screens/Home·Player·Diary·Counseling·Host·Login·Payment*
│  │  └─ ui/Sheet.tsx
│  ├─ hooks/ (useWakeLock, usePrefersReducedMotion)
│  └─ lib/ (constants, date, booking, briefing, storage, audio, payments, data/*, supabase/*)
├─ next.config.ts · tsconfig.json · postcss.config.mjs · package.json
├─ screenshots/                 # 실제 화면 캡처 10장 (430px 기준)
├─ .env.example
└─ README.md
```

---

## 3. Supabase 연결 (로그인·서버 저장)

### 3-1. 프로젝트 만들기
1. https://supabase.com → **New project**
2. **Region: Seoul (ap-northeast-2)** — 기획서의 "국내 리전 사용" 원칙
3. Project Settings → API에서 **Project URL**, **anon public key** 복사

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3-2. 스키마 실행
Dashboard → **SQL Editor** → New query →

`supabase/migrations/001_initial.sql` **전체를 붙여넣고 Run**.

만들어지는 것:
- 테이블 `users` `courses` `plays` `diaries` `slots` `bookings` `notes`
- 명상 코스 4종 시드 (10분·20분·시각화·수면 호흡)
- **RLS 정책**: 일기는 본인만 / 호스트는 *동의한 예약의 최근 7일*만
- **서버 가격표 트리거**: 3,900 / 5,900 / 9,900원 외 금액은 저장 불가
- **슬롯 충돌 방지**: 활성 예약 1개/슬롯, 하루 6건, 슬롯 사이 5분 버퍼
- **결제 가드**: 결제 승인 전 `confirmed` 전환 불가

### 3-3. 카카오 로그인
1. https://developers.kakao.com → 내 애플리케이션 → 앱 만들기
2. **카카오 로그인** 활성화, Redirect URI에 추가:
   `https://<프로젝트>.supabase.co/auth/v1/callback`
3. **동의항목**: 닉네임(필수), 프로필 사진(선택), 이메일(선택)
4. **보안 → Client Secret** 발급 후 코드 활성화
5. Supabase Dashboard → **Authentication → Providers → Kakao**
   - REST API 키 = Kakao **JavaScript 키가 아닌 REST API 키**
   - Client Secret 입력 → Enable
6. Supabase → **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (배포 후 `https://도메인`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://도메인/auth/callback`

이제 `/login`의 **카카오로 시작하기**가 동작하고, 로그인한 사용자의 일기·예약이 서버에 저장됩니다.

### 3-4. 호스트(은솔님) 계정 만들기
1. 앱에서 은솔님 카카오 계정으로 한 번 로그인
2. Supabase → Authentication → Users에서 해당 계정 UUID 복사
3. SQL Editor에서:

```sql
update public.users set role = 'host' where id = '<은솔님 auth uid>';
```

4. `/host` 접속 → 호스트 대시보드가 열립니다.
   - Supabase 모드에서는 `role`이 `host`가 아니면 화면 자체가 열리지 않습니다.
   - 데모 모드의 암호 잠금(`NEXT_PUBLIC_HOST_PASSCODE`)은 **로컬 편의 기능**이며 실제 보안은 RLS + role이 담당합니다.

### 3-5. 슬롯 열기
호스트 화면에서 오늘/내일 슬롯을 탭해 열면 `slots` 테이블에 저장되고, 고객 화면에 바로 보입니다.
(Supabase 모드에서는 호스트가 연 슬롯만 예약할 수 있습니다.)

---

## 4. 토스페이먼츠 연결 (실결제)

1. https://www.tosspayments.com → 상점 가입 → **개발자센터 → API 키**
2. 테스트 키를 `.env.local`에:

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

3. `npm run dev` 재시작 → 상담 결제 시 **토스 결제창**이 열립니다.
   - 결제 수단: 카드 / 계좌이체 / 간편결제
   - 성공 → `/counseling/success` → 서버가 `/api/payments/confirm`으로 승인
   - 실패/취소 → `/counseling/fail` → 예약 자동 해제
4. 실결제 전환: 운영 키(`live_ck_`, `live_sk_`)로 교체. 시크릿 키는 **절대 `NEXT_PUBLIC_`으로 노출하지 마세요.**
5. 취소·환불: `/api/payments/cancel`이 토스 취소 API를 호출합니다. (상담 1시간 전 무료 취소)

> **결제는 Supabase 로그인 + 실결제 키가 모두 있을 때만** 토스 결제창을 엽니다.
> 둘 중 하나라도 없으면 데모 결제로 처리해 테스트 흐름이 끊기지 않습니다.

### 금액 검증
`/api/payments/confirm`은 클라이언트가 보낸 금액을 믿지 않고 서버 가격표(3,900/5,900/9,900)와 비교합니다. DB 트리거도 같은 가격표로 `price`를 덮어씁니다.

---

## 5. Vercel 배포

1. GitHub에 이 폴더를 push
2. Vercel → New Project → Import
3. **Environment Variables**에 `.env.local`의 값 입력
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app`
4. Deploy → 도메인 연결
5. Supabase **Redirect URLs**에 `https://도메인/auth/callback` 추가
6. 카카오 Redirect URI는 Supabase 콜백 그대로 두면 됩니다 (`https://<project>.supabase.co/auth/v1/callback`)

---

## 6. PWA · 오프라인

- `manifest.webmanifest`: 홈 화면 설치, 테마 컬러, 4개 바로가기(명상/일기/상담)
- `sw.js`:
  - 설치 시 `/offline`, 아이콘, 매니페스트 프리캐시
  - 페이지: **network-first → 캐시 → 오프라인 페이지**
  - `_next/static`, 아이콘: cache-first
  - `/audio/*`: 첫 재생 시 캐시 → **한 코스는 오프라인에서도 재생**
- 서비스 워커는 **프로덕션 빌드에서만** 등록됩니다(개발 중 캐시 혼란 방지).

### 명상 오디오 넣기
1. `public/audio/c10.mp3` 처럼 파일을 두거나 Cloudflare R2 URL을 사용
2. `src/lib/constants.ts`의 해당 코스 `audioUrl`을 `/audio/c10.mp3` 또는 R2 서명 URL로 변경
3. (권장) R2는 128kbps m4a/mp3, 서명 URL은 1시간 만료
4. 오디오가 없으면 WebAudio 합성 앰비언스(빗소리·파도·장작불)가 대신 재생됩니다.

> BGM은 아트리스트·에피데믹 등 **라이선스 음원** 또는 자체 녹음만 사용하세요.

---

## 7. 화면별 구현 요약

### 홈 `/`
- 시간대 인사(아침/오후/저녁/밤) + 날짜
- 6개 감정 빠른 체크 → 탭하면 마음일기로 (감정 선택된 상태)
- 시간대별 추천 히어로 카드 + 2×2 코스 그리드
- 연속 기록일 / 이번 주 명상 횟수·시간
- 7일 감정 스트립
- 상담 슬롯 **한 줄** 안내 (기획서의 "7번째 위치" 원칙)

### 플레이어 `/player/[id]`
- 전체 화면 몰입형, 하단 탭바 다크 전환
- **새벽 숲 / 잔잔한 호수 / 밤하늘** SVG 장면
- **4-2-6 호흡**(수면 코스는 4-7-8) 원 + 단계·남은 초
- 10/20분 타이머, 진행 링, 일시정지·리셋, **이어듣기**
- Wake Lock, `prefers-reduced-motion` 존중
- 완료 시 "고마워요" → 마음일기(명상 후)로 자동 이동 + 재생 기록 저장
- 사운드 4종(무음·빗소리·파도·장작불) / 코스 오디오 URL 지원

### 마음일기 `/diary`
- 명상 전/후 토글, 감정 8종, 마음의 크기 1~5, 600자 + 시작 문장 칩
- 최근 7일 요약 카드 자동 생성(지배 감정·평균 크기·전후 변화·자주 나온 말)
- 기록이 3개 이상이면 상담 전환 버튼 노출 (기획서의 전환 트리거)
- 두 번 탭 삭제 / 전체 삭제, 기기 저장 vs 계정 저장 안내

### 1:1 상담 `/counseling`
- 호스트 카드(은솔님·리스너·★4.9·128회·평균 4분)
- 3/5/10분 카드 (3,900 / 5,900 / 9,900원)
- 오늘/내일 슬롯 그리드: 예약됨·닫힘·준비 중(5분 버퍼)·지난 시간·하루 상한 표시
- 선택 요약 바 → 예약 시트(결제 수단 3종)
- **[필수] 리스닝 서비스·취소·환불 동의**, **[선택] 7일 브리핑 열람 동의**
- 위기 상담 번호 **109 / 1577-0199** 고정 노출
- 토스 결제창 → 성공 페이지에서 서버 승인 → 내 예약
- **시작 1시간 전까지 무료 취소** (실결제는 토스 취소 API 호출)

### 호스트 `/host`
- 로그인 role 또는 데모 암호로 보호
- 오늘 예약 건수 / 결제 금액 / **수수료 제외(3.74%) 실수령**
- 슬롯 열기·닫기(예약된 슬롯 잠금), 전체 열기/마감
- 받은 예약 목록 + 결제 상태 + 브리핑 동의 여부
- 고객별 **최근 7일 브리핑 카드**
- 3/5/10분 **프로토콜 체크리스트**
- **3줄 요약 + 다음 한 걸음** 저장 → `notes`
- 정산 예상(카드 3.4% + VAT 10% → 실질 3.74%)

### 약관 `/terms` `/privacy` `/refund`
- 리스닝 서비스(비의료) 고지, 위기 상담 번호
- 민감정보 최소 수집·동의 기반 호스트 열람·파기 절차
- 취소·환불 기준(1시간 전 무료, 노쇼 불가, 운영자 귀책 전액 환불)
- 사업자 정보 자리표시자(`COMMERCE_INFO`) — 출시 전 실제 값으로 교체

---

## 8. 검증 결과

```bash
npm run typecheck   # tsc --noEmit
npm run build       # next build
```

빌드/타입체크 결과는 이 작업의 최종 보고에 기록했습니다. 코드를 수정한 뒤에는 위 두 명령을 다시 실행하세요.

---

## 9. 보안·개인정보 체크리스트

- [x] 마음일기 RLS: 본인만 select/insert/update/delete
- [x] 호스트 열람: **동의(consent_briefing) + 본인 예약 + 최근 7일** 조건
- [x] 가격·시간·결제 상태는 서버(트리거·API)가 결정
- [x] 결제 승인 전 예약 확정 불가
- [x] 슬롯 중복·버퍼·하루 상한 DB 레벨 보장
- [x] `users.role` 컬럼 update 권한 회수(권한 상승 방지)
- [x] 카드 번호·CVC 미저장(토스 위임)
- [ ] **출시 전**: 개인정보처리방침 사업자 정보 실제 값 교체
- [ ] **출시 전**: Supabase 백업 정책, 로그 보관 기간 설정
- [ ] **다음 단계**: 일기 본문 애플리케이션 레벨 암호화(기획서 10장) — 현재는 HTTPS + RLS로 보호
- [ ] **다음 단계**: 카카오 알림톡(솔라피/알리고)으로 24시간 전·1시간 전 알림

> 일기 본문 암호화는 "본문을 앱에서 암호화해 저장하고, 예약 단위 동의 토큰으로만 복호화"하는 구조가 필요합니다. Phase 1에서는 DB·전송 구간 보호(HTTPS + RLS)까지 적용했고, 암호화 키 관리는 Phase 2로 남겼습니다.

---

## 10. 알려진 한계 / 다음 단계

- **결제는 토스 v2 결제창(리다이렉트)** 방식입니다. 앱 내 결제위젯을 원하면 `@tosspayments/payment-widget-sdk`로 교체할 수 있습니다.
- **상담 통화는 앱 내 WebRTC가 아니라** 카카오톡 채널/전화로 진행합니다(기획서 1단계).
- **알림**은 아직 없습니다. iOS 웹푸시는 홈 화면 추가 시에만 동작하므로, 카카오 알림톡을 1차 수단으로 권장합니다.
- **구독(월 4,900원)** 은 Phase 1 범위 밖입니다. 상담 상품만 구현했습니다.
- **앱스토어(Expo)** 이식은 Phase 2입니다. 이 웹앱은 PWA로 먼저 검증합니다.
- 데모 모드의 데이터는 브라우저 localStorage에 있습니다. 브라우저 데이터를 지우면 사라집니다.
- 서버 동기화는 "로그인 이후" 방식이라, 로그인 전 기기에 쓴 일기를 자동으로 업로드하지 않습니다. 필요하면 `AppProvider`에 1회 병합 로직을 추가하세요.

---

## 11. 자주 막히는 곳

| 증상 | 확인 |
| --- | --- |
| 카카오 로그인 후 `/login`으로 돌아옴 | Supabase Redirect URL에 `/auth/callback` 등록 여부, 카카오 Client Secret 활성화 |
| 예약 버튼이 "로그인 후"라고 함 | Supabase 모드에서 로그인 필요 (데모 모드는 바로 예약) |
| 슬롯이 전부 닫혀 보임 | Supabase 모드에서는 호스트가 슬롯을 열어야 함 → `/host` |
| 결제창이 안 열림 | `NEXT_PUBLIC_TOSS_CLIENT_KEY` + `TOSS_SECRET_KEY` + 로그인 상태 확인 |
| 오프라인이 안 됨 | `npm run build && npm start` (프로덕션)에서만 SW 등록 |
| 호스트 화면이 안 열림 | `users.role='host'` 또는 데모 암호 `maeum-host` |

---

## 12. 라이선스·저작권

- 코드: 이 프로젝트 소유자에게 귀속
- 명상 오디오: 라이선스 음원 또는 자체 녹음만 사용
- 폰트: 시스템 폰트 사용(별도 라이선스 없음)
- 아이콘: 이 프로젝트에서 생성한 SVG/PNG
