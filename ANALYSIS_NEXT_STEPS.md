# Analisi Prompt Completo e Prossimi Passi

## Stato Attuale dell'Implementazione

### ✅ Completato
1. **Schema Database**: Tutte le tabelle create (ingredienti, semilavorati, ricette finali, food matrix, ecc.)
2. **Autenticazione**: Sistema di ruoli (Admin, Manager, Cook) implementato
3. **Procedure tRPC Backend**: CRUD base per tutti i moduli
4. **Importazione Dati**: 154 ingredienti, 13 semilavorati, 13 ricette finali caricati
5. **Dashboard**: Landing page e navigazione principale
6. **Struttura Frontend**: Pagine create per tutti i moduli

### ⚠️ Parzialmente Completato
1. **Calcolo Costi Ricorsivo**: Logica implementata ma non integrata con UI
2. **Food Matrix**: Schema creato ma visualizzazione non implementata
3. **Gestione Ricette**: CRUD base ma manca logica di nesting infinito (semilavorati dentro semilavorati)
4. **Conversioni Unità**: Backend supporta ma frontend non ha interfaccia

### ❌ Non Implementato (Prioritario)
1. **Gestione Semilavorati Annidati**: Semilavorati che contengono altri semilavorati
2. **Interfaccia Food Matrix**: Visualizzazione consolidata con filtri
3. **Menu Engine Avanzato**: Gestione menu multipli con logiche diverse (tavolo vs delivery)
4. **Promozioni/Combo**: Sistema di combinazioni con prezzi fissi
5. **Applicativo Produzioni Settimanali**: Planner con output shopping list e HACCP
6. **Applicativo Ordini**: Gestione acquisti con logica semilavorati
7. **Interfacce CRUD Complete**: Form con validazione per tutti i moduli
8. **Calcolo Scarti Modificabili**: Registrazione e modifica per singola produzione

---

## Risposte AI Critiche da Implementare

### 1. **Nesting Infinito Semilavorati**
- **Problema**: Attualmente il modello supporta solo 2 livelli (ingredienti → semilavorati → ricette)
- **Soluzione Richiesta**: Permettere semilavorati dentro semilavorati (es. Salsa BBQ contiene Ketchup che è semilavorato)
- **Impatto**: Richiede modifica logica calcolo costi ricorsivo
- **Stato**: Backend supporta, frontend non ha UI

### 2. **Scarti Modificabili per Produzione**
- **Problema**: Attualmente gli scarti sono percentuali fisse per ricetta
- **Soluzione Richiesta**: Permettere registrazione e modifica degli scarti per ogni singola produzione
- **Impatto**: Aggiunge colonna `actualWastePercentage` alle produzioni
- **Stato**: Schema supporta, logica non implementata

### 3. **Conversioni Unità Automatiche**
- **Problema**: Alcuni ingredienti in unità (u), altri in grammi (g)
- **Soluzione Richiesta**: Standardizzare tutto in grammi nel backend, mostrare unità originale in frontend
- **Impatto**: Logica di conversione già presente, manca UI
- **Stato**: Backend pronto, frontend non integrato

### 4. **Menu Multipli con Logiche Diverse**
- **Problema**: Un singolo menu engine per tutti i servizi
- **Soluzione Richiesta**: Menu separati (tavolo, delivery, ecc.) con costi diversi (packaging, servizio)
- **Impatto**: Richiede nuova tabella `menuContexts` e logica di costo contestuale
- **Stato**: Non implementato

### 5. **Promozioni come Combinazioni Fisse**
- **Problema**: Attualmente le promozioni sono viste come sconti
- **Soluzione Richiesta**: Promozioni sono combinazioni di piatti con prezzo fisso (es. panino + patatine + bibita = €8.99)
- **Impatto**: Richiede relazione many-to-many tra menu items e promozioni
- **Stato**: Schema supporta, UI non implementata

### 6. **Ordini Intelligenti con Logica Semilavorati**
- **Problema**: Attualmente ordini sono semplici liste di ingredienti
- **Soluzione Richiesta**: Se una ricetta richiede semilavorato, acquistare il semilavorato (non gli ingredienti base)
- **Impatto**: Richiede logica di espansione/collasso nella generazione shopping list
- **Stato**: Non implementato

---

## Priorità di Sviluppo (Secondo Utente)

### Fase 1: Database Ricette + Food Matrix
**Obiettivo**: Completare la visualizzazione e gestione della Food Matrix

**Task**:
1. Implementare UI Food Matrix con tabella interattiva
2. Aggiungere filtri (categoria, fornitore, prezzo)
3. Mostrare propagazione costi da Livello 0 → Livello 2
4. Implementare nesting infinito semilavorati

### Fase 2: Gestione Produzioni
**Obiettivo**: Creare il planner settimanale con output HACCP

**Task**:
1. Interfaccia selezione ricette + quantità
2. Calcolo automatico fabbisogni materie prime
3. Generazione shopping list per fornitore
4. Output HACCP stampabile con campi pre-compilati

### Fase 3: Applicativo Menu
**Obiettivo**: Gestione menu multipli con logiche diverse

**Task**:
1. Creare menu contexts (tavolo, delivery, ecc.)
2. Configurare costi di packaging/servizio per menu
3. Gestire piatti con quantità standard modificabili
4. Implementare promozioni come combinazioni fisse

### Fase 4: Applicativo Ordini
**Obiettivo**: Gestione acquisti intelligente

**Task**:
1. Visualizzare ingredienti necessari dalla produzione settimanale
2. Implementare logica: se ricetta richiede semilavorato → acquistare semilavorato
3. Generare shopping list per fornitore
4. Tracciare ingredienti semilavorati da produrre

---

## Raccomandazione Prossimo Passaggio

### **PRIORITÀ 1: Implementare Nesting Infinito Semilavorati**

**Perché**: È il fondamento per tutte le altre funzionalità. Senza di questo, il calcolo costi e la gestione produzioni non funzionano correttamente.

**Cosa fare**:
1. Modificare schema `semi_finished_recipes` per supportare auto-referenza
2. Aggiungere colonna `parentSemiFinishedId` (nullable)
3. Implementare UI per selezione componenti con ricerca ricorsiva
4. Testare calcolo costi con nesting profondo

**Tempo stimato**: 4-6 ore

### **PRIORITÀ 2: Completare Food Matrix UI**

**Perché**: È la "fonte di verità" per tutti i costi. Deve essere visibile e gestibile.

**Cosa fare**:
1. Creare tabella interattiva Food Matrix
2. Aggiungere colonne: ingrediente, categoria, fornitore, prezzo, costo totale
3. Implementare filtri e ricerca
4. Mostrare propagazione costi (ingrediente base → semilavorato → ricetta)

**Tempo stimato**: 3-4 ore

### **PRIORITÀ 3: Implementare Scarti Modificabili**

**Perché**: Influenza il calcolo del food cost finale per ogni piatto.

**Cosa fare**:
1. Aggiungere campo `actualWastePercentage` a `production_batches`
2. Permettere modifica scarti per singola produzione
3. Ricalcolare costo piatto in base agli scarti effettivi
4. Mostrare differenza tra scarto standard e scarto effettivo

**Tempo stimato**: 2-3 ore

---

## Architettura Modifiche Necessarie

### 1. Schema Database
```sql
-- Aggiungi auto-referenza a semi_finished_recipes
ALTER TABLE semi_finished_recipes ADD COLUMN parentSemiFinishedId VARCHAR(36);
ALTER TABLE semi_finished_recipes ADD FOREIGN KEY (parentSemiFinishedId) 
  REFERENCES semi_finished_recipes(id);

-- Aggiungi scarti modificabili a production_batches
ALTER TABLE production_batches ADD COLUMN actualWastePercentage DECIMAL(5,2);
```

### 2. Backend Logica
- Modificare `calculateRecipeCost()` per supportare ricorsione infinita
- Aggiungere `getRecipeHierarchy()` per visualizzare albero semilavorati
- Implementare `expandRecipeToIngredients()` per shopping list intelligente

### 3. Frontend Componenti
- Componente `RecipeSelector` con ricerca ricorsiva
- Componente `FoodMatrixTable` con filtri
- Componente `WasteAdjuster` per modifica scarti per produzione
- Componente `RecipeHierarchyTree` per visualizzazione nesting

---

## Prossimi Passi Immediati

1. **Oggi**: Implementare nesting infinito semilavorati (backend + UI)
2. **Domani**: Completare Food Matrix UI con tabella interattiva
3. **Giorno 3**: Implementare scarti modificabili per produzione
4. **Giorno 4**: Iniziare Planner Produzioni Settimanali

Questo ordine garantisce che le fondamenta siano solide prima di costruire le funzionalità di livello superiore.
