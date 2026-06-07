"use client";

import { CoverLetterTemplate } from "@/components/templates/cover-letter-template";
import type {
  CoverLetterContent,
  CoverLetterStyle,
} from "@/types/cover-letter";
import {
  DEFAULT_COVER_LETTER_CONTENT,
  DEFAULT_COVER_LETTER_STYLE,
} from "@/types/cover-letter";

interface Props {
  content: Record<string, unknown>;
  style: Record<string, unknown>;
}

export function RenderCoverLetterClient({ content, style }: Props) {
  const typedContent =
    (content as unknown as CoverLetterContent) ?? DEFAULT_COVER_LETTER_CONTENT;
  const typedStyle =
    (style as unknown as CoverLetterStyle) ?? DEFAULT_COVER_LETTER_STYLE;

  return (
    <>
      <style>{`body { margin: 0; padding: 0; background: white; } * { box-sizing: border-box; }`}</style>
      <div
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: 0,
          padding: 0,
        }}
      >
        <CoverLetterTemplate content={typedContent} style={typedStyle} />
      </div>
    </>
  );
}
