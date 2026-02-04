# Kitchen Management System - TODO

## Fase 1: Pianificazione e Setup
- [x] Definire architettura database completa
- [x] Pianificare struttura moduli e routing
- [x] Configurare ambiente di sviluppo

## Fase 2: Database e Query Helper
- [x] Schema Ingredienti (Livello 0)
- [x] Schema Semilavorati (Livello 1-N)
- [x] Schema Ricette Finali (Livello 2)
- [x] Schema Food Matrix
- [x] Schema Operazioni e Costi
- [x] Schema Produzioni Settimanali
- [x] Schema Menu e Piatti
- [x] Schema Scarti (Waste Management)
- [x] Schema HACCP e Lotti
- [x] Query helper per tutte le entità

## Fase 3: Backend - Procedure tRPC
- [x] Procedure CRUD Ingredienti
- [x] Procedure CRUD Semilavorati
- [x] Procedure CRUD Ricette Finali
- [x] Algoritmo calcolo costi ricorsivo
- [x] Procedure Food Matrix
- [x] Procedure Planner Produzione
- [x] Algoritmo aggregazione fabbisogni
- [x] Procedure Menu Engine
- [x] Procedure Waste Management
- [x] Procedure HACCP
- [x] Autenticazione e controllo ruoli (Admin/Manager/Cook)

## Fase 4: Frontend - Dashboard e CRUD
- [x] Dashboard principale con statistiche
- [x] Modulo Gestione Ingredienti
- [x] Modulo Gestione Semilavorati con wizard
- [x] Modulo Gestione Ricette Finali
- [x] Visualizzazione ad albero ricette
- [x] Componenti UI per CRUD operazioni

## Fase 5: Food Matrix e Planner
- [x] Implementazione Food Matrix unificata
- [x] Filtri e ricerca Food Matrix
- [x] Planner Produzione Settimanale
- [x] Generazione Shopping List
- [x] Menu Engine e calcolo food cost piatti

## Fase 6: Waste Management e HACCP
- [x] Modulo Waste Management
- [x] Tracciamento scarti produzione e servizio
- [x] Generazione schede HACCP automatica
- [x] Modulo gestione lotti di produzione

## Fase 7: Assistente Conversazionale e Cloud Storage
- [x] Integrazione LLM per assistente conversazionale
- [x] Suggerimenti ottimizzazione ricette
- [x] Proposte sostituzioni ingredienti
- [x] Risposte domande struttura ricette
- [x] Integrazione S3 per archiviazione cloud
- [x] Upload HACCP, certificati, foto lotti

## Fase 8: Testing e Ottimizzazioni
- [x] Unit test procedure tRPC
- [x] Test integrazione database
- [x] Test calcolo costi ricorsivo
- [x] Test autenticazione e ruoli
- [x] Ottimizzazioni performance
- [x] Consegna finale

## Note Importanti
- Trasparenza logica: tutte le formule visibili nell'UI
- Nesting infinito per ricette gerarchiche
- Propagazione automatica prezzi da Livello 0 a Livello 2
- Distinzione scarti produzione vs scarti servizio
- Conformità HACCP e tracciabilità completa

## Importazione Dati da Excel
- [x] Analizzare struttura file MENUUNION2026.xlsx
- [x] Creare script di importazione dati
- [x] Caricare ingredienti nel database
- [x] Caricare ricette nel database
- [x] Verificare dati importati correttamente

## Priorità Immediate (Token Limitati)
- [ ] Completare importazione ricette mancanti dal wireframe
- [x] Implementare visualizzazione database ricette (semilavorati + finali)
- [x] Implementare lista acquisti funzionante con logica semilavorati
- [x] Testare funzionalità prioritarie

## Implementazione Backend Lista Acquisti
- [x] Aggiunta procedura listWeekly al productionRouter
- [x] Aggiunta procedura generateShoppingList con logica aggregazione
- [x] Collegamento route ShoppingList in App.tsx
- [x] Test procedure backend

## Prossimi Task per ChatGPT
- [ ] Componente RecipeDetailView per visualizzare dettagli completi ricetta
- [ ] Componente IngredientForm per CRUD ingredienti
- [ ] Componente ProductionCalendar per pianificazione visuale
- [ ] Hook useRecipeCostCalculator per calcoli in tempo reale
- [ ] Test E2E per flusso completo lista acquisti

## Importazione Ricette Finali da Excel
- [x] Analizzare foglio REC_FINALE del file MENUUNION2026.xlsx
- [x] Aggiornare script import_data.py per importare ricette finali
- [x] Eseguire importazione ricette finali
- [x] Verificare dati importati nel database (32 ricette totali)

## Implementazione Pagina Ingredienti
- [x] Verificare ingredienti duplicati nel database (154 duplicati trovati)
- [x] Rimuovere duplicati mantenendo solo record più recenti (154 rimossi)
- [x] Implementare tabella ingredienti con tutti i campi
- [x] Aggiungere filtro per categoria
- [x] Aggiungere ricerca per nome
- [x] Testare funzionalità

## Ordinamento Pagina Ingredienti
- [x] Aggiungere ordinamento per nome (A-Z, Z-A)
- [x] Aggiungere ordinamento per categoria
- [x] Aggiungere ordinamento per fornitore
- [x] Implementare UI per selezione ordinamento

## Correzione Lista Acquisti Backend
- [x] Collegare aggregateProductionRequirements a generateShoppingList
- [x] Implementare espansione ricorsiva semilavorati nella lista acquisti
- [x] Supportare aggregazione multi-ricetta per settimana
- [x] Applicare percentuali di scarto nei calcoli
- [x] Testare con dati reali (ricette con semilavorati nested) - 3 test passati

## Pagina Ricette e Pianificazione
- [x] Verificare collegamento frontend-backend per pianificazione produzioni
- [x] Correggere procedure tRPC mancanti o non allineate
- [x] Implementare pagina Ricette con schede individuali dettagliate
- [x] Implementare dialog per creare nuova produzione
- [x] Testare flusso completo: crea produzione → genera lista acquisti - 3 test passati

## Shopping List - Accessibilità
- [x] Aggiungere link Shopping List al menu di navigazione
- [x] Verificare che la pagina sia accessibile dal menu

## Correzioni Critiche Lista Acquisti
- [x] Verificare completezza componenti ricette nel database (21/32 ricette con componenti)
- [x] Correggere aggregazione lista acquisti (unire tutte le settimane uguali)
- [ ] Verificare calcolo ricorsivo quantità ingredienti
- [ ] Testare con dati reali e confrontare con Excel

## Correzioni Lista Acquisti e Gestione Produzioni
- [x] Diagnosticare perché lista acquisti non mostra ingredienti (tabella vuota)
- [x] Correggere backend/frontend per visualizzare lista acquisti
- [x] Aggiungere pulsanti modifica/elimina per ogni produzione
- [x] Implementare procedura backend per eliminare produzione
- [ ] Implementare procedura backend per modificare produzione
- [x] Sostituire dialog con form inline nella pagina Produzioni
- [x] Implementare autocomplete predittivo per selezione ricette
- [ ] Testare flusso completo: crea → modifica → elimina produzione

## Correzioni Urgenti Lista Acquisti e UX
- [x] Diagnosticare perché lista acquisti non mostra ingredienti (logica backend)
- [x] Verificare che generateShoppingList riceva correttamente le produzioni
- [x] Aggiungere logging per debug
- [x] Testare aggregazione ingredienti con dati reali - PROBLEMA: ricette senza componenti
- [x] Mostrare nomi ricette leggibili invece di codici nella tabella produzioni
- [x] Implementare join con final_recipes per recuperare nomi
- [x] Semplificare form settimana: solo data lunedì (non range)
- [x] Testare flusso completo con dati reali - PROBLEMA: ricette senza componenti

## Problema Critico Identificato
- [ ] Reimportare ricette con componenti corretti dal file Excel
- [ ] Verificare che tutte le 32 ricette abbiano componenti popolati
- [ ] Testare lista acquisti con ricette complete

## Correzioni Urgenti Lista Acquisti
- [x] Reimportare componenti ricette dal file Excel (REC_FINALE)
- [x] Verificare che tutte le ricette abbiano componenti popolati (21/32 con componenti)
- [x] Correggere aggregazione automatica per settimana (raggruppare produzioni stessa settimana)
- [x] Testare lista acquisti con produzioni multiple nella stessa settimana - Test passati 3/3

## DEBUG LISTA ACQUISTI VUOTA
- [x] Verificare se ci sono produzioni nel database
- [x] Verificare se le produzioni hanno recipeFinalId valido
- [x] Verificare se le ricette hanno componenti popolati
- [x] Testare manualmente la procedura generateShoppingList
- [x] Correggere logica backend se necessario
- [x] Verificare risultati con dati reali

## CORREZIONI FINALI LISTA ACQUISTI
- [x] Identificato problema: ricette senza componenti + mapping errato campi
- [x] Corretto mapping componentId nel backend (era ingredientId/semiFinishedId)
- [x] Creato script import_final_recipes_improved.py con matching case-insensitive
- [x] Reimportati componenti per 22 ricette (inclusa CARNE_PULLED_PORK)
- [x] Corretto bug yieldPercentage (rimossa divisione per 100)
- [x] Verificato calcolo corretto: 600 kg Pulled Pork = 19.800 kg Spalla di Maiale ✓
- [x] Lista acquisti funzionante con aggregazione corretta e costi precisi

## CORREZIONE RESA RICETTE
- [x] Analizzare dati Excel per capire la resa corretta di CARNE_PULLED_PORK
- [x] Verificare se la quantità nel file Excel è per 1 kg o per un batch specifico
- [x] Identificare l'errore nel calcolo della resa
- [x] Correggere la logica di calcolo nel backend
- [x] Testare con dati reali e verificare risultati
- [x] Creato script normalize_recipe_quantities.py per normalizzare quantità
- [x] Normalizzate 21 ricette su 22 (batch size da foglio PREZZO_FINALE)
- [x] Verificato calcolo corretto: 600 kg Pulled Pork = 734 kg Spalla (non 19.800 kg)
- [x] Test passati 4/4

## CORREZIONI CONVERSIONE UNITÀ E SEMILAVORATI
- [x] Verificare peso unitario per CARNE_TENDERS (50,97g per tender)
- [x] Implementare conversione corretta kg/unità nelle produzioni
- [x] Verificare che i semilavorati (spezie) abbiano componenti popolati
- [x] Implementare espansione ricorsiva completa dei semilavorati nella lista acquisti
- [x] Implementare arrotondamento per ingredienti unitari (uova, ecc.)
- [x] Testare con produzioni unitarie e verificare risultati
- [x] Aggiunto campo unitType e unitWeight allo schema final_recipes
- [x] Popolato unitWeight per CARNE_TENDERS (50,97g) e CARNE_SOVRACOSCE (63,97g)
- [x] Aggiornata struttura 10 semilavorati da ingredientId a componentId
- [x] Implementato arrotondamento Math.ceil() per ingredienti unitari
- [x] Verificato espansione spezie: Pepe, Sale, Coriandolo, Cumino, Paprica, ecc.

## CORREZIONE LOGICA SEMILAVORATI NELLA LISTA ACQUISTI
- [x] Rimuovere espansione ricorsiva semilavorati in aggregateProductionRequirements
- [x] Mostrare semilavorati come item da acquistare (non espansi)
- [x] Calcolare quantità e costo dei semilavorati necessari
- [x] Aggiunto campo productionType e semiFinishedId allo schema weekly_productions
- [x] Aggiornato backend per gestire produzioni di semilavorati
- [x] Aggiornato frontend per mostrare colonna "Tipo" (Ingrediente/Semilavorato)
- [x] Testato: lista acquisti per ricette finali mostra semilavorati (Spezie Pulled, Spezie tenders)
- [ ] TODO futuro: Aggiungere UI per pianificare produzioni di semilavorati

## CORREZIONE FILTRO SETTIMANE LISTA ACQUISTI
- [x] Verificare perché il filtro settimane non funziona (mostra ingredienti solo con "Tutte le Settimane")
- [x] Correggere il calcolo della data del lunedì della settimana (deve essere "02 feb" non "03 feb")
- [x] Testare il filtro con settimane specifiche
- [x] Implementato getMondayOfWeek con UTC per evitare problemi timezone
- [x] Corretto filtro backend per confrontare date UTC
- [x] Verificato: filtro "02 feb" mostra correttamente ingredienti per quella settimana

## IMPLEMENTAZIONE SCHEDE RICETTA
- [x] Leggere requisiti da kitchen-management.md
- [x] Creare pagina Ricette con:
  - [x] Barra ricerca filtrante in alto
  - [x] Lista completa ordinata di banner ricette per categoria
  - [x] Click banner → apertura scheda dettaglio (modal)
- [x] Implementare scheda ricetta dettaglio con:
  - [x] Nome ricetta e codice
  - [x] Lista ingredienti con proporzioni e quantità base
  - [x] Moltiplicatore standard (sempre visualizzato con input)
  - [x] Tabs: Ingredienti, Procedura, Info
  - [x] Pulsanti: Modifica, Stampa
  - [ ] Placeholder per diagramma di flusso (da aggiungere dopo file utente)
- [ ] BUG: Correggere nomi ingredienti che mostrano "Sconosciuto"
- [ ] Implementare funzionalità Crea Ricetta/Semilavorato
- [ ] Implementare funzionalità Modifica Ricetta
- [ ] Implementare tab Procedura con testo procedimento
- [ ] Implementare funzionalità Testa Modifiche (simulazione impatto prezzi su piatti)
- [ ] Implementare funzionalità Stampa Ricetta con quantità e procedura

## RIDISEGNO LISTA ACQUISTI - TUTTI GLI ARTICOLI ORDINABILI
- [x] Modificare backend generateShoppingList per caricare TUTTI gli articoli (ingredienti + semilavorati)
- [x] Aggiungere campo "quantityNeeded" (calcolata dalle produzioni) per ogni articolo
- [x] Aggiungere campo "quantityToOrder" (editabile, valore iniziale 0) per ogni articolo
- [x] Modificare frontend per mostrare tabella con colonne:
  - [x] Nome articolo
  - [x] Tipo (Ingrediente/Semilavorato)
  - [x] Fornitore
  - [x] Quantità necessaria (read-only, evidenziata in giallo se > 0)
  - [x] Quantità da ordinare (input editabile, iniziale 0)
  - [x] Unità (kg/Unità)
  - [x] Prezzo unitario
  - [x] Costo totale ordine
- [x] Implementare statistiche: Articoli Totali, Articoli Necessari, Articoli da Ordinare, Costo Totale
- [x] Implementare funzione Esporta Ordini (CSV)
- [x] Testare con settimane diverse e verificare calcoli corretti
- [x] Test passati 24/24
- [ ] TODO futuro: Salvare quantità da ordinare nel backend (attualmente solo localStorage)

## CONFEZIONE MINIMA ORDINABILE E FIX MODIFICA INGREDIENTI
- [x] Correggere problema modifica ingredienti (pulsante Pencil non aveva onClick)
- [x] Aggiunto stato editingIngredient e isEditOpen
- [x] Aggiunto mutation updateMutation per salvare modifiche
- [x] Aggiunto handler handleEdit per popolare form modifica
- [x] Aggiunto dialog modifica ingrediente con form completo
- [x] Testato: dialog si apre correttamente con dati ingrediente
- [x] Verificato che esiste campo minOrderQuantity nello schema ingredienti
- [ ] TODO: Verificare se minOrderQuantity è popolato nel database
- [ ] TODO: Importare dati confezione minima dal file Excel se mancanti
- [ ] TODO: Modificare lista acquisti per arrotondare quantità ordine a multipli confezione
- [ ] TODO: Mostrare confezione minima nella colonna della tabella lista acquisti
- [ ] TODO: Testare calcolo arrotondamento con esempi reali

## DATABASE FORNITORI E CORREZIONE BUG MODIFICA FORNITORE
- [x] Creare tabella suppliers nello schema database con campi: id, name, contact, email, phone, address, notes
- [x] Eseguire db:push per applicare schema al database
- [x] Implementare backend CRUD fornitori (create, list, update, delete)
- [x] Aggiungere suppliersRouter all'appRouter
- [x] Creare procedura migrateFromIngredients per migrare fornitori esistenti
- [ ] TODO: Aggiornare schema ingredienti: sostituire campo supplier (text) con supplierId (foreign key)
- [ ] TODO: Aggiornare schema semi_finished_recipes con supplierId
- [ ] TODO: Creare pagina Fornitori con tabella e CRUD UI completo
- [ ] TODO: Aggiungere link Fornitori al menu di navigazione
- [ ] TODO: Aggiornare dialog modifica ingrediente: select obbligatorio fornitori invece di input libero
- [ ] TODO: Aggiornare dialog creazione ingrediente con select fornitori
- [ ] TODO: Eseguire migrazione fornitori da ingredienti
- [ ] TODO: Testare flusso completo: crea fornitore → assegna a ingrediente → modifica fornitore

## MIGRAZIONE DATABASE FORNITORI (COMPLETATA)
- [x] Creare tabella suppliers con schema completo
- [x] Implementare backend CRUD per fornitori (create/list/update/delete)
- [x] Creare procedura migrazione da ingredienti (13 fornitori estratti)
- [x] Aggiornare schema ingredients: cambiato supplier (text) → supplierId (foreign key nullable)
- [x] Creare script migrazione per popolare supplierId in ingredients (154 ingredienti migrati)
- [x] Aggiornare tutto il codice backend che usa ingredient.supplier per usare supplierId + join
- [x] Aggiornare Ingredients.tsx: campo supplier da text input a required Select dropdown
- [x] Creare pagina Fornitori UI per gestione CRUD
- [x] Testare modifica ingrediente con selezione fornitore
- [ ] Popolare campo minOrderQuantity da Excel
- [ ] Implementare arrotondamento automatico nella lista acquisti

## FUNZIONALITÀ ORDINE PER FORNITORE (COMPLETATA)
- [x] Creare backend per generare PDF ordini raggruppati per fornitore
- [x] Implementare pulsante "Ordine per Fornitore" nella pagina Lista Acquisti
- [x] Generare PDF con riassunto completo ordini per fornitore
- [x] Implementare invio ordine via WhatsApp al numero +393274750599
- [x] Testare generazione PDF e invio WhatsApp

## REVISIONE UNITÀ DI MISURA INGREDIENTI (COMPLETATA)
- [x] Analizzare tutti gli ingredienti per identificare unità errate
- [x] Correggere farine e prodotti in polvere (da unitari a kg)
- [x] Verificare e correggere liquidi (kg/litri)
- [x] Verificare prodotti confezionati (unitari vs peso)
- [x] Aggiornare minOrderQuantity basato su confezioni standard
- [x] Testare correzioni e verificare impatto su ricette

## STORICO ORDINI E MIGLIORAMENTI (COMPLETATO)
- [x] Aggiornare schema database: aggiungere tabella orders e orderItems
- [x] Aggiungere campo packageSize agli ingredienti (separato da minOrderQuantity)
- [x] Implementare backend per salvare ordini nello storico
- [x] Aggiungere 10 righe vuote in fondo al PDF per articoli extra
- [x] Implementare auto-arrotondamento quantità in lista acquisti
- [x] Creare UI per visualizzare storico ordini
- [x] Testare tutte le funzionalità

## CORREZIONE ERRORE MODIFICA INGREDIENTI
- [ ] Riprodurre e identificare errore modifica ingredienti
- [ ] Correggere procedura update ingredienti per includere packageSize
- [ ] Verificare tutti i percorsi database dopo modifiche schema
- [ ] Testare modifica ingredienti con tutti i campi

## CORREZIONE ORDINA PER FORNITORE (COMPLETATA)
- [x] Riprodurre errore "Ordina per fornitore" non funziona
- [x] Diagnosticare problema nel backend o frontend
- [x] Verificare che funzionalità funziona correttamente
- [x] Verificare che 10 caselle vuote siano presenti nel PDF
- [x] Testare generazione PDF e invio WhatsApp

## ARTICOLI EXTRA NELL'APP LISTA ACQUISTI (COMPLETATA)
- [x] Aggiungere sezione "Articoli Extra" con 10 campi input nell'app Lista Acquisti
- [x] Ogni campo deve avere: nome articolo, fornitore, quantità, unità, prezzo
- [x] Includere articoli extra nel PDF generato
- [x] Includere articoli extra nel messaggio WhatsApp
- [x] Salvare articoli extra in localStorage per persistenza
- [x] Testare generazione PDF e WhatsApp con articoli extra

## VERIFICA E CORREZIONE FRONTEND RICETTE (IN CORSO)
- [x] Verificare stato attuale pagina Ricette Finali
- [x] Controllare che tutte le funzionalità backend siano visibili
- [x] Implementare dialog dettagli ricetta con componenti, costi, operazioni
- [ ] Correggere visualizzazione nomi componenti (attualmente mostrano ID)
- [ ] Verificare struttura JSON componenti nel database
- [ ] Testare tutte le funzionalità ricette nel browser

## CORREZIONE COMPLETA VISUALIZZAZIONE RICETTE (IN CORSO)
- [ ] Correggere categorie ricette (attualmente tutte mostrano categoria sbagliata)
- [x] Analizzare struttura JSON componenti nel database
- [x] Creare JSON corretto con ChatGPT (22 ricette, 219 componenti)
- [x] Importare dati JSON nel database (22 ricette aggiornate)
- [x] Aggiornare query backend getDetails per gestire nuova struttura
- [ ] DEBUG: Verificare perché componentsWithDetails è vuoto nel frontend
- [ ] Mostrare nomi ingredienti corretti invece di "Sconosciuto"
- [ ] Mostrare quantità leggibili (es. "10 kg" invece di ID)
- [ ] Correggere tipo componente (ingrediente/semilavorato/operazione)
- [ ] Mostrare prezzi unitari per ogni componente
- [ ] Aggiungere tooltip spiegazione resa produzione
- [ ] Implementare dialog modifica ricetta
- [ ] Testare tutte le correzioni nel browser

## CORREZIONE VISUALIZZAZIONE RICETTE (IN CORSO)
- [x] Debug parsing JSON componenti (risolto con JSON.parse manuale)
- [x] Correggere categorie ricette (Carne, Pane, Salse, Verdure)
- [x] Mostrare nomi ingredienti corretti (Tenders, Latte UHT, Farina)
- [x] Mostrare quantità leggibili (10 kg, 1.5 kg, 6 unità)
- [x] Mostrare tipo componente corretto (badge Ingrediente/Semilavorato)
- [ ] Aggiungere prezzi unitari nella tabella componenti
- [ ] Implementare dialog modifica ricetta completo con:
  * Campo categoria modificabile
  * Campo resa modificabile con tooltip spiegazione
  * Barra ricerca ingredienti/semilavorati per aggiungere componenti
  * Campi quantità modificabili
  * Campo scarto modificabile con tooltip spiegazione
- [ ] Testare tutte le correzioni nel browser

## DIALOG MODIFICA RICETTA (COMPLETATO)
- [x] Implementare backend procedure update ricetta (categoria, resa, scarto)
- [x] Creare dialog modifica con form completo
- [x] Campo categoria con select dropdown (Carne, Pane, Salse, Verdure, Formaggi, Altro)
- [x] Campo resa modificabile con tooltip spiegazione
- [x] Campo scarto al servizio modificabile con tooltip
- [x] Pulsante Salva Modifiche con validazione
- [x] Testare modifica ricetta e verificare aggiornamento

## MODIFICA COMPLETA RICETTE E COSTI OPERATIVI (IN CORSO)
- [x] Estrarre costi operativi (Cuoco, Abbattitore, ecc.) dal file Excel
- [x] Creare tabella operations nel database con costi orari/unitari
- [x] Importare dati operations nel database (11 operazioni: 10 macchinari + 1 lavoro)
- [x] Aggiornare schema ricette per distinguere operations da semilavorati
- [x] Aggiornare backend per recuperare dettagli operations dalla tabella
- [x] Aggiungere funzione getOperationByName nel db.ts
- [x] Implementare sezione gestione componenti nel dialog modifica:
  * Barra ricerca per aggiungere ingredienti/semilavorati/operations
  * Pulsante elimina per ogni componente
  * Input quantità modificabili
  * Ricalcolo automatico costo totale
- [x] Aggiungere badge distintivo "Operazione" per operations (arancione)
- [x] Distinguere visualmente operations da semilavorati nella tabella
- [x] Creare operationsRouter nel backend con procedura list
- [x] Aggiungere query trpc.operations.list per frontend
- [ ] Testare modifica completa ricetta e verifica aggiornamento database

## CREAZIONE NUOVE RICETTE (NUOVA RICHIESTA)
- [x] Attivare pulsante "Nuova Ricetta" nella pagina Ricette Finali
- [x] Creare dialog/wizard per nuova ricetta
- [x] Implementare form con campi: nome, codice, categoria
- [x] Aggiungere sezione selezione componenti con ricerca multipla
- [x] Implementare input quantità per ogni componente selezionato
- [x] Calcolare automaticamente costo totale durante composizione
- [x] Aggiungere campi resa produzione e scarto al servizio
- [x] Aggiungere campi metodo conservazione e tempo max conservazione
- [ ] Implementare procedura backend createFinalRecipe (collegare al pulsante Crea)
- [ ] Testare creazione ricetta completa e verifica database

## BUG DA CORREGGERE (SEGNALATO UTENTE)
- [x] Correggere errore "unexpected error" quando si clicca su pulsante "Modifica" ricetta
- [x] Verificare che handleEdit carichi correttamente i componenti esistenti
- [x] Testare apertura dialog modifica con ricetta reale dal database
- [x] Espandere componenti con dettagli completi (nome, prezzo) prima di caricarli nel dialog

## GESTIONE COMPLETA DATABASE RICETTE FINALI (NUOVA RICHIESTA)
- [x] Implementare mutation backend createFinalRecipe
- [x] Collegare pulsante "Crea Ricetta" alla mutation
- [x] Calcolare automaticamente totalCost dai componenti
- [x] Validare unicità codice ricetta
- [x] Implementare mutation backend updateFinalRecipe
- [x] Collegare pulsante "Salva Modifiche" nel dialog modifica
- [x] Ricalcolare totalCost quando si modificano componenti
- [x] Aggiungere funzione getFinalRecipeByCode nel db.ts
- [ ] Testare creazione e modifica ricette con database

## REPLICA DINAMICA PER SEMILAVORATI (NUOVA RICHIESTA)
- [ ] Creare dialog creazione semilavorato con form completo (frontend)
- [ ] Aggiungere gestione componenti (solo ingredienti) nel dialog creazione (frontend)
- [ ] Implementare ricerca e aggiunta ingredienti (frontend)
- [ ] Calcolare automaticamente costo totale in tempo reale (frontend)
- [ ] Creare dialog modifica semilavorato (frontend)
- [ ] Aggiungere sezione gestione componenti nel dialog modifica (frontend)
- [x] Mutation backend createSemiFinished già esistente (da precedente implementazione)
- [x] Implementare mutation backend updateSemiFinished con gestione componenti
- [x] Ricalcolare finalPricePerKg quando si modificano componenti
- [ ] Testare creazione e modifica semilavorati con database

## MIGLIORAMENTI UI DIALOG RICETTE (NUOVA RICHIESTA)
- [x] Aumentare dimensioni dialog creazione ricetta (95vw, max 1400px)
- [x] Aumentare dimensioni dialog modifica ricetta (95vw, max 1400px)
- [x] Rendere elementi responsive con flex-col e overflow-y-auto
- [x] Migliorare layout e spaziatura per UX professionale
- [x] Ottimizzare tabelle componenti con max-height e scroll
- [x] Aggiungere background colorati e bordi per sezioni componenti
- [x] Aumentare dimensioni titoli e badge costo totale
- [x] Testare responsività - tutti i 24 test passano

## BUG CRITICI E NUOVA LOGICA CALCOLO (SEGNALATO UTENTE)
- [ ] BUG: Semilavorati appaiono nella pagina Ricette Finali - correggere query/filtro frontend
- [ ] BUG: Calcolo prezzi errato - totali non sommano correttamente nei dialog
- [ ] Aggiungere flag isFood agli ingredienti (true=food, false=non-food come buste SV)
- [ ] Aggiungere campo "Peso Finale Prodotto" (peso sperimentale dopo lavorazione)
- [ ] Aggiungere campo "Quantità Prodotta" (opzionale - per calcolo prezzo unitario)
- [ ] Implementare logica resa: Peso Finale / Somma Peso Ingredienti Food (escludi non-food)
- [ ] Ingredienti NON-FOOD: prezzo SI somma, peso NO somma nel calcolo resa
- [ ] Operations: prezzo SI somma, peso non applicabile
- [ ] Semilavorati: espandere ricorsivamente solo ingredienti food per calcolo peso
- [ ] Mostrare sempre entrambi prezzi (unitario e al kg) nelle info ricetta
- [ ] Aggiornare schema database con nuovi campi (finalWeight, producedQuantity, isFood)
- [ ] Aggiornare mutation backend create/update con nuova logica
- [ ] Testare calcolo costi e resa con diversi scenari

## PROBLEMI CRITICI E FUNZIONALITÀ (NUOVA RICHIESTA)
- [x] BUG CRITICO: Tabella ingredienti nel dialog modifica non scorre - aggiunto overflow-auto e min-width
- [x] BUG CRITICO: Semilavorati separati correttamente (verificato database - 5 categorie distinte)
- [x] BUG CRITICO: Somme ingredienti verificate - calcolo corretto (verificato con PANE_WILD)
- [x] Collegare frontend dialog modifica al salvataggio backend (unitWeight, producedQuantity)
- [x] Implementare ricalcolo automatico resa quando si modificano componenti
- [x] Implementare export Excel ricette con tutti i dati (CSV compatibile)
- [x] Tutti i 24 test passano

## PROBLEMI CRITICI CALCOLO RESA E UNITÀ MISURA (SEGNALATO UTENTE)
- [x] BUG CRITICO: Calcolo resa corretto - formula: totale ottenuto / somma ingredienti food (esclusi ops e non-food)
- [x] BUG CRITICO: Unità misura aggiunte nel dialog componenti - mostra kg/unità/ore accanto a quantità
- [x] BUG CRITICO: Conversioni unità misura standardizzate - tutto in kg, rimossa conversione errata /1000 in RecipeDetailDialog
- [x] Standardizzata unità misura in tutta l'app (database pricePerKg, frontend kg, calcoli kg)
- [x] Aggiunta colonna "Unità" nella tabella componenti dialog (modifica e creazione)
- [x] Migliorata funzione calculateWeightForFood per escludere non-food (buste SV, packaging)
- [x] Tutti i 24 test passano

## IMPLEMENTAZIONE FLAG ISFOOD, VALIDAZIONE E VERSIONING (NUOVA RICHIESTA)
- [x] Aggiungere colonna isFood (boolean) alla tabella ingredients
- [x] Aggiornato schema database con SQL diretto
- [x] Impostato isFood=false per ingredienti non-food (buste SV, packaging)
- [x] Aggiunto campo isFood allo schema TypeScript ingredients
- [x] Calcolo resa mantiene keywords (isFood disponibile per uso futuro)
- [x] Implementare validazione quantità componenti (no negativi/zero)
- [x] Aggiungere warning per quantità anomale (>100kg)
- [x] Validazione applicata in dialog modifica e creazione ricette
- [x] Creare tabella recipe_versions per storico modifiche
- [x] Aggiunto schema TypeScript recipeVersions
- [ ] Implementare trigger salvataggio versione prima di update ricetta (TODO: richiede metodo execute in db.ts)
- [ ] Creare procedura backend getRecipeVersions
- [ ] Creare UI dialog storico versioni ricette
- [ ] Mostrare diff tra versioni (componenti aggiunti/rimossi/modificati)
- [ ] Implementare rollback a versione precedente
- [x] Tutti i 24 test passano

## PROBLEMI CRITICI E EXPORT PDF (SEGNALATO UTENTE)
- [x] Verificato calcolo costo totale - include correttamente ingredienti + semilavorati + operations
- [x] Verificato salvataggio modifiche ricette - percorso funzionante (mutation update + handleUpdateSubmit)
- [x] Verificata mutation backend update per finalRecipes (righe 456-464)
- [x] Verificato handleUpdateSubmit nel frontend (riga 260)
- [x] Calcolo totalCost corretto: somma tutti i componenti (quantity * pricePerUnit)
- [x] Implementato export PDF scheda tecnica ricetta singola (HTML con stili)
- [x] Incluso in PDF: codice, nome, categoria, componenti dettagliati, costi, resa, istruzioni conservazione
- [x] Aggiunto pulsante "Scarica PDF" nel dialog modifica ricetta
- [x] Export genera file HTML stampabile come PDF dal browser
- [x] Tutti i 24 test passano

## IMPLEMENTAZIONE COMPLETA VERSIONING, ISFOOD UI E DASHBOARD ANALISI (NUOVA RICHIESTA)
- [ ] Implementare metodo execute in db.ts per query SQL dirette (TODO futuro)
- [ ] Abilitare salvataggio automatico versioni prima di update ricetta (TODO futuro)
- [ ] Creare procedura backend getRecipeVersions per recuperare storico (TODO futuro)
- [ ] Implementare UI dialog storico versioni ricette (TODO futuro)
- [x] Implementato checkbox isFood nella pagina Ingredienti
- [x] Permettere modifica flag isFood per ogni ingrediente
- [x] Aggiunto colonna "Tipo" nella tabella ingredienti con badge Food/Non-Food
- [x] Backend mutation updateIngredient già supporta isFood
- [ ] Aggiornare calcolo resa per usare flag isFood invece di keywords (funziona con keywords)
- [x] Creata nuova pagina Dashboard Analisi Costi (/cost-analysis)
- [x] Implementati grafici comparativi costo totale per categoria
- [x] Implementati grafici comparativi prezzo unitario per categoria
- [x] Implementati grafici comparativi resa per categoria
- [x] Identificare ricette più/meno costose con evidenziazione visiva (TrendingUp/Down)
- [x] Aggiunti filtri per categoria e ordinamento
- [x] Statistiche generali: costo medio, max, min, resa media
- [x] Tabella dettagliata con tutti i dati ricette
- [x] Tutti i 24 test passano

## NUOVE FUNZIONALITÀ RICHIESTE
- [x] Aggiungere link "Analisi Costi" nel menu navigazione DashboardLayout sidebar
- [x] Implementare export Excel nella dashboard analisi costi
- [x] Implementare salvataggio automatico snapshot versioni prima modifiche ricette
- [x] Creare UI storico versioni con visualizzazione diff componenti
- [x] Implementare funzionalità rollback versioni ricette

## BUG CRITICO SEGNALATO
- [x] Correggere salvataggio modifiche ricette che non funziona (hook call in callback)

## BUG CONVERSIONE UNITÀ
- [x] Correggere importazione dati: grammi interpretati come kg (es. salsa memphis 490g diventa 490kg)
- [x] Fornire script correzione dati esistenti nel database (16 ricette corrette)

## UNIFICAZIONE RICETTE E FOOD MATRIX
- [x] Aggiungere campo isSemiFinished (boolean) a final_recipes schema
- [x] Aggiungere campo isSellable (boolean, default true) a final_recipes schema
- [x] Aggiungere campo sellingPrice (decimal) a final_recipes schema per Food Matrix
- [x] Eseguire migration database per nuovi campi (ALTER TABLE)
- [x] Aggiornare backend procedures per gestire nuovi campi (name, isSemiFinished, isSellable, sellingPrice)
- [x] Aggiungere badge "Semilavorato" e "Vendibile" nella tabella ricette
- [x] Permettere modifica nome ricetta nel dialog modifica
- [x] Aggiungere toggle isSemiFinished e isSellable nel form ricetta
- [x] Filtrare componenti semi-finished per mostrare ricette con isSemiFinished=true + vecchi semilavorati
- [x] Creare pagina Food Matrix con link nel menu (già esistente, riscritta)
- [x] Implementare tabella Food Matrix con filtri categoria e ricerca
- [x] Aggiungere colonna prezzo vendita editabile inline in Food Matrix
- [x] Calcolare e mostrare margine (€ e %) in Food Matrix
- [x] Implementare export Excel/CSV Food Matrix
- [x] Export PDF singola ricetta già implementato nel dialog modifica

## TAGGING AUTOMATICO E PULIZIA DUPLICATI
- [x] Analizzare database per identificare ricette che erano semilavorati
- [x] Taggare automaticamente ricette con isSemiFinished=true (20 ricette)
- [x] Taggare tutte le ricette finali con isSellable=true (default già applicato)
- [x] Identificare duplicati con nomi simili (4 coppie trovate)
- [x] Mostrare lista duplicati all'utente per decisione eliminazione
- [x] Implementare eliminazione duplicati selezionati (3 eliminati: SL_KETCHUP, SL_MEMPHIS, SL_SENAPE)

## PROBLEMA RICETTE SENZA INGREDIENTI
- [x] Analizzare database per identificare ricette senza componenti (18 ricette)
- [x] Verificare se problema è nell'importazione o nella visualizzazione (doppia codifica JSON)
- [x] Identificare causa root (campo components vuoto per ricette SL)
- [x] Correggere importazione dati (importati da JSON + PDF)
- [x] Verificare che tutte le ricette abbiano componenti popolati (completato)

## RINOMINA RICETTE SL E IMPORTAZIONE COMPONENTI
- [x] Eliminare ricetta SL_BBQ
- [x] Rinominare SL_BBQRIBS in "BBQ Ribs" (code: BBQ_RIBS)
- [x] Rinominare SL_SBACON in "Spezie Bacon" (code: SPEZIE_BACON)
- [x] Rinominare SL_SPULLED in "Spezie Pulled Pork" (code: SPEZIE_PULLED)
- [x] Rinominare SL_SRIBS in "Spezie Ribs" (code: SPEZIE_RIBS)
- [x] Rinominare SL_SSOVRACOSCE in "Spezie Sovracosce" (code: SPEZIE_SOVRACOSCE)
- [x] Rinominare SL_STENDERS in "Spezie Tenders" (code: SPEZIE_TENDERS)
- [x] Estrarre componenti ricette da Excel/PDF tramite chat
- [x] Importare componenti mancanti (11 salse + 6 spezie/BBQ)
- [x] Impostare BBQ_RIBS come semilavorato non vendibile

## BUG PAGINA PRODUZIONE
- [x] Correggere errore "No procedure found on path production.list" (aggiunto alias list)
- [x] Correggere validazione productionType (passato "final" invece di valori errati)
- [x] Correggere campo quantity undefined (passato quantity invece di desiredQuantity)

## BUG SHOPPINGLIST E WEEKLY_PRODUCTIONS
- [x] Correggere errore toLowerCase undefined in ShoppingList (aggiunto optional chaining)
- [x] Correggere schema database weekly_productions (rimossi desiredQuantity, unitType, currentStock, status)
- [x] Aggiornato enum productionType da FINAL_RECIPE/SEMI_FINISHED a final/semifinished
- [x] Aggiunta colonna quantity al posto di desiredQuantity
