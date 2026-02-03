# Prompt ChatGPT - Fase 1: Nesting Infinito + Food Matrix UI

Usa questi prompt con ChatGPT (o GPT-4) per generare il codice boilerplate. Copia-incolla direttamente.

---

## PROMPT 1: Componente React - Albero Gerarchico Ricette

```
Genera un componente React TypeScript per visualizzare un albero gerarchico di ricette con nesting infinito.

Requisiti:
- Nome file: RecipeHierarchyTree.tsx
- Usa React 19 + TypeScript
- Supporta nesting infinito (semilavorati dentro semilavorati)
- Mostra: nome ricetta, categoria, costo totale, numero componenti
- Icone da lucide-react (ChefHat, Package, ChevronDown, ChevronRight)
- Colori: usa Tailwind CSS con tema light
- Interattività: click per espandere/collassare nodi
- Ricerca: campo input per filtrare ricette per nome
- Mostra livello di profondità (indentazione)

Struttura dati input:
interface RecipeNode {
  id: string;
  code: string;
  name: string;
  category: string;
  totalCost: number;
  componentCount: number;
  children?: RecipeNode[];
  level: number;
}

Props:
- recipes: RecipeNode[]
- onSelectRecipe?: (recipe: RecipeNode) => void
- expandedIds?: Set<string>
- onToggleExpand?: (id: string) => void

Genera il componente completo con:
1. Funzione di ricerca ricorsiva
2. Rendering ricorsivo dei nodi
3. Animazioni smooth per expand/collapse
4. Indicatori visivi di profondità
5. Hover effects
```

---

## PROMPT 2: Componente React - Tabella Food Matrix

```
Genera un componente React TypeScript per visualizzare la Food Matrix come tabella interattiva.

Requisiti:
- Nome file: FoodMatrixTable.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Tabella scrollabile orizzontalmente
- Colonne: Ingrediente, Categoria, Fornitore, Prezzo Unitario, Quantità Ricetta, Costo Riga, Costo Totale
- Righe raggruppate per ricetta (con header ricetta espandibile)
- Ordinamento cliccabile per colonna
- Filtri: categoria, fornitore, range prezzo
- Ricerca: campo input per filtrare ingredienti
- Evidenziazione: colonna "Costo Totale" con colore gradiente (verde=basso, rosso=alto)
- Totale: riga finale con somma costi

Struttura dati input:
interface FoodMatrixItem {
  id: string;
  recipeId: string;
  recipeName: string;
  ingredientId: string;
  ingredientName: string;
  category: string;
  supplier: string;
  unitPrice: number;
  quantity: number;
  unitType: string;
  costPerLine: number;
  totalCost: number;
}

Props:
- items: FoodMatrixItem[]
- onFilterChange?: (filters: FilterState) => void
- onSort?: (column: string, direction: 'asc' | 'desc') => void
- isLoading?: boolean

Genera il componente completo con:
1. Stato per filtri e ordinamento
2. Funzioni di filtro/ricerca
3. Calcolo totali dinamico
4. Responsive design
5. Indicatori di caricamento
```

---

## PROMPT 3: Componente React - Selector Ricette Gerarchico

```
Genera un componente React TypeScript per selezionare ricette/ingredienti da un albero gerarchico.

Requisiti:
- Nome file: RecipeSelector.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Modal/Dialog per selezione
- Albero gerarchico con checkbox
- Ricerca ricorsiva per nome
- Mostra: nome, categoria, prezzo unitario
- Multi-select con contatore
- Bottoni: Seleziona Tutto, Deseleziona Tutto, Applica, Annulla
- Supporta nesting infinito

Struttura dati input:
interface SelectableRecipe {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  children?: SelectableRecipe[];
  selected?: boolean;
}

Props:
- recipes: SelectableRecipe[]
- onSelect: (selected: SelectableRecipe[]) => void
- onCancel: () => void
- title?: string
- multiSelect?: boolean

Genera il componente completo con:
1. Gestione stato selezioni
2. Ricerca ricorsiva
3. Validazione selezioni
4. Animazioni smooth
5. Accessibilità (aria labels)
```

---

## PROMPT 4: Componente React - Aggiustatore Scarti

```
Genera un componente React TypeScript per modificare gli scarti per singola produzione.

Requisiti:
- Nome file: WasteAdjuster.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Mostra: ingrediente, scarto standard (%), scarto effettivo (%), differenza
- Input number per modificare scarto effettivo
- Slider alternativo per scarto effettivo (0-100%)
- Calcolo automatico: differenza = effettivo - standard
- Colore indicatore: verde (scarto minore), rosso (scarto maggiore)
- Salva automaticamente con debounce
- Mostra impatto su costo piatto

Struttura dati input:
interface WasteItem {
  id: string;
  ingredientName: string;
  standardWastePercentage: number;
  actualWastePercentage?: number;
  impactOnCost: number;
}

Props:
- items: WasteItem[]
- onWasteChange: (itemId: string, newPercentage: number) => void
- onSave?: () => void
- isLoading?: boolean

Genera il componente completo con:
1. Input number + slider sincronizzati
2. Calcolo differenza in tempo reale
3. Visualizzazione impatto costo
4. Debounce per salvataggio
5. Validazione range 0-100%
```

---

## PROMPT 5: Componente React - Planner Produzioni Settimanale

```
Genera un componente React TypeScript per il planner di produzioni settimanali.

Requisiti:
- Nome file: WeeklyProductionPlanner.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Tabella: Ricetta, Lunedì, Martedì, ..., Domenica, Totale Settimanale
- Input number per ogni cella (quantità da produrre)
- Totali per colonna (giorno) e riga (ricetta)
- Bottoni: Calcola Fabbisogni, Genera Shopping List, Genera HACCP
- Mostra statistiche: ricette totali, giorni di produzione, quantità totale
- Salvataggio automatico con debounce

Struttura dati input:
interface ProductionPlan {
  recipeId: string;
  recipeName: string;
  quantities: {
    [day: string]: number; // lunedì, martedì, ecc.
  };
}

Props:
- recipes: ProductionPlan[]
- onQuantityChange: (recipeId: string, day: string, quantity: number) => void
- onCalculateRequirements: () => void
- onGenerateShoppingList: () => void
- onGenerateHACCP: () => void
- isLoading?: boolean

Genera il componente completo con:
1. Gestione stato quantità per giorno
2. Calcolo totali dinamici
3. Validazione input (non negativi)
4. Responsive per mobile
5. Esportazione dati
```

---

## PROMPT 6: Hook Custom - useRecipeHierarchy

```
Genera un hook React TypeScript custom per gestire la logica di nesting infinito ricette.

Requisiti:
- Nome file: useRecipeHierarchy.ts
- Usa React 19 + TypeScript
- Funzioni:
  1. expandNode(nodeId: string) - espandi nodo
  2. collapseNode(nodeId: string) - collassa nodo
  3. toggleNode(nodeId: string) - toggle
  4. expandAll() - espandi tutti
  5. collapseAll() - collassa tutti
  6. searchRecipes(query: string) - filtra ricorsivamente
  7. getRecipeAtLevel(level: number) - ricette a livello specifico
  8. calculateTotalCost(recipeId: string) - calcola costo ricorsivo
  9. flattenHierarchy() - converti in array piatto

Input:
- recipes: RecipeNode[]

Return:
- expandedIds: Set<string>
- searchResults: RecipeNode[]
- toggleExpand: (id: string) => void
- search: (query: string) => void
- getTotalCost: (id: string) => number
- getDepth: (id: string) => number

Genera l'hook completo con:
1. Gestione stato espansioni
2. Logica ricerca ricorsiva
3. Calcolo costi ricorsivo
4. Memoizzazione per performance
5. Type safety completo
```

---

## PROMPT 7: Vitest Test - RecipeHierarchyTree

```
Genera test Vitest per il componente RecipeHierarchyTree.

Requisiti:
- Nome file: RecipeHierarchyTree.test.tsx
- Usa Vitest + React Testing Library
- Test cases:
  1. Rendering iniziale con nesting
  2. Espansione/collasso nodi
  3. Ricerca ricorsiva
  4. Selezione ricetta
  5. Indicatori di profondità
  6. Gestione ricette vuote
  7. Performance con 1000+ nodi

Genera test completi con:
1. Setup fixture dati
2. Mock props
3. Assertions complete
4. Snapshot test
5. Performance test
```

---

## PROMPT 8: Vitest Test - FoodMatrixTable

```
Genera test Vitest per il componente FoodMatrixTable.

Requisiti:
- Nome file: FoodMatrixTable.test.tsx
- Usa Vitest + React Testing Library
- Test cases:
  1. Rendering tabella con dati
  2. Ordinamento colonne
  3. Filtri funzionanti
  4. Ricerca ingredienti
  5. Calcolo totali
  6. Raggruppamento ricette
  7. Responsività

Genera test completi con:
1. Setup fixture dati
2. Simulazione interazioni
3. Assertions su DOM
4. Snapshot test
5. Test filtri e ordinamento
```

---

## Come Usare Questi Prompt

1. **Copia un prompt** dalla lista sopra
2. **Incolla in ChatGPT** (o GPT-4)
3. **Aspetta la risposta** - avrà il codice completo
4. **Copia il codice generato** in un file `.tsx` o `.ts`
5. **Io farò**: integrazione, correzioni logiche, test critici

---

## Ordine di Esecuzione Consigliato

**Sessione 1 (ChatGPT)**:
1. PROMPT 1 - RecipeHierarchyTree
2. PROMPT 2 - FoodMatrixTable
3. PROMPT 3 - RecipeSelector

**Sessione 2 (ChatGPT)**:
4. PROMPT 4 - WasteAdjuster
5. PROMPT 5 - WeeklyProductionPlanner
6. PROMPT 6 - useRecipeHierarchy

**Sessione 3 (ChatGPT)**:
7. PROMPT 7 - Test RecipeHierarchyTree
8. PROMPT 8 - Test FoodMatrixTable

---

## Note Importanti

- **Versioni**: React 19, TypeScript 5.x, Tailwind CSS 4.x
- **Librerie UI**: shadcn/ui per componenti complessi
- **Icons**: lucide-react per icone
- **Stile**: Tailwind CSS (no CSS modules)
- **Type Safety**: Strict mode TypeScript
- **Accessibilità**: WCAG 2.1 AA

Dopo che ChatGPT genera il codice, io lo integrerò, testerò e ottimizzerò per il tuo progetto.

Pronto? Copia il PROMPT 1 e incollalo in ChatGPT!
