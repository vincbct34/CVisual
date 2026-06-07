import { NextResponse } from "next/server";
import { signShareToken } from "@/lib/auth";
import { requireResume } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id, {
    select: { id: true },
  });
  if (response) return response;

  const token = await signShareToken(id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({ url: `${appUrl}/share/${token}` });
}
