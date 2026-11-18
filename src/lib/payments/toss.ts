export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export function isTossConfigured() {
  return Boolean(TOSS_CLIENT_KEY);
}

export type TossMethod = "CARD" | "TRANSFER" | "EASY_PAY";

interface TossPaymentRequest {
  method: TossMethod;
  amount: { currency: "KRW"; value: number };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerName?: string;
  customerEmail?: string;
}

interface TossPayment {
  requestPayment: (options: TossPaymentRequest) => Promise<void>;
}

interface TossPaymentsFactory {
  (clientKey: string): {
    payment: (options: { customerKey: string }) => TossPayment;
  };
}

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

let sdkPromise: Promise<void> | null = null;

/** Loads the Toss Payments v2 standard SDK once, on first checkout. */
export function loadTossSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("브라우저에서만 결제할 수 있어요"));
  if (window.TossPayments) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

function customerKey() {
  if (typeof window === "undefined") return "ANONYMOUS";
  const existing = window.localStorage.getItem("maeum.toss.customerKey");
  if (existing) return existing;
  const key = `maeum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem("maeum.toss.customerKey", key);
  return key;
}

/**
 * Opens the Toss payment window. On success the browser is redirected to
 * `/counseling/success` with paymentKey / orderId / amount in the query string.
 */
export async function requestTossPayment({
  amount,
  orderId,
  orderName,
  method,
  customerName,
  customerEmail,
}: {
  amount: number;
  orderId: string;
  orderName: string;
  method: TossMethod;
  customerName?: string;
  customerEmail?: string;
}) {
  await loadTossSdk();
  if (!window.TossPayments) {
    throw new Error("결제 모듈을 불러오지 못했어요");
  }
  const origin = window.location.origin;
  const payment = window.TossPayments(TOSS_CLIENT_KEY).payment({
    customerKey: customerKey(),
  });
  await payment.requestPayment({
    method,
    amount: { currency: "KRW", value: amount },
    orderId,
    orderName,
    successUrl: `${origin}/counseling/success`,
    failUrl: `${origin}/counseling/fail`,
    customerName,
    customerEmail,
  });
}
