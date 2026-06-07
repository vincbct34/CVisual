export interface CoverLetterContent {
  recipientName: string;
  companyName: string;
  jobTitle: string;
  body: string; // HTML from Tiptap
  // Optional sender / letter details (backward compatible)
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderLocation?: string;
  date?: string; // composed display string, e.g. "Paris, le 6 juin 2026"
  dateCity?: string; // city portion (for the date picker UI)
  dateValue?: string; // ISO yyyy-mm-dd (for the date picker UI)
  signature?: string; // closing / typed name
  signatureMode?: "typed" | "draw" | "upload"; // how the signature renders
  signatureImage?: string; // PNG/JPG data URL for draw/upload modes
}

export type CoverLetterAccent = "minimal" | "line" | "band";
export type CoverLetterAlign = "left" | "justify";

export interface CoverLetterStyle {
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  lineHeight?: number; // default 1.5
  textAlign?: CoverLetterAlign; // body alignment, default "left"
  accent?: CoverLetterAccent; // header treatment, default "minimal"
  headingScale?: number; // multiplier for sender name / objet / signature (default 1)
  metaScale?: number; // multiplier for date + sender contacts (default 1)
}

export interface CoverLetter {
  id: string;
  title: string;
  content: CoverLetterContent;
  style: CoverLetterStyle;
  language: string;
  resumeId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_COVER_LETTER_CONTENT: CoverLetterContent = {
  recipientName: "",
  companyName: "",
  jobTitle: "",
  body: "",
  senderName: "",
  senderEmail: "",
  senderPhone: "",
  senderLocation: "",
  date: "",
  dateCity: "",
  dateValue: "",
  signature: "",
  signatureMode: "typed",
  signatureImage: "",
};

export const DEFAULT_COVER_LETTER_STYLE: CoverLetterStyle = {
  fontFamily: "Inter",
  fontSize: 14,
  primaryColor: "#1a1a1a",
  lineHeight: 1.5,
  textAlign: "left",
  accent: "minimal",
  headingScale: 1,
  metaScale: 1,
};
