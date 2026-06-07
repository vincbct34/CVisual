import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { parseLinkedInText } from "@/lib/linkedin-parser";

export async function POST(request: Request) {
  const { response } = await requireAuth(request);
  if (response) return response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.type.includes("pdf")) {
    return NextResponse.json(
      { error: "Le fichier doit être un PDF" },
      { status: 422 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Le fichier ne doit pas dépasser 10 Mo" },
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
        {
          error:
            "Le PDF ne contient pas assez de texte lisible. Utilisez le PDF exporté depuis LinkedIn (profil → « Enregistrer en PDF »).",
        },
        { status: 422 },
      );
    }

    // Parse déterministe — aucune IA
    const parsed = parseLinkedInText(text);

    // Vérification minimale : on doit au moins avoir un nom
    if (!parsed.profile.fullName) {
      return NextResponse.json(
        {
          error:
            "Impossible d'extraire le nom du profil. Vérifiez que le fichier est bien un export LinkedIn.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ parsed, pages: result.numpages });
  } catch (err) {
    console.error("[parse-linkedin-pdf]", err);
    return NextResponse.json(
      {
        error:
          "Impossible de lire ce PDF. Vérifiez qu'il n'est pas protégé par un mot de passe.",
      },
      { status: 422 },
    );
  }
}
