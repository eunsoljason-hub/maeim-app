const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar day key: YYYY-MM-DD. */
export function dateKey(date: Date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function dateKeyOfOffset(offsetDays: number, base: Date = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return dateKey(d);
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function startOfDay(date: Date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekdayKo(key: string) {
  return WEEKDAYS_KO[parseDateKey(key).getDay()];
}

/** "11월 18일 수요일" */
export function fmtDateLong(key: string) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS_KO[d.getDay()]}요일`;
}

/** "11/18 (수)" */
export function fmtDateShort(key: string) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_KO[d.getDay()]})`;
}

/** "오늘 11/18" / "내일 11/19" / "11/20 (금)" */
export function fmtRelativeDay(key: string, now: Date = new Date()) {
  const today = dateKey(now);
  if (key === today) return `오늘 ${fmtDateShort(key)}`;
  if (key === dateKeyOfOffset(1, now)) return `내일 ${fmtDateShort(key)}`;
  return fmtDateShort(key);
}

export function fmtWon(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function fmtClock(totalSeconds: number) {
  const sec = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number) {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(wrapped / 60))}:${pad2(wrapped % 60)}`;
}

export function addMinutesToTime(time: string, minutes: number) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/** Local Date for a booking slot. */
export function slotDateTime(key: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = parseDateKey(key);
  d.setHours(h, m, 0, 0);
  return d;
}

export function fmtDateHeading(now: Date = new Date()) {
  return fmtDateLong(dateKey(now));
}

export function greetingForHour(hour: number) {
  if (hour < 5) return "늦은 밤이에요. 잠을 재촉해 볼까요.";
  if (hour < 11) return "좋은 아침이에요";
  if (hour < 17) return "오후도 잘 지나가고 있나요";
  if (hour < 22) return "오늘 하루 수고했어요";
  return "잠들기 전, 마음을 내려놓아요";
}

export function subGreetingForHour(hour: number) {
  return hour >= 22 || hour < 5
    ? "오늘 하루도 충분히 애썼어요. 3분이면 마음이 조금 가벼워져요."
    : "3분이면 충분해요. 마음을 잠깐 내려놓아 볼까요.";
}

export function hoursUntil(target: Date, now: Date = new Date()) {
  return (target.getTime() - now.getTime()) / 3_600_000;
}

/** 시간대 구분 — 다국어 인사말 키로 쓴다. */
export function hourBucket(hour: number): "dawn" | "morning" | "afternoon" | "evening" | "night" {
  if (hour < 5) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}
