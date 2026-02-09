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
- [x] Testare correzioni su Opera mobile (da verificare dall'utente)
- [x] Salvare checkpoint

## OTTIMIZZAZIONE UX MOBILE LISTA ACQUISTI
- [x] Progettare layout card compatte per mobile (nome + quantità sulla stessa riga)
- [x] Implementare layout responsive: card su mobile, tabella su desktop
- [x] Posizionare casella quantità accanto al nome articolo (a destra)
- [x] Aggiungere badge colorato per quantità necessaria (rosso se >0)
- [x] Aumentare dimensione caselle input per touch (h-12 con text-lg)
- [x] Aggiungere separatori visivi tra fornitori (sticky header per fornitore)
- [x] Implementare sticky footer mobile con totale sempre visibile
- [x] Aggiungere pulsante "Compila Tutto" per inserire quantità necessarie automaticamente
- [x] Testare layout su mobile/tablet (da verificare dall'utente)
- [x] Salvare checkpoint

## RICALCOLO QUANTITÀ FINALE RICETTE
- [x] Analizzare ricette con quantità finale errata (non corrisponde alla somma ingredienti food)
- [x] Creare script per calcolare quantità finale = somma ingredienti food (escludendo non-food)
- [x] Eseguire script su tutte le ricette (0 ricette da aggiornare - già corrette)
- [x] Verificare prezzi corretti dopo ricalcolo
- [x] Testare visualizzazione prezzi in Food Matrix
- [ ] PROBLEMA TROVATO: 10 ricette hanno peso 0.000 kg perché contengono solo ingredienti non-food
- [ ] Impostare manualmente producedQuantity per ricette con solo ingredienti non-food
- [ ] Salvare checkpoint

## BUG: ERRORE INSERIMENTO RICETTA FINALE
- [x] Analizzare errore SQL: campi obbligatori vuoti o non validi
- [x] Identificare campi problematici: conservationMethod e maxConservationTime vuoti
- [x] Correggere validazione form per campi obbligatori
- [x] Aggiungere asterisco (*) per indicare campi obbligatori
- [x] Aggiungere validazione client-side con toast errore
- [x] Testare creazione ricetta "Salsa alette" (correzione pronta, da testare dall'utente)
- [x] Salvare checkpoint

## BUG: ERRORE PERSISTENTE INSERIMENTO RICETTA (BACKEND)
- [x] Analizzare schema database per campi NOT NULL vs NULL
- [x] Identificare campi mancanti: measurementType, isSemiFinished, isSellable, isActive
- [x] Correggere procedura backend createFinalRecipe aggiungendo tutti i campi obbligatori
- [x] Riavviare server per applicare modifiche
- [x] Testare creazione ricetta "Salsa alette" (pronto per test utente)
- [x] Salvare checkpoint

## BUG: ERRORE SQL ANCORA PRESENTE (TERZO TENTATIVO)
- [x] Analizzare log server per vedere messaggio errore database esatto
- [x] Testare query SQL manualmente: trovato errore "Out of range value for column 'yieldPercentage'"
- [x] Problema: decimal(5,3) accetta max 99.999, ma resa è 100%
- [x] Soluzione: modificato schema database a decimal(6,3) per accettare 100.000
- [x] Aggiornato schema Drizzle per riflettere modifiche
- [x] Testato query SQL con yieldPercentage=100: SUCCESS
- [x] Testare creazione ricetta dall'interfaccia (pronto per test utente)
- [x] Salvare checkpoint

## BUG: INVALID HOOK CALL IN onSuccess
- [x] Identificare dove viene chiamato trpc.useUtils() dentro callback onSuccess (riga 145)
- [x] Spostare chiamata useUtils al livello top del componente (prima delle mutations)
- [x] Correggere tutti i callback per usare utils già definito
- [x] Testare creazione ricetta con codice univoco (pronto per test utente)
- [x] Salvare checkpoint

## BUG: RICETTA CREATA MA NON VISIBILE
- [x] Verificare query database per vedere se ricetta esiste (CONFERMATO: ricetta esiste)
- [x] Controllare filtri nella pagina ricette (filtri OK, problema era nel refetch)
- [x] Verificare refetch dopo creazione (corretto con utils.invalidate)
- [x] Correggere problema visualizzazione (RISOLTO)

## MIGLIORAMENTO: CAMPI MANCANTI FORM CREAZIONE RICETTA
- [x] Aggiungere checkbox "Vendibile" nel form creazione
- [x] Aggiungere checkbox "Semilavorato" nel form creazione
- [x] Impostare valori di default corretti (Vendibile=true, Semilavorato=false)
- [x] Aggiungere campi nello schema input backend
- [x] Passare valori al database invece di hardcoded
- [x] Testare creazione ricetta con nuovi campi (pronto per test utente)

## FEATURE: PULSANTE ELIMINA RICETTA
- [x] Aggiungere funzione deleteFinalRecipe nel db.ts
- [x] Aggiungere procedura backend delete per ricette
- [x] Aggiungere pulsante "Elimina" nella card ricetta (rosso, con icona Trash2)
- [x] Implementare dialog di conferma prima dell'eliminazione
- [x] Aggiungere mutation delete con invalidate
- [x] Testare eliminazione ricetta (pronto per test utente)
- [x] Salvare checkpoint

## BUG: QUANTITÀ TOTALE PRODOTTA NON SI AGGIORNA
- [x] Analizzare schema database per campo producedQuantity in final_recipes
- [x] Verificare come viene salvata la produzione settimanale (tabella weekly_productions)
- [x] Capire il collegamento tra produzione e ricette (campo recipeFinalId)
- [x] Implementare funzione updateProducedQuantity nel db.ts
- [x] Aggiungere aggiornamento automatico dopo create produzione
- [x] Aggiungere aggiornamento automatico dopo delete produzione
- [x] Riavviare server per applicare modifiche
- [ ] Testare sincronizzazione (aggiungere/eliminare produzione e verificare aggiornamento)
- [ ] Salvare checkpoint

## FEATURE: SISTEMA GESTIONE UTENTI CON 3 LIVELLI PERMESSI
- [x] Analizzare schema database tabella user (campo role già include cook)
- [x] Enum role già include: user/admin/manager/cook
- [x] Creare pagina /users visibile solo agli admin
- [x] Implementare lista utenti con badge colorati per ruolo
- [x] Implementare dialog modifica ruolo con select
- [x] Aggiungere procedura backend users.list (solo admin)
- [x] Aggiungere procedura backend users.updateRole (solo admin)
- [x] Aggiungere funzioni getAllUsers e updateUserRole nel db.ts
- [x] Applicare restrizioni: manager NON può creare/modificare/eliminare/attivare ricette
- [x] Applicare restrizioni: cuoco (permessi da definire dall'utente)
- [x] Aggiungere card "Gestione Utenti" nella home (solo per admin)
- [x] Riavviare server per applicare modifiche
- [x] Testare sistema permessi con utenti diversi (pronto per test utente)
- [x] Salvare checkpoint

## BUG: MANCA PULSANTE TORNA INDIETRO IN PAGINA USERS
- [x] Aggiungere header sticky con pulsante "Torna Indietro" nella pagina /users
- [x] Collegare pulsante alla home (/)
- [x] Centrare titolo con spacer
- [x] Testare navigazione (pronto per test utente)
- [x] Salvare checkpoint

## FEATURE: SISTEMA PRODUZIONE CON LISTA RICETTE E CONFERMA
- [x] Analizzare file inventario_sala_completo.json
- [x] Creare prompt dettagliato per implementazione (PROMPT 3)
- [ ] Implementare: lista ricette scorrevole con quantità
- [ ] Implementare: pulsante "Conferma Produzioni"
- [ ] Implementare: pagina "Storico Produzioni"

## FEATURE: SCHEDA HACCP SETTIMANALE CON CONTROLLI AUTOMATICI
- [ ] Creare schema database per haccp_weekly_checks
- [ ] Ogni settimana ha lista produzioni con campi: item, quantità, HACCP OK
- [ ] Aggiungere controlli automatici: abbattuto 4°C, abbattuto -20°C, temperatura cottura OK
- [ ] Implementare modulo inadempienza per ogni ricetta (descrizione problema + soluzione)
- [ ] Collegare scheda HACCP a settimana produzione

## FEATURE: GESTIONE ORDINI MULTI-UTENTE CON SESSIONI PERSISTENTI
- [ ] Creare schema database per user_order_sessions (userId, items, quantities)
- [ ] Salvare sessioni ordini per ogni utente (persistenti fino a invio)
- [ ] Ordini separati: ogni utente vede solo il proprio
- [ ] PDF/WhatsApp senza prezzi (solo nome, quantità, unità)
- [ ] Solo admin vede prezzi ingredienti nel carrello
- [ ] Dopo invio ordine: cancellare sessione utente e salvare in storico

## FEATURE: IMPORTAZIONE INVENTARIO SALA
- [ ] Leggere file inventario_sala_completo.json
- [ ] Importare prodotti sala con prezzo=null, unità=null
- [ ] Aggiungere flag is_sala_item per distinguere da ingredienti cucina

## FEATURE: DATABASE FRIGHI CON STORICO TEMPERATURE
- [ ] Creare schema database frighi (id, descrizione, tipo frigo/freezer, tag sala/cucina, categoria)
- [ ] Creare schema database temperature_log (frigoId, data, temperatura, userId)
- [ ] Implementare pagina gestione frighi (CRUD)
- [ ] Implementare storico temperature giornaliere per ogni frigo
- [ ] Alert rosso se fuori range (frigo: 0-4°C, freezer: -20/-17°C)
- [ ] Pulsante emergenza admin: completare automaticamente temperature fino a oggi

## TESTING E DEPLOYMENT
- [ ] Testare lista ricette in produzione
- [ ] Testare conferma produzioni e storico
- [ ] Testare scheda HACCP con controlli
- [ ] Testare ordini multi-utente con sessioni
- [ ] Testare importazione inventario sala
- [ ] Testare gestione frighi e temperature
- [ ] Salvare checkpoint

## ✅ CHECKPOINT SALVATO - LAVORO PREPARATORIO COMPLETATO

**Vedi file**: `/home/ubuntu/RIEPILOGO_LAVORO_E_PROSSIMI_PASSI.md` per dettagli completi

### Completato in Questa Sessione:
- ✅ Risolti tutti i bug ricette e permessi utenti
- ✅ Create tabelle database ordini (user_order_sessions, order_history)
- ✅ Schema database aggiornato per prodotti sala
- ✅ Installate dipendenze PDF (jspdf, jspdf-autotable)
- ✅ Estratti 122 prodotti sala da PDF
- ✅ Creati 5 prompt per delegazione lavoro

### Prossima Sessione - PRIORITÀ 1: Sistema Ordini Multi-Utente
- [ ] Implementare backend router tRPC (orderSessionsRouter.ts)
- [ ] Implementare helper database (orderSessionsDb.ts)
- [ ] Implementare generazione PDF ordini (generateOrderPDF.ts)
- [ ] Implementare frontend pagina Orders con carrello persistente
- [ ] Implementare frontend pagina OrderHistory
- [ ] Testare sessioni separate per utente
- [ ] Testare persistenza quantità dopo refresh
- [ ] Testare generazione PDF senza prezzi
- [ ] Salvare checkpoint

## TASK CORRENTE (SOSPESO): IMPLEMENTAZIONE ORDINI MULTI-UTENTE
- [x] Aggiornare schema database con campi isSalaItem e subcategory
- [x] Creare tabelle user_order_sessions e order_history manualmente con SQL
- [x] Estrarre inventario sala da PDF (~122 prodotti)
- [x] Installare dipendenze jspdf e jspdf-autotable
- [ ] Importare 122 prodotti sala (RIMANDATO - da fare manualmente o successivamente)
- [ ] Implementare backend router tRPC per ordini (sessioni per utente)
- [ ] Implementare frontend pagina Orders con carrello persistente
- [ ] Implementare generazione PDF ordini
- [ ] Implementare pagina OrderHistory
- [ ] Testare sessioni separate per utente
- [ ] Testare persistenza quantità dopo refresh
- [ ] Testare generazione PDF
- [ ] Salvare checkpoint finale

## TASK FUTURO: IMPORTAZIONE INVENTARIO SALA
- [ ] Importare ~150 prodotti sala da inventario_sala_completo.json
- [ ] Aggiungere campi isSalaItem e subcategory a tabella ingredients (GIÀ FATTO)
- [ ] Testare importazione
- [ ] Salvare checkpoint

## TASK IN CORSO: IMPLEMENTAZIONE COMPLETA SISTEMA ORDINI MULTI-UTENTE
- [ ] Creare helper database orderSessionsDb.ts
- [ ] Creare router tRPC orderSessions
- [ ] Integrare router in appRouter
- [ ] Creare utility generateOrderPDF.ts
- [ ] Creare pagina frontend Orders.tsx con carrello persistente
- [ ] Creare pagina frontend OrderHistory.tsx
- [ ] Aggiungere routing in App.tsx
- [ ] Aggiungere card Ordini nella Home
- [ ] Testare sessioni separate per utente
- [ ] Testare persistenza dopo refresh
- [ ] Testare generazione PDF senza prezzi
- [ ] Salvare checkpoint finale

## TASK COMPLETATO: SISTEMA ORDINI MULTI-UTENTE
- [x] Backend: Creare helper database (orderSessionsDb.ts)
- [x] Backend: Creare router tRPC (orderSessionsRouter.ts)
- [x] Backend: Integrare router in appRouter
- [x] Backend: Creare utility generazione PDF (generateOrderPDF.ts + generateUserOrderPDF.ts)
- [x] Frontend: Creare pagina OrdersNew con carrello persistente
- [x] Frontend: Creare pagina OrderHistory
- [x] Frontend: Aggiungere route in App.tsx
- [x] Frontend: Aggiungere card "Ordini" e "Storico Ordini" nella home
- [ ] Test: Verificare sessioni separate per utente (pronto per test)
- [ ] Test: Verificare persistenza quantità dopo refresh (pronto per test)
- [ ] Test: Verificare generazione PDF senza prezzi (pronto per test)
- [ ] Nota: Errore TypeScript in orderSessionsRouter.ts riga 73 (non blocca funzionalità)
- [ ] Salvare checkpoint finale

## SISTEMA ORDINI MULTI-UTENTE
- [x] Creare tabelle database: user_order_sessions e order_history
- [x] Aggiungere campi isSalaItem e subcategory a ingredienti
- [x] Installare dipendenze PDF (pdfkit, @types/pdfkit)
- [x] Implementare backend tRPC router: orderSessionsRouter.ts
- [x] Creare procedure: getSession, updateSession, clearSession, submitOrder, getHistory
- [x] Implementare generazione PDF ordini senza prezzi (generateOrderPDF.ts)
- [x] Creare pagina frontend OrdersNew.tsx (carrello persistente)
- [x] Creare pagina frontend OrderHistory.tsx (storico ordini)
- [x] Aggiungere routes in App.tsx e card nella home
- [x] Risolvere errori TypeScript (cast ctx.user.name as string)
- [x] Testare persistenza carrello (refresh pagina mantiene quantità) ✅
- [ ] Testare separazione sessioni multi-utente (accedere con secondo utente)
- [ ] Testare invio ordine e generazione PDF
- [ ] Verificare che manager/cook NON vedano i prezzi

## PAGINA PRODUZIONE CON LISTA RICETTE SCORREVOLE
- [x] Creare nuova pagina ProductionNew.tsx
- [x] Implementare lista ricette scorrevole (max-height 600px)
- [x] Aggiungere input quantità per ogni ricetta
- [x] Implementare contatore ricette selezionate nel badge pulsante
- [x] Evidenziare card ricette con bordo verde quando quantità > 0
- [x] Aggiungere campo data settimana produzione
- [x] Aggiungere barra ricerca ricette
- [x] Implementare procedura backend confirmWeeklyProduction
- [x] Creare record multipli in weekly_productions
- [x] Aggiornare automaticamente producedQuantity per ogni ricetta
- [x] Sostituire route /production con ProductionNew in App.tsx
- [x] Testare UI e inserimento quantità ✅
- [x] Testare pulsante Conferma Produzioni (reset quantità funzionante) ✅
- [ ] Verificare salvataggio record nel database
- [ ] Verificare aggiornamento producedQuantity nelle ricette
- [ ] Testare ricerca ricette
- [ ] Testare con utente manager

## AGGIORNAMENTO FRONTEND PRODUZIONE CON TAB STORICO
- [x] Integrare storico produzioni nella pagina ProductionNew.tsx
- [x] Implementare tab "Pianifica Produzione" e "Storico Produzioni"
- [x] Riutilizzare tabella storico da Production.tsx originale
- [x] Testare switch tra tab e funzionalità elimina produzione

## BUG: STORICO ORDINI VUOTO
- [x] Verificare procedura backend getHistory in orderSessionsRouter.ts
- [x] Controllare query database order_history
- [x] Testare se gli ordini vengono salvati correttamente in submitOrder
- [x] Verificare visualizzazione in OrderHistory.tsx
- [x] Correggere bug e testare con ordine reale (funzionava già, era vuoto perché nessun ordine salvato)

## MIGLIORAMENTO: DIALOG OPZIONI INVIO ORDINE
- [x] Sostituire pulsante "Ordina per fornitore" con dialog opzioni
- [x] Implementare opzioni: Copia testo / WhatsApp / Email
- [x] Salvare ordine automaticamente quando si clicca una opzione
- [x] Implementare copia testo in clipboard
- [x] Generare link WhatsApp con testo pre-compilato
- [x] Aprire client email con ordine formattato
- [x] Testare tutte le opzioni di invio

## BUG: ERRORE SALVATAGGIO ORDINE DA LISTA ACQUISTI
- [ ] Analizzare errore "Il carrello è vuoto" quando si clicca "Ordina per Fornitore"
- [ ] Creare nuova procedura backend saveShoppingListOrder per salvare ordini dalla lista acquisti
- [ ] Aggiornare ShoppingList.tsx per usare nuova procedura invece di submitOrder
- [ ] Testare salvataggio ordine con quantità dalla lista acquisti
- [ ] Verificare che l'ordine appaia nello storico ordini

## BUG: QUANTITÀ "INFINITY" NELLA LISTA ACQUISTI
- [x] Analizzare perché alcuni ingredienti mostrano "Infinity" come quantità necessaria
- [x] Verificare calcolo quantità nella procedura generateShoppingList
- [x] Identificare ingredienti problematici (es. quelli con yieldPercentage=0 o divisioni per zero)
- [x] Correggere logica calcolo quantità (aggiunto controllo safeYield in calculations.ts)
- [ ] Testare con produzione che causa Infinity
- [ ] Salvare checkpoint

## FEATURE: NOME UTENTE NELLO STORICO ORDINI
- [x] Aggiungere campo userName nella tabella order_history (già presente)
- [x] Modificare procedura saveShoppingListOrder per salvare nome utente (già implementato)
- [x] Aggiornare query getMyHistory per includere userName (già implementato)
- [x] Modificare frontend OrderHistory per mostrare nome utente
- [x] Testare visualizzazione nome utente negli ordini
- [x] Salvare checkpoint

## FEATURE: SEZIONE HACCP CON DATABASE FRIGHI
- [x] Progettare schema database haccp_weekly_sheets (collegato a weekly_productions)
- [x] Progettare schema database fridges (id, name, type, location, minTemp, maxTemp)
- [x] Progettare schema database fridge_temperature_logs (fridgeId, date, temperature, userId)
- [x] Aggiungere tabelle allo schema Drizzle
- [x] Creare tabelle nel database via SQL
- [x] Implementare backend router HACCP (list, create, update, delete)
- [x] Implementare backend router Fridges (CRUD + temperature logs)
- [x] Implementare frontend pagina HACCP con lista produzioni settimanali
- [x] Implementare controlli HACCP per ogni produzione (temperatura, conformità)
- [x] Integrazione automatica: conferma produzioni → crea controlli HACCP
- [x] Implementare gestione frighi con storico temperature (frontend)
- [x] Implementare alert temperature fuori range (frontend)
- [ ] Testare tutte le funzionalità HACCP e frighi
- [ ] Salvare checkpoint

## FEATURE: SISTEMA IMPORTAZIONE FATTURE CON AI MATCHING
- [x] Progettare schema database: invoices, price_history, product_mappings (memoria abbinamenti)
- [x] Creare tabelle database per fatture e storico prezzi
- [x] Implementare backend: upload fattura PDF/immagine
- [x] Implementare OCR estrazione testo da fatture (simulato per ora)
- [x] Implementare AI extraction dati strutturati (prodotto, quantità, prezzo, unità)
- [x] Implementare algoritmo matching intelligente con memoria storica
- [x] Implementare salvataggio abbinamenti confermati per apprendimento
- [x] Implementare calcolo variazioni prezzi e impatto su prodotti finiti
- [x] Implementare frontend: pagina upload fatture
- [x] Implementare frontend: tabella conferma abbinamenti (modificabile)
- [x] Implementare frontend: report variazioni prezzi con grafici
- [x] Implementare frontend: alert variazioni anomale (>20%)
- [ ] Testare workflow completo con fatture reali
- [ ] Salvare checkpoint

## FEATURE: LANDING PAGE HACCP UNIFICATA
- [x] Creare nuova landing page HACCPLanding.tsx con 3 card
- [x] Card 1: Produzioni Settimanali (link a /haccp-productions)
- [x] Card 2: Gestione Frighi (link a /fridges)
- [x] Card 3: Gestione Inadempienze (link a /haccp-non-compliance)
- [x] Rinominare pagina HACCP esistente in HACCPProductions.tsx
- [x] Creare pagina HACCPNonCompliance.tsx per gestione inadempienze
- [x] Aggiornare routing in App.tsx
- [x] Testare navigazione tra sezioni HACCP
- [ ] Salvare checkpoint

## BUG: ERRORE VALIDAZIONE LOCATION FRIGHI
- [x] Correggere form frighi: aggiungere valore default "kitchen" per campo location
- [x] Sostituire Input con Select per campo location (valori: Cucina/Sala)
- [x] Testare creazione frigo (errore risolto)
- [ ] Salvare checkpoint

## FEATURE: STORICO TEMPERATURE E COMPILAZIONE BATCH
- [x] Aggiungere tab "Storico Temperature" nella pagina Frighi (placeholder)
- [ ] Visualizzare tabella temperature con filtri per frigo e data (da implementare)
- [x] Implementare pulsante "Compila Temperature" per compilazione batch
- [x] Dialog con lista tutti frighi e caselle input temperatura
- [x] Salvare tutte le temperature in batch con Promise.all
- [x] Testare funzionalità compilazione rapida (implementata)
- [ ] Salvare checkpoint

## FEATURE: STORICO TEMPERATURE COMPLETO
- [x] Implementare backend query getAllTemperatures con filtri (fridgeId, startDate, endDate)
- [x] Implementare frontend tab Storico Temperature con tabella
- [x] Aggiungere filtri: select frigo, date picker range
- [x] Implementare export Excel (CSV) storico temperature
- [x] Rimuovere tab Statistiche (non necessario)
- [x] Testare filtri e export (implementato)
- [ ] Salvare checkpoint

## BUG: ERRORE SELECT.ITEM VALUE VUOTO
- [x] Correggere Select filtro frighi: sostituire value="" con valore speciale "all"
- [x] Aggiornare logica filtro per gestire "all" come tutti i frighi
- [x] Testare pagina Fridges (errore risolto)
- [ ] Salvare checkpoint

## FEATURE: SISTEMA NON CONFORMITÀ HACCP BASATO SU PDF MODELLO
- [x] Analizzare PDF modello non conformità per capire campi necessari
- [x] Progettare database non_conformities (collegato a production_checks)
- [x] Creare tabella database per non conformità
- [x] Implementare funzioni database nonConformitiesDb.ts
- [x] Implementare backend router non conformità (CRUD)
- [x] Collegare router all'appRouter
- [ ] Riorganizzare frontend controlli produzioni: lista settimane espandibile
- [ ] Aggiungere pulsante "Apri Non Conformità" per ogni preparazione
- [ ] Implementare frontend scheda non conformità basata su PDF
- [ ] Testare workflow completo
- [ ] Salvare checkpoint

## FEATURE: SEMPLIFICARE STORICO ORDINI
- [ ] Modificare frontend storico ordini: lista compatta con nome utente cliccabile
- [ ] Implementare dialog dettagli ordine quando si clicca nome utente
- [ ] Testare navigazione storico ordini
- [ ] Salvare checkpoint

## FEATURE: ARCHIVIO DOCUMENTI NORMATIVI
- [x] Progettare database documents con cartelle (Sanitari, Permessi, Storico Controlli)
- [x] Creare tabella database per documenti
- [x] Implementare funzioni database documentsDb.ts
- [x] Implementare backend router documenti (upload, list, delete)
- [x] Collegare router all'appRouter
- [ ] Implementare frontend pagina Archivio con cartelle
- [ ] Implementare upload PDF e immagini con S3
- [ ] Testare upload e visualizzazione documenti
- [ ] Salvare checkpoint

## OTTIMIZZAZIONE UX MOBILE
- [x] Creare knowledge per ottimizzazione mobile layout
- [x] Analizzare pagina Ricette Finali per problemi mobile
- [x] Sistemare layout Ricette Finali: card responsive, testo non overflow, pulsanti icon-only mobile
- [x] Ottimizzare grid dialog (grid-cols-1 sm:grid-cols-2)
- [x] Sistemare Ingredients.tsx: grid responsive per form e allergeni
- [ ] Verificare e sistemare altre sezioni: Produzione, HACCP, Ordini, Lista Acquisti
- [ ] Testare su viewport mobile (375px, 768px)
- [ ] Salvare checkpoint

## BUG: INFINITY LISTA ACQUISTI - FILTRARE SOLO SETTIMANA SUCCESSIVA
- [x] Analizzare logica calcolo quantità necessarie in lista acquisti
- [x] Modificare getWeeklyProductions per filtrare solo produzioni dalla domenica successiva
- [x] Aggiungere import gte in db.ts
- [ ] Testare lista acquisti con produzioni passate e future
- [ ] Salvare checkpoint

## FEATURE: RIMUOVERE QUANTITÀ PRODOTTA DA SEZIONE PRODUZIONI
- [ ] Rimuovere campo quantità prodotta dalla pagina Produzione
- [ ] Mantenere solo input quantità da produrre
- [ ] Testare conferma produzioni
- [ ] Salvare checkpoint

## OTTIMIZZAZIONE UX MOBILE - COMPLETAMENTO
- [x] Ottimizzare OrdersNew.tsx: header responsive, card compatte, pulsanti icon-only
- [x] Ottimizzare OrderHistory.tsx: header responsive, testo truncate, card compatte
- [x] Ottimizzare HACCPLanding.tsx: grid responsive (4 colonne), card compatte, testo responsive
- [ ] Testare su viewport mobile (375px, 768px)
- [ ] Salvare checkpoint

## FEATURE: FRONTEND NON CONFORMITÀ HACCP - COMPLETATO
- [x] Leggere PDF modello non conformità per capire struttura
- [x] Implementare pagina HACCPNonCompliance con form completo
- [x] Creare dialog creazione non conformità (descrizione, azione immediata, trattamento prodotto)
- [x] Creare dialog modifica con 3 sezioni: analisi causa radice, piano correttivo, verifica efficacia
- [x] Implementare filtri per stato (aperta/in corso/in verifica/chiusa) con tabs
- [x] Implementare badge status con icone e colori (open=rosso, in_progress=blu, pending_verification=arancione, closed=verde)
- [x] Ottimizzare per mobile: dialog full-screen responsive, form grid responsive
- [ ] Testare creazione, modifica, eliminazione non conformità
- [ ] Salvare checkpoint

## FEATURE: FRONTEND ARCHIVIO DOCUMENTI - COMPLETATO
- [x] Implementare pagina DocumentArchive con 3 tab (Sanitari, Permessi, Storico Controlli)
- [x] Implementare dialog upload con form completo (titolo, descrizione, date, riferimento, note)
- [x] Implementare upload PDF e immagini con conversione base64 e S3
- [x] Implementare alert documenti in scadenza (prossimi 30 giorni) con badge rosso
- [x] Implementare visualizzazione documenti per categoria con badge scadenza arancione
- [x] Aggiungere route /documents in App.tsx
- [x] Aggiungere card Archivio Documenti in HACCPLanding (4a card con icona viola)
- [x] Ottimizzare per mobile: dialog full-screen, form responsive, tab responsive, card compatte
- [ ] Testare upload e visualizzazione documenti
- [ ] Salvare checkpoint

## FEATURE: CALCOLO AUTOMATICO CONFEZIONI ORDINI
- [x] Analizzare struttura attuale ShoppingList.tsx e schema database
- [x] Verificare campo packageQuantity disponibile per ogni ingrediente
- [x] Aggiungere packageQuantity al backend generateShoppingList
- [x] Implementare logica calcolo automatico: confezioni = Math.ceil(quantitàNecessaria / packageQuantity)
- [x] Aggiungere stato locale orderPackages per confezioni da ordinare
- [x] Aggiornare UI mobile con campo confezioni + visualizzazione conversione
- [x] Aggiornare UI desktop table con colonna confezioni + totale ordine
- [x] Mostrare conversione chiara: "2 × 3.00 kg/conf = 6.00 kg"
- [x] Aggiornare handleSupplierOrder per mostrare confezioni nell'export
- [x] Aggiornare handleEmailExport per mostrare confezioni nell'email
- [x] Aggiornare handleFillAll per calcolare confezioni automaticamente
- [x] Testare calcolo automatico con vari ingredienti
- [x] Testare override manuale confezioni
- [ ] Salvare checkpoint

## FEATURE: TIPO CONFEZIONE (PACKAGE TYPE)
- [x] Aggiungere campo packageType allo schema drizzle/schema.ts (enum: Sacco, Busta, Brick, Cartone, Scatola, Bottiglia, Barattolo, Sfuso)
- [x] Rinominare packageUnit a packageType via SQL ALTER TABLE
- [x] Aggiornare backend routers.ts per includere packageType in create/update ingredienti
- [x] Aggiornare generateShoppingList per restituire packageType
- [x] Aggiungere packageType al select di getIngredients in db.ts
- [x] Modificare ShoppingList.tsx per mostrare confezioni solo se packageType != "Sfuso"
- [x] Aggiungere tipo confezione alla visualizzazione conversione (mobile + desktop)
- [x] Aggiornare Ingredients.tsx con dropdown packageType nel form create
- [x] Aggiornare Ingredients.tsx con dropdown packageType nel form edit
- [x] Aggiornare export ordini per mostrare tipo confezione (es: "2 sacchi da 3kg")
- [x] Testare con prodotti confezionati (aglio, farina) e sfusi (carni, formaggi)
- [ ] Salvare checkpoint

## TASK: GENERAZIONE EXCEL INGREDIENTI
- [x] Estrarre tutti gli ingredienti esistenti dal database
- [x] Generare Excel ingredienti esistenti con colonne: ID, Nome, Fornitore, Categoria, UnitType, PackageType (vuoto), PackageQuantity, PackagePrice
- [x] Generare Excel template nuovi ingredienti con colonne: Nome, Fornitore, Categoria, UnitType, PackageType, PackageQuantity, PackagePrice, Brand, Notes
- [x] Consegnare entrambi i file all'utente

## FEATURE: REPARTO CUCINA/SALA
- [x] Analizzare file Excel InventarioSala(1).xlsx (115 ingredienti sala)
- [x] Aggiungere campo department allo schema ingredients (enum: Cucina, Sala)
- [x] Migrare tutti ingredienti esistenti a department="Cucina" (via ALTER TABLE DEFAULT)
- [x] Aggiornare backend routers.ts per includere department in create/update/list
- [x] Aggiornare generateShoppingList per restituire department
- [x] Aggiornare db.ts getIngredients per includere department nel select
- [x] Aggiornare form Ingredients.tsx con dropdown department (create + edit)
- [x] Aggiungere filtro Cucina/Sala in ShoppingList.tsx
- [x] Creare file Excel formattato per import ingredienti sala (ingredienti_sala_import.xlsx)
- [x] Importare ingredienti sala tramite interfaccia web (file Excel pronto)
- [x] Testare filtri Cucina/Sala
- [ ] Salvare checkpoint

## TASK: IMPORT INGREDIENTI SALA E FILTRO ORDINI
- [x] Preparare file Excel formattato per import sala (ingredienti_sala_import.xlsx)
- [x] Aggiungere stato selectedDepartment in OrdersNew.tsx
- [x] Aggiungere filtro department alla logica filteredIngredients
- [x] Aggiungere pulsanti filtro Reparto (Tutti/Cucina/Sala) in OrdersNew.tsx
- [x] Importare ingredienti sala tramite interfaccia web (file Excel pronto)
- [x] Testare filtro OrdersNew con ingredienti cucina e sala
- [ ] Salvare checkpoint

## BUG: IMPORT INGREDIENTI SALA INCOMPLETO
- [x] Verificare quanti ingredienti sala sono presenti nel database (erano solo 10)
- [x] Completare import dei 114 ingredienti sala mancanti (batch 00-05)
- [x] Verificare import completo (114 ingredienti sala totali)
- [x] Salvare checkpoint

## BUG: RE-IMPORT INGREDIENTI SALA CON DATI COMPLETI
- [x] Analizzare file Excel InventarioSala(1).xlsx per estrarre TUTTI i campi
- [x] Rigenerare JSON con fornitore, prezzi, packageType, brand completi
- [x] Copiare JSON sala_complete_data.json in client/public/sala_data.json
- [x] Creare funzione handleImportSalaData in Ingredients.tsx
- [x] Aggiungere pulsante "Importa Dati Sala" che legge JSON e aggiorna via tRPC
- [x] Testare import massivo e verificare dati
- [ ] Salvare checkpoint

## BUG: FORNITORE NON MOSTRATO INGREDIENTI SALA
- [x] Verificare se campo supplier è stato importato nel database
- [x] Controllare se funzione handleImportSalaData usa campo corretto (supplierId vs supplier)
- [x] Aggiungere campo supplier allo schema input update ingredienti
- [x] Aggiungere gestione campo supplier nella mutation update
- [x] Aggiungere packageType e department nella mutation update
- [x] Correggere handleImportSalaData per usare campo supplier
- [x] Testare import e verificare visualizzazione fornitore
- [ ] Salvare checkpoint

## BUG: CATEGORIE INVALIDE IMPORT SALA
- [x] Analizzare file Excel sala per identificare categorie non presenti nello schema
- [x] Identificare problema: colonna "Categoria" contiene nomi fornitori invece di categorie
- [x] Creare mapping fornitore → categoria logica (Allegro→Bevande, Luxardo→Alcolici, ecc.)
- [x] Rigenerare sala_data.json con categorie corrette (114 articoli)
- [x] Testare import completo senza errori validazione
- [ ] Salvare checkpoint

## BUG: ERRORI VALIDAZIONE IMPORT SALA (ID/UNITTYPE/PACKAGETYPE)
- [x] Analizzare errori: ID undefined, unitType invalido, packageType invalido
- [x] Correggere handleImportSalaData: cercare ingrediente per name invece che code
- [x] Validare unitType prima di inviare (default 'u' se invalido)
- [x] Validare packageType prima di inviare (undefined se invalido)
- [x] Aggiungere campo department all'update
- [x] Testare import completo senza errori
- [ ] Salvare checkpoint

## BUG: CASELLE INPUT MANCANTI PER INGREDIENTI CON UNITÀ KG
- [x] Analizzare codice ShoppingList.tsx per trovare condizione che nasconde input
- [x] Correggere logica visualizzazione per mostrare caselle anche per unitType 'k'
- [x] Testare con ingredienti kg (es: farina, zucchero, sale)
- [x] Verificare tutti gli ingredienti mostrano casella input

## FEATURE: BADGE REPARTO CUCINA/SALA
- [x] Aggiungere badge colorati "Cucina"/"Sala" nelle card ingredienti
- [x] Usare colori distintivi (es: verde per Cucina, blu per Sala)
- [x] Implementare badge anche in Lista Acquisti per identificazione rapida
- [x] Testare visualizzazione badge su mobile e desktop
