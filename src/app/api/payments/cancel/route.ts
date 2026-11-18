import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CancelBody {
  paymentKey?: string;
  cancelReason?: string;
  amount?: number;
}

/**
 * Cancels (and refunds) a Toss payment 1:1 with the booking cancellation.
 * Without TOSS_SECRET_KEY the demo flow simply reports success.
 */
export async function POST(request: Request) {
  let body: CancelBody | null = null;
  try {
    body = (await request.json()) as CancelBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 형식이 올바르지 않아요" },
      { status: 400 },
    );
  }

  const { paymentKey, cancelReason, amount } = body ?? {};
  if (!paymentKey) {
    return NextResponse.json(
      { ok: false, error: "결제 정보가 부족해요" },
      { status: 400 },
    );
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "데모 결제를 취소했어요.",
    });
  }

  const authorization = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelReason: cancelReason ?? "고객 요청",
          cancelAmount: amount,
        }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as {
      status?: string;
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: data.message ?? "취소에 실패했어요", code: data.code ?? null },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, demo: false, status: data.status ?? "CANCELED" });
  } catch {
    return NextResponse.json(
      { ok: false, error: "취소 처리 중 오류가 발생했어요" },
      { status: 502 },
    );
  }
}
