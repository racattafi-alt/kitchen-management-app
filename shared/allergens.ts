/**
 * Lista allergeni standard secondo normativa EU 1169/2011
 */
export const STANDARD_ALLERGENS = [
  "Glutine",
  "Crostacei",
  "Uova",
  "Pesce",
  "Arachidi",
  "Soia",
  "Latte",
  "Frutta a guscio",
  "Sedano",
  "Senape",
  "Semi di sesamo",
  "Anidride solforosa e solfiti",
  "Lupini",
  "Molluschi",
] as const;

export type Allergen = typeof STANDARD_ALLERGENS[number];
