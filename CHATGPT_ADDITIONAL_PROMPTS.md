# Prompt ChatGPT Aggiuntivi - Kitchen Management System

Usa questi prompt per generare componenti aggiuntivi che completano il sistema.

---

## PROMPT 9: Componente RecipeDetailView

```
Genera un componente React TypeScript per visualizzare i dettagli completi di una ricetta con albero gerarchico dei componenti.

Requisiti:
- Nome file: RecipeDetailView.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Mostra: nome ricetta, codice, categoria, resa%, conservazione
- Tabella componenti con: nome ingrediente/semilavorato, quantità, unità, costo unitario, costo totale
- Supporta nesting infinito: se un componente è un semilavorato, mostra icona espandibile
- Calcolo automatico costo totale ricetta
- Grafico a torta per distribuzione costi per categoria ingrediente
- Bottoni: Modifica, Duplica, Elimina, Esporta PDF
- Breadcrumb per navigazione livelli gerarchici

Struttura dati input:
interface RecipeDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  yieldPercentage: number;
  conservationMethod: string;
  shelfLifeDays: number;
  components: Array<{
    id: string;
    type: 'ingredient' | 'semi_finished';
    name: string;
    quantity: number;
    unitType: string;
    pricePerUnit: number;
    totalCost: number;
    children?: RecipeDetail['components'];
  }>;
  totalCost: number;
}

Props:
- recipe: RecipeDetail
- onEdit?: () => void
- onDuplicate?: () => void
- onDelete?: () => void
- onExportPDF?: () => void

Genera il componente completo con:
1. Rendering ricorsivo componenti
2. Espansione/collasso semilavorati
3. Calcolo costi dinamico
4. Grafico distribuzione costi (usa recharts)
5. Breadcrumb navigation
```

---

## PROMPT 10: Componente IngredientForm

```
Genera un componente React TypeScript per form CRUD ingredienti con validazione.

Requisiti:
- Nome file: IngredientForm.tsx
- Usa React 19 + TypeScript + Tailwind CSS + React Hook Form + Zod
- Campi: nome, fornitore, categoria (select), tipo unità (u/k), quantità confezione, prezzo confezione, quantità minima ordine, brand, note
- Validazione: nome obbligatorio, prezzo > 0, quantità > 0
- Calcolo automatico prezzo per kg/unità (read-only)
- Autocomplete per fornitore (suggerimenti da lista esistenti)
- Preview costo per 100g/1u in tempo reale
- Bottoni: Salva, Annulla, Reset
- Mostra errori validazione inline
- Supporta modalità Create/Edit

Struttura dati input:
interface IngredientFormData {
  name: string;
  supplier: string;
  category: 'Additivi' | 'Carni' | 'Farine' | 'Latticini' | 'Verdura' | 'Spezie' | 'Altro';
  unitType: 'u' | 'k';
  packageQuantity: number;
  packagePrice: number;
  minOrderQuantity?: number;
  brand?: string;
  notes?: string;
}

Props:
- initialData?: IngredientFormData
- onSubmit: (data: IngredientFormData) => Promise<void>
- onCancel: () => void
- mode: 'create' | 'edit'
- existingSuppliers: string[]

Genera il componente completo con:
1. Schema Zod per validazione
2. React Hook Form integration
3. Calcolo prezzo unitario in tempo reale
4. Autocomplete fornitore
5. Gestione loading/error states
```

---

## PROMPT 11: Componente ProductionCalendar

```
Genera un componente React TypeScript per calendario visuale di pianificazione produzione settimanale.

Requisiti:
- Nome file: ProductionCalendar.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Vista calendario 7 giorni (Lun-Dom)
- Drag & drop ricette su giorni specifici
- Ogni card ricetta mostra: nome, quantità, costo stimato
- Colori diversi per categoria ricetta
- Click su card per edit quantità inline
- Totali per giorno (quantità ricette, costo totale)
- Bottoni: Settimana Precedente, Settimana Successiva, Oggi
- Indicatore visivo giorni con produzione vs giorni vuoti
- Export calendario in formato stampabile

Struttura dati input:
interface ProductionDay {
  date: Date;
  recipes: Array<{
    id: string;
    recipeId: string;
    recipeName: string;
    category: string;
    quantity: number;
    estimatedCost: number;
  }>;
}

interface WeekProduction {
  weekStartDate: Date;
  days: ProductionDay[];
}

Props:
- weekProduction: WeekProduction
- onRecipeAdd: (day: Date, recipeId: string, quantity: number) => void
- onRecipeRemove: (day: Date, productionId: string) => void
- onQuantityChange: (productionId: string, newQuantity: number) => void
- onWeekChange: (newWeekStart: Date) => void
- availableRecipes: Array<{ id: string; name: string; category: string }>

Genera il componente completo con:
1. Drag & drop con react-dnd o nativo
2. Inline editing quantità
3. Calcoli totali dinamici
4. Navigazione settimane
5. Responsive design
```

---

## PROMPT 12: Hook useRecipeCostCalculator

```
Genera un hook React TypeScript custom per calcolare costi ricette in tempo reale con logica ricorsiva.

Requisiti:
- Nome file: useRecipeCostCalculator.ts
- Usa React 19 + TypeScript
- Calcola costo totale ricetta considerando:
  * Costo ingredienti base
  * Costo semilavorati (ricorsivo)
  * Resa produzione (yield percentage)
  * Scarti di servizio
  * Costi operativi fissi
- Supporta nesting infinito di semilavorati
- Memoizzazione per performance
- Ritorna breakdown dettagliato costi per categoria

Struttura dati input:
interface RecipeComponent {
  id: string;
  type: 'ingredient' | 'semi_finished';
  quantity: number;
  unitType: string;
  pricePerUnit?: number;
  children?: RecipeComponent[];
}

interface Recipe {
  id: string;
  components: RecipeComponent[];
  yieldPercentage: number;
  serviceWastePercentage?: number;
  fixedCosts?: number;
}

Hook signature:
function useRecipeCostCalculator(recipe: Recipe): {
  totalCost: number;
  breakdown: {
    ingredientsCost: number;
    semiFinishedCost: number;
    yieldAdjustment: number;
    wasteAdjustment: number;
    fixedCosts: number;
  };
  costPerCategory: Record<string, number>;
  isCalculating: boolean;
  recalculate: () => void;
}

Genera l'hook completo con:
1. Funzione ricorsiva per espandere semilavorati
2. Calcolo costi con resa e scarti
3. Aggregazione per categoria
4. Memoizzazione con useMemo
5. Type safety completo
```

---

## PROMPT 13: Test E2E - Flusso Lista Acquisti

```
Genera test end-to-end con Vitest + React Testing Library per il flusso completo di generazione lista acquisti.

Requisiti:
- Nome file: ShoppingListFlow.e2e.test.tsx
- Usa Vitest + React Testing Library + MSW per mock API
- Test scenario completo:
  1. Utente crea produzione settimanale
  2. Aggiunge ricette con quantità
  3. Naviga a lista acquisti
  4. Seleziona settimana
  5. Verifica ingredienti aggregati correttamente
  6. Filtra per fornitore
  7. Esporta CSV
  8. Verifica contenuto CSV

Test cases:
1. Creazione produzione e generazione lista
2. Aggregazione ingredienti da ricette multiple
3. Filtri fornitore funzionanti
4. Export CSV con dati corretti
5. Gestione settimana senza produzioni
6. Calcolo costi totali accurato
7. Gestione errori API

Genera test completi con:
1. Setup fixture dati realistici
2. Mock handlers MSW per API
3. Assertions complete su DOM e dati
4. Test user interactions
5. Verifica calcoli matematici
```

---

## PROMPT 14: Componente RecipeComparison

```
Genera un componente React TypeScript per confrontare food cost di più ricette side-by-side.

Requisiti:
- Nome file: RecipeComparison.tsx
- Usa React 19 + TypeScript + Tailwind CSS
- Seleziona fino a 4 ricette da confrontare
- Tabella comparativa con: nome, costo totale, costo per porzione, margine%, componenti principali
- Grafico a barre per confronto visuale costi
- Evidenzia ricetta più economica e più costosa
- Bottone "Ottimizza" che suggerisce sostituzioni ingredienti
- Export confronto in PDF

Struttura dati input:
interface RecipeForComparison {
  id: string;
  name: string;
  totalCost: number;
  costPerServing: number;
  marginPercentage: number;
  topComponents: Array<{
    name: string;
    cost: number;
    percentage: number;
  }>;
}

Props:
- recipes: RecipeForComparison[]
- onOptimize?: (recipeId: string) => void
- onExportPDF?: () => void

Genera il componente completo con:
1. Selezione ricette con autocomplete
2. Tabella comparativa responsive
3. Grafico barre (recharts)
4. Evidenziazione min/max
5. Export PDF
```

---

## Come Usare Questi Prompt

1. **Copia un prompt** dalla lista sopra
2. **Incolla in ChatGPT** (o GPT-4)
3. **Aspetta la risposta** - avrà il codice completo
4. **Salva il codice** in un file `.tsx` o `.ts`
5. **Inviami il file** - io lo integrerò nel progetto

---

## Ordine di Esecuzione Consigliato

**Sessione 1** (Dettagli Ricette):
1. PROMPT 9 - RecipeDetailView
2. PROMPT 12 - useRecipeCostCalculator

**Sessione 2** (Form e CRUD):
3. PROMPT 10 - IngredientForm

**Sessione 3** (Pianificazione):
4. PROMPT 11 - ProductionCalendar

**Sessione 4** (Analisi e Test):
5. PROMPT 14 - RecipeComparison
6. PROMPT 13 - Test E2E

---

## Stima Token Risparmiati

| Componente | Token Manuali | Con ChatGPT | Risparmio |
|------------|---------------|-------------|-----------|
| RecipeDetailView | ~4,000 | ~1,200 | 70% |
| IngredientForm | ~3,500 | ~1,000 | 71% |
| ProductionCalendar | ~5,000 | ~1,500 | 70% |
| useRecipeCostCalculator | ~2,500 | ~800 | 68% |
| RecipeComparison | ~3,000 | ~900 | 70% |
| Test E2E | ~2,000 | ~600 | 70% |
| **Totale** | **~20,000** | **~6,000** | **~70%** |

**Risparmio totale: ~14,000 token** (circa 70% di efficienza)

---

## Note Importanti

- **Versioni**: React 19, TypeScript 5.x, Tailwind CSS 4.x
- **Librerie UI**: shadcn/ui per componenti complessi
- **Icons**: lucide-react
- **Grafici**: recharts
- **Form**: react-hook-form + zod
- **Test**: vitest + @testing-library/react + MSW

Dopo che ChatGPT genera il codice, io lo integrerò, testerò e ottimizzerò per il tuo progetto.
