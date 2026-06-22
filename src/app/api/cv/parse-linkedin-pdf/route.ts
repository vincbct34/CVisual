import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { requireAuth } from "@/lib/api-auth";
import { parseLinkedInText } from "@/lib/linkedin-parser";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  // PDF parse is CPU-heavy — cap per user.
  const limited = await rateLimitResponse(
    `linkedin-parse:${auth.userId}`,
    10,
    60_000,
    request,
  );
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: apiMessage(request, "requestInvalid") },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.type.includes("pdf")) {
    return NextResponse.json(
      { error: apiMessage(request, "fileMustBePdf") },
      { status: 422 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: apiMessage(request, "fileTooLarge10") },
      { status: 413 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);

    const text = result.text?.trim();
    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: apiMessage(request, "pdfNotEnoughText") },
        { status: 422 },
      );
    }

    // Parse déterministe — aucune IA
    const parsed = parseLinkedInText(text);

    // Vérification minimale : on doit au moins avoir un nom
    if (!parsed.profile.fullName) {
      return NextResponse.json(
        { error: apiMessage(request, "pdfNoName") },
        { status: 422 },
      );
    }

    return NextResponse.json({ parsed, pages: result.numpages });
  } catch (err) {
    console.error("[parse-linkedin-pdf]", err);
    return NextResponse.json(
      { error: apiMessage(request, "pdfCantRead") },
      { status: 422 },
    );
  }
}
