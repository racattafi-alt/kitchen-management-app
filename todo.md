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
