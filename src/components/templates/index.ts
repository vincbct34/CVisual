import type { ComponentType } from "react";
import type { TemplateProps } from "@/types/resume";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { CreativeTemplate } from "./CreativeTemplate";
import { ProfessionalTemplate } from "./ProfessionalTemplate";

// Templates are pure presentational components (no client-only APIs), so they
// can render on the server (render page, HTML export) and the client (editor
// preview) from one static registry — no next/dynamic, no hydration race.
export const TEMPLATES: Record<
  string,
  { name: string; component: ComponentType<TemplateProps> }
> = {
  classic: { name: "Classique", component: ClassicTemplate },
  modern: { name: "Moderne", component: ModernTemplate },
  minimal: { name: "Minimal", component: MinimalTemplate },
  creative: { name: "Créatif", component: CreativeTemplate },
  professional: { name: "Professionnel", component: ProfessionalTemplate },
};

export function getTemplate(key: string): ComponentType<TemplateProps> {
  return (TEMPLATES[key] ?? TEMPLATES.classic).component;
}
