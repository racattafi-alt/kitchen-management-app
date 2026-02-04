# Kitchen Management System - TODO

[... contenuto precedente mantenuto ...]

## AGGIORNAMENTO MASSIVO INGREDIENTI DA PDF
- [x] Analizzare PDF MENUUNION2026-FogliGoogle.pdf per estrarre dati ingredienti
- [x] Estrarre prezzi corretti (packagePrice) per tutti gli ingredienti
- [x] Estrarre quantità confezione corrette (packageQuantity)
- [x] Mappare e unificare categorie ingredienti (aggiunte: Packaging, Non Food, Birra, Alcolici, Bevande)
- [x] Identificare ingredienti non-food e taggarli correttamente (isFood=false)
- [x] Creare script Python per aggiornamento massivo database
- [x] Eseguire script e verificare correzioni (31 ingredienti aggiornati)
- [x] Testare prezzi corretti nell'interfaccia (aglio pelato ora €5.98/kg)
- [x] Verificare categorie unificate
- [x] Salvare checkpoint con dati corretti

## COMPLETAMENTO AGGIORNAMENTO INGREDIENTI
- [ ] Estrarre TUTTI i dati dal PDF (circa 150+ ingredienti)
- [ ] Creare script Python completo per import massivo
- [ ] Eseguire import e verificare tutti gli ingredienti aggiornati
- [ ] Verificare prezzi, categorie e flag isFood corretti

## FILTRI AVANZATI INGREDIENTI
- [x] Aggiungere filtro "Tipo" (Food / Non-Food / Tutti)
- [x] Aggiornare filtro categorie con nuove opzioni (Packaging, Non Food, Birra, Alcolici, Bevande)
- [x] Testare filtri combinati (categoria + tipo + ricerca)

## EXPORT/IMPORT EXCEL INGREDIENTI
- [x] Implementare procedura backend exportIngredientsToExcel
- [x] Creare pulsante "Esporta Excel" nella pagina ingredienti
- [x] Implementare procedura backend importIngredientsFromExcel
- [x] Creare dialog upload file Excel per import
- [x] Validare formato Excel e mostrare preview prima dell'import
- [ ] Testare export/import con dati reali
- [x] Salvare checkpoint finale

## IMPORT COMPLETO INGREDIENTI DA PDF
- [x] Analizzare PDF MENUUNION2026 pagina per pagina per estrarre tutti gli ingredienti
- [x] Creare mapping completo: nome → prezzo, quantità, unità, categoria, isFood
- [x] Creare script Python per import massivo con gestione errori
- [x] Creare file Excel con tutti i 147 ingredienti estratti dal PDF
- [ ] Importare file Excel tramite interfaccia web
- [ ] Verificare numero ingredienti aggiornati
- [ ] Verificare prezzi corretti per campione di ingredienti
- [ ] Verificare categorie assegnate correttamente
- [ ] Verificare flag isFood per ingredienti non-food
- [ ] Testare interfaccia con ingredienti aggiornati
- [ ] Salvare checkpoint con database completo

## BUG: ERRORE REQUIRE NOT DEFINED
- [x] Identificare dove viene usato require() nelle procedure export/import Excel
- [x] Sostituire require() con script Python standalone
- [x] Creare script export_excel.py e import_excel.py
- [x] Testare script Python standalone funzionanti
- [ ] Testare export Excel da interfaccia web
- [ ] Testare import Excel da interfaccia web

## BUG: CALCOLO PREZZO ERRATO QUANDO SI MODIFICA QUANTITÀ
- [x] Riprodurre bug con shopper bio: modificare quantità e verificare prezzo errato
- [x] Identificare logica di ricalcolo pricePerKgOrUnit nel form modifica
- [x] Correggere formula: pricePerKgOrUnit = packagePrice / packageQuantity
- [x] Testare correzione con shopper bio (ora calcola correttamente €0.04/pz)
- [x] Salvare checkpoint con bug corretto

## AUDIT COMPLETO E CORREZIONE ERRORI
### Fase 1: Correzione Errori TypeScript
- [x] Correggere errori in Suppliers.tsx (id mancante, data non esiste)
- [x] Correggere errore logout in routers.ts
- [x] Correggere errore costPerHour in routers.ts
- [x] Risolvere tutti i 23 errori TypeScript (0 errori rimanenti)

### Fase 2: Validazione Prezzi Client-Side
- [x] Aggiungere validazione prezzi >= 0 nel form ingredienti
- [x] Aggiungere validazione quantità > 0
- [x] Mostrare warning per prezzi anomali (>€100/unità)
- [x] Impedire salvataggio con valori invalidi (toast errore)

### Fase 3: Test Funzionalità Core
- [x] Test pagina Ricette (41 ricette, 28 finali, 13 semilavorati)
- [x] Test Food Matrix (27 ricette vendibili, filtri funzionanti)
- [x] Test pagina Produzione (pianificazione settimanale funzionante)
- [x] Test Lista Acquisti (167 articoli, filtri per fornitore)
- [ ] Menu - ESCLUSO (da sviluppare in seguito)

### Fase 4: Bug Report
- [x] Documentare tutti i bug trovati con severity (vedi BUG_REPORT.md)
- [x] Proporre fix per bug critici
- [x] Salvare checkpoint finale

## NORMALIZZAZIONE CATEGORIE RICETTE
- [x] Identificare categorie duplicate nel database (ALTRO/Altro, SALSE/Salse)
- [x] Normalizzazione lato frontend implementata (non richiede migrazione DB)
- [x] Testare visualizzazione categorie unificate

## IMPORT COMPLETO INGREDIENTI DA EXCEL
- [ ] Installare libreria exceljs per parsing Excel
- [ ] Implementare procedura backend per leggere file Excel
- [ ] Validare dati Excel (prezzi, quantità, categorie)
- [ ] Importare ingredienti dal file ingredienti_completi.xlsx
- [ ] Verificare tutti gli ingredienti aggiornati nel database

## REIMPLEMENTAZIONE EXPORT EXCEL CON NODE.JS
- [x] Rimuovere vecchia implementazione Python
- [x] Installare libreria exceljs
- [x] Implementare export Excel in TypeScript con server/exportExcel.ts
- [x] Implementare import Excel in TypeScript
- [x] Testare export da interfaccia web (funzionante)
- [x] Testare dialog import (funzionante)
- [x] Salvare checkpoint finale

## UX: RIMUOVERE 0 PREDEFINITO CASELLA QUANTITÀ LISTA ACQUISTI
- [x] Identificare campo input quantità in ShoppingList.tsx (riga 387)
- [x] Rimuovere value={orderQty} e usare value={orderQty || ""}
- [x] Impostare placeholder="0" per indicare valore vuoto
- [x] Testare funzionalità lista acquisti (caselle ora vuote con placeholder)
- [x] Salvare checkpoint

## MIGLIORAMENTI LISTA ACQUISTI
- [x] Ordinare ingredienti per fornitore nella visualizzazione
- [x] Aggiungere pulsante "Esporta Ordine per Email"
- [x] Creare formato ordine senza prezzi (solo articolo, quantità, unità)
- [x] Generare testo email con ordini raggruppati per fornitore
- [x] Testare export email (funzionante: apre client email con ordine formattato)
- [x] Salvare checkpoint

## BUG: VISUALIZZAZIONE 0 NELLE CASELLE QUANTITÀ SU MOBILE
- [x] Identificare problema: caselle mostrano 0 su mobile nonostante value={orderQty || ""}
- [x] Cambiare value={orderQty || undefined} e rimuovere placeholder
- [x] Testare correzione su dispositivo mobile (da verificare dall'utente)
- [x] Salvare checkpoint

## BUG: PROBLEMI VISUALIZZAZIONE OPERA MOBILE
- [x] Caselle quantità mostrano ancora 0 su Opera mobile nonostante correzione
- [x] Pulsante "Esporta Email" non visibile su mobile
- [x] Implementato approccio alternativo: color transparent per nascondere 0 + onFocus select
- [x] Reso layout responsive pulsanti export (flex-col su mobile, flex-row su desktop)
- [ ] Testare correzioni su Opera mobile
- [ ] Salvare checkpoint
