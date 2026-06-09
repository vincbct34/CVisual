import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Proxies to a paid upstream API — cap per IP to limit cost abuse. Keyed by
    // IP (not user) since this proxy is unauthenticated; the caller's own key is
    // what actually pays, so this is a coarse backstop against a runaway client.
    const limited = await rateLimitResponse(
      `anthropic:${getClientIp(req)}`,
      30,
      60_000,
    );
    if (limited) return limited;

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new NextResponse("Clé API manquante", { status: 401 });
    }

    const body = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(errorText, { status: response.status });
    }

    if (body.stream) {
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      {
        status: 500,
      },
    );
  }
}
