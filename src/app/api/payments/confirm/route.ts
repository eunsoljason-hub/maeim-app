import { NextResponse } from "next/server";
import { PRICES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConfirmBody {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  minutes?: number;
}

/**
 * Confirms a Toss Payments charge.
 *
 * - With TOSS_SECRET_KEY set: calls the Toss confirm API and only reports success
 *   when Toss returns DONE for the exact amount we expect for the session length.
 * - Without keys (local/demo): validates the same rules and returns a demo result
 *   so the booking flow can be tested end to end without a merchant account.
 *
 * The price is always taken from the server-side table, never from the client.
 */
export async function POST(request: Request) {
  let body: ConfirmBody | null = null;
  try {
    body = (await request.json()) as ConfirmBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 형식이 올바르지 않아요" },
      { status: 400 },
    );
  }

  const { paymentKey, orderId, amount, minutes } = body ?? {};

  if (!paymentKey || !orderId) {
    return NextResponse.json(
      { ok: false, error: "결제 정보가 부족해요" },
      { status: 400 },
    );
  }
  if (!orderId.startsWith("maeum_")) {
    return NextResponse.json(
      { ok: false, error: "주문 번호가 올바르지 않아요" },
      { status: 400 },
    );
  }
  if (typeof minutes !== "number" || !(minutes in PRICES)) {
    return NextResponse.json(
      { ok: false, error: "상담 길이가 올바르지 않아요" },
      { status: 400 },
    );
  }

  const expected = PRICES[minutes];
  if (amount !== expected) {
    return NextResponse.json(
      { ok: false, error: "결제 금액이 상담 금액과 일치하지 않아요" },
      { status: 400 },
    );
  }

  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({
      ok: true,
      demo: true,
      status: "DONE",
      orderId,
      totalAmount: expected,
      message: "데모 결제로 처리했어요. 실제 금액은 청구되지 않았습니다.",
    });
  }

  const authorization = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      cache: "no-store",
    });

    const data = (await response.json()) as {
      status?: string;
      totalAmount?: number;
      method?: string;
      receipt?: { url?: string };
      code?: string;
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data.message ?? "결제 승인에 실패했어요",
          code: data.code ?? null,
        },
        { status: response.status },
      );
    }

    if (data.totalAmount !== expected) {
      return NextResponse.json(
        { ok: false, error: "승인된 금액이 주문 금액과 달라요" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      demo: false,
      status: data.status ?? "DONE",
      method: data.method ?? null,
      totalAmount: data.totalAmount,
      receiptUrl: data.receipt?.url ?? null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "결제 승인 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
