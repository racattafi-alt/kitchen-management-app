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

## MIGRAZIONE DATABASE FORNITORI (IN CORSO)
- [x] Creare tabella suppliers con schema completo
- [x] Implementare backend CRUD per fornitori (create/list/update/delete)
- [x] Creare procedura migrazione da ingredienti (13 fornitori estratti)
- [x] Aggiornare schema ingredients: cambiato supplier (text) → supplierId (foreign key nullable)
- [ ] Creare script migrazione per popolare supplierId in ingredients
- [ ] Aggiornare tutto il codice backend che usa ingredient.supplier per usare supplierId + join
- [ ] Aggiornare Ingredients.tsx: campo supplier da text input a required Select dropdown
- [ ] Creare pagina Fornitori UI per gestione CRUD
- [ ] Testare modifica ingrediente con selezione fornitore
- [ ] Popolare campo minOrderQuantity da Excel
- [ ] Implementare arrotondamento automatico nella lista acquisti
