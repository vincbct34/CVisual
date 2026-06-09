"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/rich-text-editor").then((m) => ({
      default: m.RichTextEditor,
    })),
  { ssr: false },
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIGenerateSummaryButton } from "@/components/ai/ai-generate-summary-button";
import type {
  Section,
  Resume,
  ProfileContent,
  CustomField,
  ExperienceItem,
  EducationItem,
  SkillItem,
  SkillsDisplay,
  CustomMode,
  LanguageItem,
  ProjectItem,
  CertificationItem,
  InterestItem,
} from "@/types/resume";

interface SectionFormProps {
  section: Section;
  onUpdate: (content: Record<string, unknown>) => void;
  resume?: Resume;
}

export function SectionForm({ section, onUpdate, resume }: SectionFormProps) {
  switch (section.type) {
    case "profile":
      return (
        <ProfileForm
          content={section.content as unknown as ProfileContent}
          onUpdate={onUpdate}
          resume={resume}
        />
      );
    case "experience":
      return (
        <ListForm<ExperienceItem>
          content={section.content}
          onUpdate={onUpdate}
          renderItem={ExperienceItemForm}
          createItem={createExperience}
        />
      );
    case "education":
      return (
        <ListForm<EducationItem>
          content={section.content}
          onUpdate={onUpdate}
          renderItem={EducationItemForm}
          createItem={createEducation}
        />
      );
    case "skills":
      return <SkillsForm content={section.content} onUpdate={onUpdate} />;
    case "languages":
      return (
        <ListForm<LanguageItem>
          content={section.content}
          onUpdate={onUpdate}
          renderItem={LanguageItemForm}
          createItem={createLanguage}
        />
      );
    case "projects":
      return (
        <ListForm<ProjectItem>
          content={section.content}
          onUpdate={onUpdate}
          renderItem={ProjectItemForm}
          createItem={createProject}
        />
      );
    case "certifications":
      return (
        <ListForm<CertificationItem>
          content={section.content}
          onUpdate={onUpdate}
          renderItem={CertificationItemForm}
          createItem={createCertification}
        />
      );
    case "interests":
      return (
        <ListForm<InterestItem>
          content={section.content}
          onUpdate={onUpdate}
          renderItem={InterestItemForm}
          createItem={createInterest}
        />
      );
    default:
      return <CustomForm content={section.content} onUpdate={onUpdate} />;
  }
}

// Profile form
function ProfileForm({
  content,
  onUpdate,
  resume,
}: {
  content: ProfileContent;
  onUpdate: (c: Record<string, unknown>) => void;
  resume?: Resume;
}) {
  function update(field: keyof ProfileContent, value: string) {
    onUpdate({ ...content, [field]: value });
  }

  const customFields = content.customFields ?? [];

  function setCustomFields(fields: CustomField[]) {
    onUpdate({ ...content, customFields: fields });
  }

  function addCustomField() {
    setCustomFields([
      ...customFields,
      { id: crypto.randomUUID(), label: "", value: "" },
    ]);
  }

  function updateCustomField(id: string, key: "label" | "value", val: string) {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f)),
    );
  }

  function removeCustomField(id: string) {
    setCustomFields(customFields.filter((f) => f.id !== id));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // Downscale before storing: a full-resolution phone photo embedded as
      // base64 bloats the DB/payload and makes the exported PDF laggy to view.
      const img = new Image();
      img.onload = () => {
        const MAX = 512; // plenty for a print-quality profile photo
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          update("photoBase64", dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        update("photoBase64", canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => update("photoBase64", dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Photo de profil</Label>
        <div className="flex flex-wrap items-center gap-3">
          {content.photoBase64 && (
            <img
              src={content.photoBase64}
              alt="Profil"
              className="w-12 h-12 rounded-full object-cover border"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="min-w-0 flex-1 text-xs file:mr-2 file:rounded-md file:border file:border-input file:bg-transparent file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground file:cursor-pointer"
          />
          {content.photoBase64 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => update("photoBase64", "")}
              className="text-xs"
            >
              Supprimer
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          💡 Astuce : n&apos;hésitez pas à compresser votre image en amont pour
          une taille idéale (moins de 100 Ko).
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nom complet</Label>
          <Input
            value={content.fullName || ""}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Titre du poste</Label>
          <Input
            value={content.jobTitle || ""}
            onChange={(e) => update("jobTitle", e.target.value)}
            placeholder="Développeur Full-Stack"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            value={content.email || ""}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jean@exemple.com"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Téléphone</Label>
          <Input
            value={content.phone || ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Localisation</Label>
          <Input
            value={content.location || ""}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Paris, France"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Site web</Label>
          <Input
            value={content.website || ""}
            onChange={(e) => update("website", e.target.value)}
            placeholder="jeandupont.dev"
          />
        </div>
      </div>

      {/* Custom contact fields */}
      <div className="space-y-2">
        <Label className="text-xs">Informations supplémentaires</Label>
        {customFields.map((f) => (
          <div key={f.id} className="flex items-center gap-2">
            <Input
              value={f.label}
              onChange={(e) => updateCustomField(f.id, "label", e.target.value)}
              placeholder="Libellé (ex : LinkedIn)"
              className="w-1/3"
            />
            <Input
              value={f.value}
              onChange={(e) => updateCustomField(f.id, "value", e.target.value)}
              placeholder="Valeur"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive shrink-0"
              onClick={() => removeCustomField(f.id)}
              title="Supprimer"
            >
              X
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addCustomField}
          className="w-full"
        >
          + Ajouter une information
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs">Résumé</Label>
          {resume && (
            <AIGenerateSummaryButton
              resume={resume}
              onAccept={(summary) => update("summary", summary)}
            />
          )}
        </div>
        {resume && (
          <p className="text-xs text-muted-foreground">
            <strong>Générer avec l&apos;IA</strong> crée un résumé à partir de
            vos expériences et compétences (remplace le texte). Pour retoucher
            le texte existant, utilisez le bouton <strong>IA</strong> dans la
            barre d&apos;outils.
          </p>
        )}
        <RichTextEditor
          content={content.summary || ""}
          onChange={(html) => update("summary", html)}
          placeholder="Décrivez-vous en quelques lignes..."
          aiContext={`Résumé professionnel pour ${content.jobTitle || "un professionnel"}`}
        />
      </div>
    </div>
  );
}

// Generic list form for sections with items[]
interface ListFormProps<T extends { id: string }> {
  content: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
  renderItem: (
    item: T,
    onChange: (item: T) => void,
    onDelete: () => void,
  ) => React.ReactNode;
  createItem: () => T;
}

function ListForm<T extends { id: string }>({
  content,
  onUpdate,
  renderItem,
  createItem,
}: ListFormProps<T>) {
  const items = (content?.items as T[]) ?? [];

  function updateItem(index: number, item: T) {
    const newItems = [...items];
    newItems[index] = item;
    onUpdate({ ...content, items: newItems });
  }

  function deleteItem(index: number) {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate({ ...content, items: newItems });
  }

  function addItem() {
    onUpdate({ ...content, items: [...items, createItem()] });
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id} className="border rounded-lg p-3 space-y-2">
          {renderItem(
            item,
            (updated) => updateItem(i, updated),
            () => deleteItem(i),
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full">
        + Ajouter
      </Button>
    </div>
  );
}

// Shared item-form parts ----------------------------------------------------

/** Title + "Supprimer" row atop expandable item forms (experience, etc.). */
function ItemHeader({
  title,
  onDelete,
}: {
  title: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{title}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-destructive h-7 text-xs"
      >
        Supprimer
      </Button>
    </div>
  );
}

/** Compact "X" delete button for single-line item rows (skills, etc.). */
function RowDeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDelete}
      className="text-destructive h-8 text-xs"
    >
      X
    </Button>
  );
}

// Item forms and creators
function createExperience(): ExperienceItem {
  return {
    id: crypto.randomUUID(),
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}

function ExperienceItemForm(
  item: ExperienceItem,
  onChange: (i: ExperienceItem) => void,
  onDelete: () => void,
) {
  return (
    <>
      <ItemHeader
        title={item.position || "Nouvelle expérience"}
        onDelete={onDelete}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Poste"
          value={item.position}
          onChange={(e) => onChange({ ...item, position: e.target.value })}
        />
        <Input
          placeholder="Entreprise"
          value={item.company}
          onChange={(e) => onChange({ ...item, company: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="month"
          value={item.startDate}
          onChange={(e) => onChange({ ...item, startDate: e.target.value })}
        />
        <Input
          type="month"
          value={item.endDate}
          disabled={item.current}
          onChange={(e) => onChange({ ...item, endDate: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={item.current}
          onChange={(e) => onChange({ ...item, current: e.target.checked })}
        />
        Poste actuel
      </label>
      <RichTextEditor
        content={item.description}
        onChange={(html) => onChange({ ...item, description: html })}
        placeholder="Description..."
        aiContext={`Expérience : ${item.position} chez ${item.company}`}
      />
    </>
  );
}

function createEducation(): EducationItem {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    description: "",
  };
}

function EducationItemForm(
  item: EducationItem,
  onChange: (i: EducationItem) => void,
  onDelete: () => void,
) {
  return (
    <>
      <ItemHeader
        title={item.degree || "Nouvelle formation"}
        onDelete={onDelete}
      />
      <Input
        placeholder="Établissement"
        value={item.institution}
        onChange={(e) => onChange({ ...item, institution: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Diplôme"
          value={item.degree}
          onChange={(e) => onChange({ ...item, degree: e.target.value })}
        />
        <Input
          placeholder="Domaine"
          value={item.field}
          onChange={(e) => onChange({ ...item, field: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="month"
          value={item.startDate}
          onChange={(e) => onChange({ ...item, startDate: e.target.value })}
        />
        <Input
          type="month"
          value={item.endDate}
          onChange={(e) => onChange({ ...item, endDate: e.target.value })}
        />
      </div>
      <RichTextEditor
        content={item.description}
        onChange={(html) => onChange({ ...item, description: html })}
        placeholder="Description..."
        aiContext={`Formation : ${item.degree} ${item.field} à ${item.institution}`}
      />
    </>
  );
}

function createSkill(): SkillItem {
  return { id: crypto.randomUUID(), name: "", level: 3 };
}

const SKILL_DISPLAYS: { value: SkillsDisplay; label: string }[] = [
  { value: "dots", label: "Points (niveau)" },
  { value: "bar", label: "Barres (niveau)" },
  { value: "tags", label: "Étiquettes (sans niveau)" },
  { value: "text", label: "Liste simple (sans niveau)" },
];

function SkillsForm({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const display = (content.display as SkillsDisplay) || "dots";
  const showLevel = display === "dots" || display === "bar";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Style d&apos;affichage</Label>
        <Select
          value={display}
          onValueChange={(v) =>
            v != null && onUpdate({ ...content, display: String(v) })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value) =>
                SKILL_DISPLAYS.find((d) => d.value === value)?.label ??
                String(value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SKILL_DISPLAYS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ListForm<SkillItem>
        content={content}
        onUpdate={onUpdate}
        renderItem={(item, onChange, onDelete) =>
          SkillItemForm(item, onChange, onDelete, showLevel)
        }
        createItem={createSkill}
      />
    </div>
  );
}

function SkillItemForm(
  item: SkillItem,
  onChange: (i: SkillItem) => void,
  onDelete: () => void,
  showLevel = true,
) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Compétence"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="flex-1"
      />
      {showLevel && (
        <Select
          value={String(item.level)}
          onValueChange={(v) =>
            v != null && onChange({ ...item, level: Number(v) })
          }
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((l) => (
              <SelectItem key={l} value={String(l)}>
                {l}/5
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <RowDeleteButton onDelete={onDelete} />
    </div>
  );
}

function createLanguage(): LanguageItem {
  return { id: crypto.randomUUID(), name: "", level: "Intermédiaire" };
}

function LanguageItemForm(
  item: LanguageItem,
  onChange: (i: LanguageItem) => void,
  onDelete: () => void,
) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Langue"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="flex-1"
      />
      <Select
        value={item.level}
        onValueChange={(v) =>
          v != null && onChange({ ...item, level: String(v) })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {["Natif", "Courant", "Intermédiaire", "Débutant"].map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <RowDeleteButton onDelete={onDelete} />
    </div>
  );
}

function createProject(): ProjectItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    url: "",
    technologies: "",
  };
}

function ProjectItemForm(
  item: ProjectItem,
  onChange: (i: ProjectItem) => void,
  onDelete: () => void,
) {
  return (
    <>
      <ItemHeader title={item.name || "Nouveau projet"} onDelete={onDelete} />
      <Input
        placeholder="Nom du projet"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
      />
      <Input
        placeholder="Technologies"
        value={item.technologies}
        onChange={(e) => onChange({ ...item, technologies: e.target.value })}
      />
      <RichTextEditor
        content={item.description}
        onChange={(html) => onChange({ ...item, description: html })}
        placeholder="Description..."
        aiContext={`Projet : ${item.name}`}
      />
    </>
  );
}

function createCertification(): CertificationItem {
  return { id: crypto.randomUUID(), name: "", issuer: "", date: "" };
}

function CertificationItemForm(
  item: CertificationItem,
  onChange: (i: CertificationItem) => void,
  onDelete: () => void,
) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Certification"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="flex-1"
      />
      <Input
        placeholder="Organisme"
        value={item.issuer}
        onChange={(e) => onChange({ ...item, issuer: e.target.value })}
        className="flex-1"
      />
      <Input
        type="month"
        value={item.date}
        onChange={(e) => onChange({ ...item, date: e.target.value })}
        className="w-36"
      />
      <RowDeleteButton onDelete={onDelete} />
    </div>
  );
}

function createInterest(): InterestItem {
  return { id: crypto.randomUUID(), name: "" };
}

function InterestItemForm(
  item: InterestItem,
  onChange: (i: InterestItem) => void,
  onDelete: () => void,
) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Centre d'intérêt"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="flex-1"
      />
      <RowDeleteButton onDelete={onDelete} />
    </div>
  );
}

const CUSTOM_MODES: { value: CustomMode; label: string }[] = [
  { value: "text", label: "Texte libre" },
  { value: "list", label: "Liste" },
];

function CustomForm({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const mode: CustomMode = content.mode === "list" ? "list" : "text";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Type de contenu</Label>
        <Select
          value={mode}
          onValueChange={(v) =>
            v != null && onUpdate({ ...content, mode: String(v) })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value) =>
                CUSTOM_MODES.find((m) => m.value === value)?.label ??
                String(value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CUSTOM_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {mode === "list" ? (
        <SkillsForm content={content} onUpdate={onUpdate} />
      ) : (
        <RichTextEditor
          content={(content?.text as string) ?? ""}
          onChange={(html) => onUpdate({ ...content, text: html })}
          placeholder="Contenu de la section..."
        />
      )}
    </div>
  );
}
