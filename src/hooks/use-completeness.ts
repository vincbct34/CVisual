import type { Resume } from "@/types/resume";
import { useT } from "@/components/i18n/language-provider";

export interface CompletenessResult {
  score: number;
  missing: string[];
}

export function useCompletenessScore(
  resume: Resume | null,
): CompletenessResult {
  const t = useT();
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
    {
      label: t("completeness.fullName"),
      done: !!(profile?.fullName as string)?.trim(),
    },
    {
      label: t("completeness.jobTitle"),
      done: !!(profile?.jobTitle as string)?.trim(),
    },
    {
      label: t("completeness.email"),
      done: !!(profile?.email as string)?.trim(),
    },
    {
      label: t("completeness.phone"),
      done: !!(profile?.phone as string)?.trim(),
    },
    {
      label: t("completeness.summary"),
      done: !!(profile?.summary as string)?.trim(),
    },
    {
      label: t("completeness.experience"),
      done: items("experience").length > 0,
    },
    { label: t("completeness.education"), done: items("education").length > 0 },
    { label: t("completeness.skills"), done: items("skills").length >= 3 },
  ];

  const done = checks.filter((c) => c.done).length;
  return {
    score: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}
