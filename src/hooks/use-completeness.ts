import type { Resume } from "@/types/resume";

export interface CompletenessResult {
  score: number;
  missing: string[];
}

export function useCompletenessScore(
  resume: Resume | null,
): CompletenessResult {
  if (!resume) return { score: 0, missing: [] };

  const profile = resume.sections.find((s) => s.type === "profile")?.content as
    | Record<string, unknown>
    | undefined;

  const items = (type: string) =>
    ((
      resume.sections.find((s) => s.type === type)?.content as Record<
        string,
        unknown
      >
    )?.items as unknown[]) ?? [];

  const checks: { label: string; done: boolean }[] = [
    { label: "Nom complet", done: !!(profile?.fullName as string)?.trim() },
    { label: "Titre de poste", done: !!(profile?.jobTitle as string)?.trim() },
    { label: "Email", done: !!(profile?.email as string)?.trim() },
    { label: "Téléphone", done: !!(profile?.phone as string)?.trim() },
    {
      label: "Résumé professionnel",
      done: !!(profile?.summary as string)?.trim(),
    },
    {
      label: "Expérience professionnelle",
      done: items("experience").length > 0,
    },
    { label: "Formation", done: items("education").length > 0 },
    { label: "Compétences (min. 3)", done: items("skills").length >= 3 },
  ];

  const done = checks.filter((c) => c.done).length;
  return {
    score: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}
