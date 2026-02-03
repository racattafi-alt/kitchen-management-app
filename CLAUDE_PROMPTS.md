# Prompt Claude - Specifiche Tecniche Dettagliate

Usa questi prompt con Claude (su claude.ai) per generare specifiche tecniche precise. Claude è migliore di ChatGPT per analisi e pianificazione.

---

## PROMPT 1: Specifiche Tecniche - Nesting Infinito Semilavorati

```
Sei un architect software specializzato in sistemi di gestione ricette per ristorazione.

Devo implementare il supporto per nesting infinito di semilavorati in un'applicazione di gestione cucina.

CONTESTO:
- Stack: React 19, TypeScript, Express, Drizzle ORM, MySQL
- Attualmente: 3 livelli (ingredienti → semilavorati → ricette finali)
- Richiesta: Permettere semilavorati dentro semilavorati (es. Salsa BBQ contiene Ketchup che è semilavorato)

PROBLEMI DA RISOLVERE:
1. Calcolo costi ricorsivo: Come propagare i costi da Livello 0 a Livello N?
2. Prevenire cicli: Come evitare che un semilavorato contenga se stesso (direttamente o indirettamente)?
3. Visualizzazione: Come mostrare gerarchie profonde senza confondere l'utente?
4. Performance: Come gestire query efficienti con nesting profondo?
5. Validazione: Come validare l'integrità della gerarchia?

FORNISCI:
1. Diagramma ER modificato per supportare nesting infinito
2. Algoritmo di calcolo costi ricorsivo con pseudocode
3. Algoritmo di rilevamento cicli
4. Query SQL ottimizzate (con CTE ricorsive)
5. Strutture dati TypeScript per rappresentare la gerarchia
6. Strategie di caching per performance
7. Casi d'uso edge case e come gestirli

FORMATO: Markdown con sezioni chiare, pseudocode, diagrammi ASCII se necessario.
```

---

## PROMPT 2: Specifiche Tecniche - Food Matrix Consolidata

```
Sei un architect software specializzato in sistemi di gestione costi per ristorazione.

Devo implementare una "Food Matrix" consolidata che mostra il costo finale di ogni ingrediente in ogni ricetta.

CONTESTO:
- Attualmente: 154 ingredienti, 13 semilavorati, 13 ricette finali
- Dati importati da Excel con prezzi e fornitori
- Necessario: Vista consolidata di tutti i costi per ogni piatto

REQUISITI:
1. Mostrare ogni ingrediente che entra in ogni ricetta (direttamente o tramite semilavorati)
2. Propagare costi da ingrediente base → semilavorato → ricetta finale
3. Includere costi operativi (energia, manodopera)
4. Includere scarti di produzione e servizio
5. Permettere filtri: per ricetta, per ingrediente, per fornitore, per categoria
6. Mostrare marginalità: prezzo vendita - costo totale

FORNISCI:
1. Definizione precisa di "Food Matrix" (cosa deve contenere)
2. Algoritmo di costruzione della Food Matrix
3. Schema database ottimizzato (tabelle, indici)
4. Query SQL per popolare Food Matrix
5. Strategie di aggiornamento incrementale (quando cambia un prezzo)
6. Calcoli di marginalità e KPI
7. Casi d'uso di filtri e ricerca

FORMATO: Markdown con esempi concreti, SQL, diagrammi.
```

---

## PROMPT 3: Specifiche Tecniche - Menu Multipli con Logiche Diverse

```
Sei un architect software specializzato in sistemi di gestione menu per ristorazione.

Devo implementare supporto per menu multipli con logiche di costo diverse (tavolo vs delivery vs asporto).

CONTESTO:
- Menu al tavolo: include costi di servizio, packaging, manodopera
- Menu delivery: include costi di packaging robusto, consegna
- Menu asporto: include costi di packaging standard
- Ogni menu può avere piatti diversi con prezzi diversi
- Promozioni: combinazioni di piatti con prezzo fisso

REQUISITI:
1. Separare logiche di costo per menu type
2. Permettere stessi piatti in menu diversi con prezzi diversi
3. Gestire costi fissi per menu (packaging, servizio)
4. Gestire promozioni come combinazioni di piatti
5. Calcolare food cost per piatto in ogni menu
6. Permettere modifiche rapide di prezzi

FORNISCI:
1. Modello di dati per menu multipli
2. Schema database (tabelle, relazioni)
3. Algoritmo di calcolo costo piatto per menu
4. Algoritmo di calcolo costo promozione
5. Logica di validazione prezzi
6. Strategie di caching per performance
7. API/procedure tRPC necessarie

FORMATO: Markdown con diagrammi ER, pseudocode, esempi.
```

---

## PROMPT 4: Specifiche Tecniche - Ordini Intelligenti con Semilavorati

```
Sei un architect software specializzato in sistemi di gestione ordini per ristorazione.

Devo implementare un sistema di ordini che capisce quando acquistare ingredienti base vs semilavorati.

CONTESTO:
- Se ricetta richiede "Salsa BBQ" (semilavorato), acquistare il semilavorato finito
- Se ricetta richiede "Spezie Bacon" (semilavorato), ma non è in produzione, acquistare gli ingredienti base
- Alcuni semilavorati sono "obbligatori" (es. mix spezie), altri "opzionali"

REQUISITI:
1. Dato un piano di produzione settimanale, calcolare ingredienti necessari
2. Espandere ricette a ingredienti, ma "collassare" semilavorati se disponibili
3. Aggregare per fornitore
4. Calcolare quantità totale per ingrediente
5. Considerare rese e scarti
6. Generare shopping list per fornitore
7. Tracciare semilavorati da produrre

FORNISCI:
1. Algoritmo di espansione/collasso ricette
2. Logica di decisione: acquistare ingrediente o semilavorato?
3. Algoritmo di aggregazione per fornitore
4. Gestione unità di misura (kg, grammi, unità)
5. Calcolo rese e scarti
6. Schema database per tracciare semilavorati
7. Casi d'uso edge case

FORMATO: Markdown con pseudocode, diagrammi di flusso, esempi.
```

---

## PROMPT 5: Specifiche Tecniche - Scarti Modificabili per Produzione

```
Sei un architect software specializzato in sistemi di tracciamento qualità per ristorazione.

Devo implementare un sistema di scarti modificabili per ogni singola produzione.

CONTESTO:
- Attualmente: scarti sono percentuali fisse per ricetta
- Richiesta: permettere modificare scarti per ogni produzione (es. Lunedì scarto 5%, Martedì 3%)
- Impatto: cambia il costo finale del piatto

REQUISITI:
1. Registrare scarto standard per ricetta/ingrediente
2. Permettere modificare scarto effettivo per singola produzione
3. Calcolare impatto su costo piatto
4. Tracciare differenza tra scarto standard e effettivo
5. Generare report su scarti per analisi
6. Permettere analisi trend scarti nel tempo

FORNISCI:
1. Schema database per tracciare scarti
2. Algoritmo di calcolo impatto scarto su costo
3. Logica di validazione scarti (0-100%)
4. Query per analisi trend scarti
5. Calcolo KPI: scarto medio, varianza, outlier
6. Integrazione con calcolo costi
7. Report e dashboard per scarti

FORMATO: Markdown con SQL, pseudocode, esempi di calcoli.
```

---

## PROMPT 6: Specifiche Tecniche - Conversioni Unità Automatiche

```
Sei un architect software specializzato in sistemi di gestione unità di misura.

Devo implementare un sistema di conversioni automatiche tra unità diverse (kg, grammi, unità).

CONTESTO:
- Alcuni ingredienti venduti in kg (es. farina)
- Alcuni venduti in unità (es. uova)
- Alcuni venduti in grammi (es. spezie)
- Ricette usano unità diverse
- Backend deve standardizzare tutto in grammi per calcoli

REQUISITI:
1. Definire tabella di conversioni
2. Permettere conversioni bidirezionali
3. Gestire ingredienti che non si convertono (es. uova)
4. Validare conversioni (es. non puoi convertire uova in kg)
5. Mostrare unità originale in frontend
6. Standardizzare in grammi nel backend

FORNISCI:
1. Schema database per unità e conversioni
2. Algoritmo di conversione con validazione
3. Tabella di conversioni per ingredienti comuni
4. Logica di gestione ingredienti non convertibili
5. Integrazione con calcoli costi
6. Gestione edge case (es. ingredienti con densità variabile)
7. API per conversioni

FORMATO: Markdown con tabelle, pseudocode, esempi.
```

---

## Come Usare Questi Prompt

1. **Vai su claude.ai**
2. **Copia un prompt** dalla lista sopra
3. **Incolla in una nuova conversazione**
4. **Aspetta la risposta** - Claude darà specifiche dettagliate
5. **Salva la risposta** in un documento
6. **Usa come riferimento** durante lo sviluppo

---

## Ordine di Esecuzione Consigliato

**Sessione 1 (Claude - Fondamenta)**:
1. PROMPT 1 - Nesting Infinito Semilavorati
2. PROMPT 2 - Food Matrix Consolidata

**Sessione 2 (Claude - Logiche Avanzate)**:
3. PROMPT 3 - Menu Multipli
4. PROMPT 4 - Ordini Intelligenti

**Sessione 3 (Claude - Dettagli)**:
5. PROMPT 5 - Scarti Modificabili
6. PROMPT 6 - Conversioni Unità

---

## Cosa Aspettarsi da Claude

Claude fornirà:
- ✅ Diagrammi ER e architetture
- ✅ Pseudocode e algoritmi
- ✅ SQL ottimizzato
- ✅ Strutture dati TypeScript
- ✅ Casi d'uso edge case
- ✅ Best practices
- ✅ Considerazioni di performance

---

## Prossimo Passo

1. **Apri claude.ai**
2. **Copia PROMPT 1** (Nesting Infinito)
3. **Incolla e aspetta la risposta**
4. **Salva la risposta** in un documento
5. **Condividi con me** per implementazione

Pronto? Inizia con Claude!
