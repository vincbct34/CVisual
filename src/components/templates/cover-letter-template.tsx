import { fontStack, sanitize } from "./template-utils";
import type {
  CoverLetterContent,
  CoverLetterStyle,
} from "@/types/cover-letter";

interface CoverLetterTemplateProps {
  content: CoverLetterContent;
  style: CoverLetterStyle;
}

export function CoverLetterTemplate({
  content,
  style,
}: CoverLetterTemplateProps) {
  const accent = style.accent ?? "minimal";
  const lineHeight = style.lineHeight ?? 1.5;
  const textAlign = style.textAlign ?? "left";
  const color = style.primaryColor || "#1a1a1a";
  const head = style.headingScale ?? 1;
  const meta = style.metaScale ?? 1;
  // Sizes relative to the body base (em), scaled by the group multipliers.
  const fsName = `calc(1.2em * ${head})`;
  const fsObjet = `calc(1em * ${head})`;
  const fsSignature = `calc(1em * ${head})`;
  const fsMeta = `calc(0.9em * ${meta})`;
  const signatureFont =
    "'Dancing Script', 'Brush Script MT', 'Segoe Script', cursive";
  const sigMode = content.signatureMode ?? "typed";
  const sigImage = content.signatureImage;

  const hasSender =
    content.senderName ||
    content.senderEmail ||
    content.senderPhone ||
    content.senderLocation;

  const senderContacts = [
    content.senderEmail,
    content.senderPhone,
    content.senderLocation,
  ].filter(Boolean);

  return (
    <div
      className="bg-white text-gray-800 w-full min-h-[297mm]"
      style={{
        fontFamily: fontStack(style.fontFamily),
        fontSize: `${style.fontSize}px`,
        lineHeight,
      }}
    >
      {/* Handwriting font for the typed signature (loaded for in-app preview,
          PDF/HTML export, and Puppeteer render). */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600;700&display=swap');`}</style>
      {/* Coloured band header (accent === "band") */}
      {accent === "band" && hasSender && (
        <div className="px-10 py-6 mb-8" style={{ backgroundColor: color }}>
          {content.senderName && (
            <p
              className="text-white font-semibold text-lg leading-tight"
              style={{ fontSize: fsName }}
            >
              {content.senderName}
            </p>
          )}
          {senderContacts.length > 0 && (
            <p
              className="text-white/85 text-sm mt-1"
              style={{ fontSize: fsMeta }}
            >
              {senderContacts.join("  ·  ")}
            </p>
          )}
        </div>
      )}

      <div
        className="px-10 pb-10"
        style={{ paddingTop: accent === "band" ? 0 : "2.5rem" }}
      >
        {/* Sender block (non-band accents) */}
        {accent !== "band" && hasSender && (
          <div className="mb-8">
            {content.senderName && (
              <p className="font-semibold" style={{ color, fontSize: fsName }}>
                {content.senderName}
              </p>
            )}
            {senderContacts.length > 0 && (
              <p className="text-gray-600 text-sm" style={{ fontSize: fsMeta }}>
                {senderContacts.join("  ·  ")}
              </p>
            )}
            {accent === "line" && (
              <div
                className="mt-3 h-0.5 w-16 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
        )}

        {/* Recipient + date row */}
        {(content.recipientName || content.companyName || content.date) && (
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              {content.recipientName && (
                <p className="font-medium">{content.recipientName}</p>
              )}
              {content.companyName && (
                <p className="text-gray-600">{content.companyName}</p>
              )}
            </div>
            {content.date && (
              <p
                className="text-gray-600 text-right whitespace-nowrap"
                style={{ fontSize: fsMeta }}
              >
                {content.date}
              </p>
            )}
          </div>
        )}

        {/* Object line */}
        {content.jobTitle && (
          <p className="mb-6" style={{ fontSize: fsObjet }}>
            <strong style={{ color }}>Objet :</strong> Candidature au poste de{" "}
            {content.jobTitle}
          </p>
        )}

        {/* Body */}
        {content.body ? (
          <div
            className="space-y-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            style={{ textAlign }}
            dangerouslySetInnerHTML={{ __html: sanitize(content.body) }}
          />
        ) : (
          <p className="text-gray-400 italic">
            Commencez à rédiger votre lettre de motivation...
          </p>
        )}

        {/* Signature */}
        {(sigImage && sigMode !== "typed") || content.signature ? (
          <div className="mt-8">
            {sigImage && sigMode !== "typed" ? (
              <>
                <img
                  src={sigImage}
                  alt="Signature"
                  style={{ height: "60px", objectFit: "contain" }}
                />
                {content.signature && (
                  <p
                    className="font-medium"
                    style={{ color, fontSize: fsSignature }}
                  >
                    {content.signature}
                  </p>
                )}
              </>
            ) : (
              <p
                style={{
                  color,
                  fontFamily: signatureFont,
                  fontSize: `calc(1.9em * ${head})`,
                  lineHeight: 1,
                }}
              >
                {content.signature}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
