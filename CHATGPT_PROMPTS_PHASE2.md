# Prompt ChatGPT - Fase 2: Scarti Modificabili + Planner Produzioni

Usa questi prompt con ChatGPT (o GPT-4) per generare il codice boilerplate della Fase 2.

---

## PROMPT 9: Componente React - Modifica Scarti Produzione

```
Genera un componente React TypeScript per modificare gli scarti di una singola produzione.

Requisiti:
- Nome file: ProductionWasteEditor.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Mostra lista ingredienti della ricetta
- Per ogni ingrediente: nome, scarto standard (%), scarto effettivo (%), differenza, impatto costo
- Input number per scarto effettivo (0-100%)
- Slider alternativo sincronizzato con input
- Colore codice: verde (scarto < standard), giallo (scarto = standard), rosso (scarto > standard)
- Calcolo automatico impatto su costo totale piatto
- Bottone Salva con conferma
- Mostra preview costo piatto prima/dopo

Struttura dati input:
interface ProductionWasteEditorProps {
  productionBatchId: string;
  recipeName: string;
  ingredients: {
    id: string;
    name: string;
    standardWastePercentage: number;
    actualWastePercentage: number;
    costPerUnit: number;
    quantity: number;
  }[];
  originalTotalCost: number;
  onSave: (wasteUpdates: WasteUpdate[]) => Promise<void>;
  onCancel: () => void;
}

interface WasteUpdate {
  ingredientId: string;
  actualWastePercentage: number;
}

Genera il componente completo con:
1. Gestione stato scarti modificati
2. Calcolo impatto costo in tempo reale
3. Validazione input (0-100%)
4. Slider + input sincronizzati
5. Preview costo totale
6. Animazioni smooth
7. Feedback visivo salvataggio
```

---

## PROMPT 10: Componente React - Generatore Shopping List

```
Genera un componente React TypeScript per generare la shopping list dalla produzione settimanale.

Requisiti:
- Nome file: ShoppingListGenerator.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Input: piano produzioni settimanale (ricette + quantità per giorno)
- Output: lista ingredienti raggruppata per fornitore
- Colonne: Ingrediente, Categoria, Quantità Totale, Unità, Fornitore, Prezzo Unitario, Costo Totale
- Filtri: fornitore, categoria
- Ordinamento: per fornitore, per prezzo
- Esportazione: CSV, PDF
- Calcolo automatico: quantità totale ingrediente (considerando rese e scarti)
- Logica semilavorati: se ricetta richiede semilavorato, acquistare semilavorato (non ingredienti base)

Struttura dati input:
interface ShoppingListItem {
  id: string;
  ingredientName: string;
  category: string;
  supplier: string;
  quantityNeeded: number;
  unitType: string;
  pricePerUnit: number;
  totalCost: number;
  notes?: string;
}

Props:
- productionPlan: ProductionPlan[]
- recipes: Recipe[]
- ingredients: Ingredient[]
- onExport: (format: 'csv' | 'pdf', data: ShoppingListItem[]) => void

Genera il componente completo con:
1. Calcolo ricorsivo ingredienti da semilavorati
2. Aggregazione per fornitore
3. Gestione unità di misura
4. Calcolo costi totali
5. Export funzionante
6. Responsive design
```

---

## PROMPT 11: Componente React - Generatore HACCP Stampabile

```
Genera un componente React TypeScript per generare schede HACCP stampabili dalla produzione.

Requisiti:
- Nome file: HACCPSheetGenerator.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Input: piano produzioni settimanale
- Output: scheda HACCP stampabile per ogni ricetta/giorno
- Campi pre-compilati: ricetta, data, quantità, ingredienti, lotto
- Campi da compilare a mano: temperatura finale, operatore, firma
- Layout: A4 landscape, pronto per stampa
- Bottone: Stampa, Scarica PDF, Anteprima
- Supporta batch multiple per ricetta

Struttura dati input:
interface HACCPSheet {
  batchId: string;
  recipeName: string;
  date: Date;
  quantity: number;
  unitType: string;
  ingredients: {
    name: string;
    quantity: number;
    supplier: string;
    lotNumber?: string;
  }[];
  productionSteps: string[];
  conservationMethod: string;
  maxConservationTime: string;
}

Props:
- productionPlan: ProductionPlan[]
- recipes: Recipe[]
- onPrint: (sheets: HACCPSheet[]) => void
- onDownloadPDF: (sheets: HACCPSheet[]) => void

Genera il componente completo con:
1. Layout A4 stampabile
2. Campi pre-compilati
3. Spazi per compilazione manuale
4. Print CSS ottimizzato
5. Generazione PDF
6. Preview prima stampa
```

---

## PROMPT 12: Hook Custom - useProductionCalculations

```
Genera un hook React TypeScript custom per calcoli di produzione.

Requisiti:
- Nome file: useProductionCalculations.ts
- Usa React 19 + TypeScript
- Funzioni:
  1. calculateIngredientRequirements(recipes: Recipe[], quantities: number[]) - calcola ingredienti totali
  2. calculateWasteImpact(ingredientId: string, wastePercentage: number, quantity: number) - impatto scarto
  3. calculateTotalCost(ingredients: Ingredient[], quantities: number[]) - costo totale
  4. expandSemiFinishedToIngredients(recipeId: string) - espandi semilavorati a ingredienti base
  5. groupBySupplier(ingredients: Ingredient[]) - raggruppa per fornitore
  6. generateShoppingList(requirements: Requirement[]) - genera lista acquisti
  7. calculateYield(recipeId: string, quantity: number) - calcola resa effettiva

Input:
- recipes: Recipe[]
- ingredients: Ingredient[]
- productionPlan: ProductionPlan[]

Return:
- calculateRequirements: (quantities: number[]) => Requirement[]
- calculateCost: (requirements: Requirement[]) => number
- expandRecipe: (recipeId: string) => Ingredient[]
- groupBySupplier: (items: Item[]) => GroupedItems
- generateShoppingList: () => ShoppingListItem[]
- getWasteImpact: (ingredientId: string, percentage: number) => number

Genera l'hook completo con:
1. Logica ricorsiva per semilavorati
2. Calcoli costi accurati
3. Gestione unità di misura
4. Memoizzazione per performance
5. Type safety completo
```

---

## PROMPT 13: Componente React - Visualizzatore Fabbisogni

```
Genera un componente React TypeScript per visualizzare i fabbisogni di ingredienti dalla produzione.

Requisiti:
- Nome file: RequirementsViewer.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Tabella: Ingrediente, Categoria, Quantità Totale, Unità, Fornitore, Stock Attuale, Differenza
- Colori: verde (stock sufficiente), rosso (stock insufficiente)
- Filtri: fornitore, categoria, stato stock
- Ricerca: per ingrediente
- Esportazione: CSV
- Mostra albero espandibile: ricetta → semilavorati → ingredienti

Struttura dati input:
interface Requirement {
  ingredientId: string;
  ingredientName: string;
  category: string;
  supplier: string;
  quantityNeeded: number;
  unitType: string;
  currentStock: number;
  difference: number;
  pricePerUnit: number;
}

Props:
- requirements: Requirement[]
- onFilterChange?: (filters: FilterState) => void
- onExport?: (data: Requirement[]) => void

Genera il componente completo con:
1. Tabella interattiva
2. Filtri funzionanti
3. Calcolo differenza stock
4. Indicatori visivi
5. Export CSV
```

---

## PROMPT 14: Componente React - Editor Piano Produzioni Settimanale

```
Genera un componente React TypeScript per editare il piano di produzioni settimanale.

Requisiti:
- Nome file: WeeklyPlanEditor.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Tabella: Ricetta, Lunedì, Martedì, ..., Domenica, Totale Settimanale
- Input number per ogni cella (quantità da produrre)
- Totali per colonna (giorno) e riga (ricetta)
- Drag-and-drop per riordinare ricette
- Bottoni: Aggiungi Ricetta, Rimuovi Ricetta, Salva Piano
- Salvataggio automatico con debounce
- Mostra: ricette totali, giorni di produzione, quantità totale

Struttura dati input:
interface WeeklyPlan {
  id: string;
  recipes: {
    recipeId: string;
    recipeName: string;
    quantities: {
      [day: string]: number;
    };
  }[];
}

Props:
- plan: WeeklyPlan
- recipes: Recipe[]
- onPlanChange: (plan: WeeklyPlan) => void
- onSave: (plan: WeeklyPlan) => Promise<void>
- isLoading?: boolean

Genera il componente completo con:
1. Gestione stato piano
2. Calcolo totali dinamici
3. Validazione input
4. Drag-and-drop ricette
5. Salvataggio automatico
6. Responsive design
```

---

## PROMPT 15: Vitest Test - ProductionWasteEditor

```
Genera test Vitest per il componente ProductionWasteEditor.

Requisiti:
- Nome file: ProductionWasteEditor.test.tsx
- Usa Vitest + React Testing Library
- Test cases:
  1. Rendering con ingredienti
  2. Modifica scarto effettivo
  3. Sincronizzazione slider + input
  4. Calcolo impatto costo
  5. Validazione range 0-100%
  6. Salvataggio dati
  7. Annullamento modifiche

Genera test completi con:
1. Setup fixture dati
2. Simulazione interazioni
3. Assertions su calcoli
4. Mock funzioni callback
5. Snapshot test
```

---

## PROMPT 16: Vitest Test - ShoppingListGenerator

```
Genera test Vitest per il componente ShoppingListGenerator.

Requisiti:
- Nome file: ShoppingListGenerator.test.tsx
- Usa Vitest + React Testing Library
- Test cases:
  1. Generazione lista da produzione
  2. Aggregazione per fornitore
  3. Calcolo quantità totali
  4. Logica semilavorati (espansione)
  5. Filtri funzionanti
  6. Ordinamento
  7. Export CSV/PDF

Genera test completi con:
1. Setup fixture dati
2. Mock recipe/ingredient data
3. Assertions su aggregazioni
4. Test export functions
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

**Sessione 1 (ChatGPT - Componenti)**:
1. PROMPT 9 - ProductionWasteEditor
2. PROMPT 10 - ShoppingListGenerator
3. PROMPT 11 - HACCPSheetGenerator

**Sessione 2 (ChatGPT - Hook + Componenti)**:
4. PROMPT 12 - useProductionCalculations
5. PROMPT 13 - RequirementsViewer
6. PROMPT 14 - WeeklyPlanEditor

**Sessione 3 (ChatGPT - Test)**:
7. PROMPT 15 - Test ProductionWasteEditor
8. PROMPT 16 - Test ShoppingListGenerator

---

## Note Importanti

- **Versioni**: React 19, TypeScript 5.x, Tailwind CSS 4.x
- **Librerie UI**: shadcn/ui per dialog/modal
- **Icons**: lucide-react per icone
- **Export**: Usa librerie come `papaparse` (CSV) e `jspdf` (PDF)
- **Type Safety**: Strict mode TypeScript
- **Performance**: Memoizzazione per liste lunghe

---

## Prossimo Passo

1. **Copia i PROMPT 1-8** dal file `CHATGPT_PROMPTS_PHASE1.md`
2. **Esegui in ChatGPT** in ordine
3. **Salva il codice generato** in file separati
4. **Una volta completati**, invia i file a me per integrazione

Pronto? Inizia con il PROMPT 1 da PHASE1!
