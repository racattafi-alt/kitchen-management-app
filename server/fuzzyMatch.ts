/**
 * Fuzzy matching utilities for import validation.
 * Uses Levenshtein distance normalized to [0, 1] similarity score.
 */

/**
 * Calcola la distanza di Levenshtein tra due stringhe.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Restituisce uno score di similarità tra 0 (completamente diversi) e 1 (identici).
 * Il confronto è case-insensitive e ignora spazi multipli.
 */
export function similarityScore(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(na, nb) / maxLen;
}

export type MatchLevel = 'exact' | 'high' | 'medium' | 'none';

export interface FuzzyMatchResult {
  inputValue: string;
  matchedId: string | null;
  matchedName: string | null;
  score: number;
  level: MatchLevel;
  alternatives: Array<{ id: string; name: string; score: number }>;
}

/**
 * Trova la migliore corrispondenza per un valore di input
 * in un array di candidati {id, name}.
 *
 * Livelli:
 *  - exact  (score = 1.0):   corrispondenza esatta
 *  - high   (score ≥ 0.85):  match automatico (verde)
 *  - medium (score ≥ 0.60):  match probabile (giallo, da confermare)
 *  - none   (score < 0.60):  nessuna corrispondenza (rosso)
 */
export function findBestMatch(
  inputValue: string,
  candidates: Array<{ id: string; name: string }>
): FuzzyMatchResult {
  if (!inputValue.trim() || candidates.length === 0) {
    return {
      inputValue,
      matchedId: null,
      matchedName: null,
      score: 0,
      level: 'none',
      alternatives: [],
    };
  }

  const scored = candidates
    .map((c) => ({ ...c, score: similarityScore(inputValue, c.name) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const alternatives = scored.slice(1, 4); // massimo 3 alternative

  let level: MatchLevel;
  if (best.score === 1) level = 'exact';
  else if (best.score >= 0.85) level = 'high';
  else if (best.score >= 0.6) level = 'medium';
  else level = 'none';

  return {
    inputValue,
    matchedId: level !== 'none' ? best.id : null,
    matchedName: level !== 'none' ? best.name : null,
    score: best.score,
    level,
    alternatives,
  };
}

/**
 * Analizza tutte le righe importate e restituisce il report di matching
 * per ogni fornitore non trovato esattamente.
 */
export function analyzeSupplierMatches(
  rows: Array<{ name: string; supplier: string }>,
  existingSuppliers: Array<{ id: string; name: string }>
): Array<FuzzyMatchResult & { ingredientName: string }> {
  const results: Array<FuzzyMatchResult & { ingredientName: string }> = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!row.supplier || seen.has(row.supplier.toLowerCase())) continue;
    seen.add(row.supplier.toLowerCase());

    const match = findBestMatch(row.supplier, existingSuppliers);
    if (match.level !== 'exact') {
      results.push({ ...match, ingredientName: row.name });
    }
  }

  return results;
}

/**
 * Analizza le righe importate per trovare ingredienti già esistenti nel DB.
 * Restituisce il report di matching per ogni riga.
 */
export function analyzeIngredientMatches(
  rows: Array<{ name: string }>,
  existingIngredients: Array<{ id: string; name: string }>
): Array<FuzzyMatchResult> {
  return rows.map((row) => findBestMatch(row.name, existingIngredients));
}
