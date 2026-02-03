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
