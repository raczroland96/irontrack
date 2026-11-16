import type { Locale } from "@/lib/i18n";

const hungarianLabels: Readonly<Record<string, string>> = {
  All: "Összes",
  Chest: "Mell",
  Back: "Hát",
  Shoulders: "Váll",
  Arms: "Kar",
  Legs: "Láb",
  Calves: "Vádli",
  Abs: "Has",
  "Full Body": "Teljes test",
  Barbell: "Súlyzórúd",
  Dumbbells: "Kézisúlyzók",
  Machine: "Gép",
  "Free Weights": "Szabad súlyok",
  Bodyweight: "Saját testsúly",
  Cable: "Csiga",
  Kettlebell: "Kettlebell",
  "Resistance Bands": "Gumiszalag",
  Other: "Egyéb",
};

/** Translate known classification labels, retaining their stored values and custom text. */
export function exerciseLabel(value: string, locale: Locale): string {
  return locale === "hu" ? hungarianLabels[value] ?? value : value;
}
