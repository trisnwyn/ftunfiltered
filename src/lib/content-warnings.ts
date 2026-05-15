/**
 * Curated content warning tags. Keep IDs stable — they're stored in the DB.
 * Labels are bilingual (English / Vietnamese where useful).
 */
export const CONTENT_WARNINGS = [
  { id: "mental_health",  label: "Mental health",   description: "Depression, anxiety, dark thoughts" },
  { id: "self_harm",      label: "Self-harm",        description: "Self-injury, hurting yourself" },
  { id: "suicide",        label: "Suicide",          description: "Suicidal ideation, suicide" },
  { id: "abuse",          label: "Abuse",            description: "Physical, emotional, or sexual abuse" },
  { id: "eating",         label: "Eating disorder",  description: "Disordered eating, body image" },
  { id: "death",          label: "Death / grief",    description: "Death of a loved one, loss" },
  { id: "violence",       label: "Violence",         description: "Graphic violence or threats" },
  { id: "substance",      label: "Substance use",    description: "Alcohol, drugs, addiction" },
] as const;

export type ContentWarningId = (typeof CONTENT_WARNINGS)[number]["id"];

export function getCWLabel(id: string): string {
  return CONTENT_WARNINGS.find((cw) => cw.id === id)?.label ?? id;
}

export function getCWLabels(ids: string[] = []): string[] {
  return ids.map(getCWLabel);
}
