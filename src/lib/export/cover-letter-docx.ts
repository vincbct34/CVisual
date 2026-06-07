import { Document, Paragraph, TextRun, ImageRun, Packer } from "docx";
import type {
  CoverLetterContent,
  CoverLetterStyle,
} from "@/types/cover-letter";
import type { CoverLetter } from "@/generated/prisma/client";
import { stripHtml } from "./strip-html";

/** Decode an image data URL into a Buffer + docx image type, or null. */
function decodeSignatureImage(
  dataUrl: string | undefined,
): { data: Buffer; type: "png" | "jpg" } | null {
  if (!dataUrl?.startsWith("data:image/")) return null;
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const type = match[1].toLowerCase().startsWith("p") ? "png" : "jpg";
  try {
    return { data: Buffer.from(match[2], "base64"), type };
  } catch {
    return null;
  }
}

export async function generateCoverLetterDOCX(
  coverLetter: CoverLetter,
): Promise<Uint8Array> {
  const content = (coverLetter.content as unknown as CoverLetterContent) || {};
  const style = (coverLetter.style as unknown as CoverLetterStyle) || {
    fontFamily: "Calibri",
    fontSize: 14,
    primaryColor: "#1a1a1a",
  };

  const paragraphs: Paragraph[] = [];
  const font = style.fontFamily || "Calibri";
  const size = style.fontSize ? style.fontSize * 2 : 24; // docx uses half-points
  const accentColor = (style.primaryColor || "#1a1a1a").replace("#", "");
  const headMult = style.headingScale ?? 1;
  const metaMult = style.metaScale ?? 1;
  const headSize = Math.round(size * headMult); // sender name, objet, signature
  const metaSize = Math.round((size - 4) * metaMult); // contacts, date

  // Sender block
  const senderContacts = [
    content.senderEmail,
    content.senderPhone,
    content.senderLocation,
  ]
    .filter(Boolean)
    .join("  ·  ");

  if (content.senderName) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: senderContacts ? 60 : 300 },
        children: [
          new TextRun({
            text: content.senderName,
            bold: true,
            font,
            size: headSize,
            color: accentColor,
          }),
        ],
      }),
    );
  }
  if (senderContacts) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: senderContacts,
            font,
            size: metaSize,
            color: "666666",
          }),
        ],
      }),
    );
  }

  if (content.date) {
    paragraphs.push(
      new Paragraph({
        alignment: "right",
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: content.date,
            font,
            size: metaSize,
            color: "666666",
          }),
        ],
      }),
    );
  }

  if (content.recipientName) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: content.recipientName,
            bold: true,
            font,
            size,
          }),
        ],
      }),
    );
  }

  if (content.companyName) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: content.companyName,
            font,
            size,
            color: "666666",
          }),
        ],
      }),
    );
  }

  if (content.jobTitle) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: `Objet : Candidature au poste de ${content.jobTitle}`,
            bold: true,
            font,
            size: headSize,
            color: accentColor,
          }),
        ],
      }),
    );
  }

  if (content.body) {
    const rawText = stripHtml(content.body);
    const lines = rawText.split("\n");
    for (const line of lines) {
      if (!line.trim()) {
        paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
        continue;
      }
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: line,
              font,
              size,
            }),
          ],
        }),
      );
    }
  }

  const sigMode = content.signatureMode ?? "typed";
  const sigImage =
    sigMode !== "typed" ? decodeSignatureImage(content.signatureImage) : null;

  if (sigImage) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 300, after: content.signature ? 60 : 300 },
        children: [
          new ImageRun({
            type: sigImage.type,
            data: sigImage.data,
            transformation: { width: 150, height: 60 },
          }),
        ],
      }),
    );
  }

  if (content.signature) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: sigImage ? 0 : 300 },
        children: [
          new TextRun({
            text: content.signature,
            bold: true,
            font,
            size: headSize,
            color: accentColor,
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
